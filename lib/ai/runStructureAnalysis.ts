/**
 * 1단계 구조 분석 실행 (브라우저 측).
 *
 * 이미지를 서버로 보내고, 받은 구역 정보를 저장 구조에 맞춰 넣는다.
 * 조건과 예시는 구역 확정 이후에 만들므로 여기서는 비워 둔다.
 */

import type { LearningMode, StoredSection, StoredSource } from "@/lib/storage/sourceStore";
import { saveSource } from "@/lib/storage/sourceStore";

type StructureResponse = {
  analysis?: {
    warning: string | null;
    mainTitleSectionId: string | null;
    sections: {
      id: string;
      name: string;
      bounds: { topRatio: number; heightRatio: number };
      sameStructureAs: string | null;
      structure: unknown;
    }[];
    reference: unknown;
  };
  cached?: boolean;
  attempts?: number;
  error?: string;
};

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      // data:image/webp;base64,XXXX 에서 뒷부분만 쓴다.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    reader.readAsDataURL(blob);
  });
}

/**
 * 통짜 모드로 학습할 수 있는 구역 수의 상한.
 *
 * 11구역 시안을 통짜로 돌려 본 결과 학습 도구로 성립하지 않았다. 조건 16개가
 * 시도 3회를 공유해 사실상 세 번 안에 전부 맞혀야 했고, 실패 피드백 16건이
 * 한꺼번에 나와 어디부터 손댈지 정할 수 없었으며, 힌트 단계도 조건마다 따로
 * 오르지 못했다. 조건 생성도 한 요청에 205초가 걸려 배포 한도를 넘었다.
 *
 * 구역당 약 19초이므로 5구역이면 약 95초로 한도 안에 들어오고, 조건 수도
 * 감당할 수준이다. 짧은 시안에서 문서 전체를 한 번에 설계하는 연습은 통짜로만
 * 할 수 있으므로 모드 자체를 없애지는 않는다.
 */
export const WHOLE_MODE_MAX_SECTIONS = 5;

export type AnalysisOutcome =
  | { ok: true; source: StoredSource; cached: boolean; warning: string | null }
  | { ok: false; error: string };

export async function runStructureAnalysis(source: StoredSource): Promise<AnalysisOutcome> {
  let image: string;
  try {
    image = await toBase64(source.source.file);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "이미지 오류" };
  }

  let payload: StructureResponse;
  try {
    const response = await fetch("/api/analyze/structure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, mediaType: source.source.file.type }),
    });
    payload = (await response.json()) as StructureResponse;
    if (!response.ok || !payload.analysis) {
      return { ok: false, error: payload.error ?? "분석에 실패했습니다." };
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "분석 요청 실패" };
  }

  const analysis = payload.analysis;

  const analyzed: StoredSection[] = analysis.sections.map((section, index) => ({
    id: section.id,
    name: section.name,
    order: index + 1,
    bounds: section.bounds,
    sameStructureAs: section.sameStructureAs ?? null,
    structure: section.structure,
    // 조건과 예시는 구역 확정 이후에 생성한다 (F-02-17).
    required: [],
    recommended: [],
    example: { html: "", css: "" },
  }));

  // 통짜로 감당할 수 있는 규모인지 분석 결과를 보고 판단한다. 모드는 등록
  // 시점에 고르지만 구역 수는 분석이 끝나야 알 수 있다.
  const tooManyForWhole =
    source.settings.mode === "whole" && analyzed.length > WHOLE_MODE_MAX_SECTIONS;
  const mode: LearningMode = tooManyForWhole ? "sectioned" : source.settings.mode;

  // 통짜 모드는 시안 전체가 한 구역이다 (PRD 6.6). 구역 편집 화면을 거치지
  // 않으므로 분석이 나눈 구역을 여기서 하나로 합친다.
  const sections: StoredSection[] =
    mode === "whole"
      ? [
          {
            ...analyzed[0],
            id: "sec-01",
            name: source.title,
            order: 1,
            bounds: { topRatio: 0, heightRatio: 1 },
            sameStructureAs: null,
            structure: { role: "페이지 전체", children: analyzed.map((entry) => entry.structure) },
          },
        ]
      : analyzed;

  const switchNotice = tooManyForWhole
    ? `통짜로 등록했지만 시안이 구역 ${analyzed.length}개로 나뉘어 구역별 모드로 바꿨습니다. ` +
      `구역 ${WHOLE_MODE_MAX_SECTIONS}개까지만 통짜로 작성할 수 있습니다. ` +
      "조건이 한꺼번에 너무 많이 나오면 어디부터 고쳐야 할지 알기 어렵고, 시도 횟수도 조건 전체가 나눠 쓰게 됩니다."
    : null;

  const updated: StoredSource = {
    ...source,
    stage: "sections-pending",
    reference: analysis.reference,
    // 앱이 판단한 안내가 있으면 그쪽을 먼저 보여준다.
    analysisWarning: switchNotice ?? analysis.warning,
    settings: { ...source.settings, mode },
    // 통짜 모드는 구역이 하나뿐이므로 그 구역이 검사 시작 지점이다.
    mainTitleSectionId: mode === "whole" ? "sec-01" : analysis.mainTitleSectionId,
    sections,
  };

  const saved = await saveSource(updated);
  if (!saved) return { ok: false, error: "분석 결과를 저장하지 못했습니다." };

  return { ok: true, source: updated, cached: payload.cached ?? false, warning: analysis.warning };
}
