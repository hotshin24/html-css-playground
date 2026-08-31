/**
 * 1단계 구조 분석 실행 (브라우저 측).
 *
 * 이미지를 서버로 보내고, 받은 구역 정보를 저장 구조에 맞춰 넣는다.
 * 조건과 예시는 구역 확정 이후에 만들므로 여기서는 비워 둔다.
 */

import type { StoredSection, StoredSource } from "@/lib/storage/sourceStore";
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

  const sections: StoredSection[] = analysis.sections.map((section, index) => ({
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

  const updated: StoredSource = {
    ...source,
    stage: "sections-pending",
    reference: analysis.reference,
    mainTitleSectionId: analysis.mainTitleSectionId,
    sections,
  };

  const saved = await saveSource(updated);
  if (!saved) return { ok: false, error: "분석 결과를 저장하지 못했습니다." };

  return { ok: true, source: updated, cached: payload.cached ?? false, warning: analysis.warning };
}
