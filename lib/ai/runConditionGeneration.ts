/**
 * 2·3단계 실행 (브라우저 측).
 *
 * 구역 확정 이후에 부른다. 받은 조건은 저장 전에 스키마 검증을 거치며,
 * 거부된 항목은 화면에 알린다. 등록 시점에 조건이 부실하면 학습 내내
 * 영향을 받기 때문이다.
 */

import { validateAnalysis, type SchemaIssue } from "@/lib/judging/schema";
import {
  saveSource,
  type SectionProgress,
  type StoredSection,
  type StoredSource,
} from "@/lib/storage/sourceStore";

type ConditionResponse = {
  rubric?: { sections: { id: string; rubric: unknown[] }[] };
  examples?: { sections: { id: string; html: string; css: string }[] };
  error?: string;
};

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("이미지를 읽을 수 없습니다."));
    reader.readAsDataURL(blob);
  });
}

/** 첫 구역만 열어 두고 나머지는 잠근다 (F-08-02). */
function initialProgress(sections: StoredSection[]): StoredSource["progress"] {
  const entries: Record<string, SectionProgress> = {};
  sections.forEach((section, index) => {
    entries[section.id] = {
      status: index === 0 ? "in_progress" : "locked",
      attemptsUsed: 0,
      code: { html: "", css: "" },
      needsRecheck: false,
      recheckCause: null,
    };
  });
  return { currentSection: sections[0]?.id ?? null, sections: entries };
}

export type ConditionOutcome =
  | { ok: true; source: StoredSource; issues: SchemaIssue[] }
  | { ok: false; error: string; issues: SchemaIssue[] };

export async function runConditionGeneration(source: StoredSource): Promise<ConditionOutcome> {
  let image: string;
  try {
    image = await toBase64(source.source.file);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "이미지 오류",
      issues: [],
    };
  }

  let payload: ConditionResponse;
  try {
    const response = await fetch("/api/analyze/conditions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        mediaType: source.source.file.type,
        sections: source.sections.map((section) => ({
          id: section.id,
          name: section.name,
          bounds: section.bounds,
          structure: section.structure,
        })),
      }),
    });
    payload = (await response.json()) as ConditionResponse;
    if (!response.ok || !payload.rubric || !payload.examples) {
      return { ok: false, error: payload.error ?? "조건 생성에 실패했습니다.", issues: [] };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "조건 생성 요청 실패",
      issues: [],
    };
  }

  // 검증은 저장된 구역 순서와 최상위 제목 구역을 기준으로 수행한다.
  const rubricById = new Map(payload.rubric.sections.map((entry) => [entry.id, entry.rubric]));
  const validated = validateAnalysis({
    mainTitleSectionId: source.mainTitleSectionId,
    sections: source.sections.map((section) => ({
      id: section.id,
      order: section.order,
      rubric: rubricById.get(section.id) ?? [],
    })),
  });

  if (!validated.ok) {
    return { ok: false, error: "생성된 조건이 검증을 통과하지 못했습니다.", issues: validated.issues };
  }

  const exampleById = new Map(payload.examples.sections.map((entry) => [entry.id, entry]));
  const validatedById = new Map(validated.sections.map((section) => [section.id, section]));

  const sections: StoredSection[] = source.sections.map((section) => {
    const checked = validatedById.get(section.id);
    const example = exampleById.get(section.id);
    return {
      ...section,
      required: checked?.required ?? [],
      recommended: checked?.recommended ?? [],
      example: { html: example?.html ?? "", css: example?.css ?? "" },
    };
  });

  const updated: StoredSource = {
    ...source,
    stage: "ready",
    sections,
    progress: initialProgress(sections),
  };

  const saved = await saveSource(updated);
  if (!saved) {
    return { ok: false, error: "생성된 조건을 저장하지 못했습니다.", issues: validated.issues };
  }

  return { ok: true, source: updated, issues: validated.issues };
}
