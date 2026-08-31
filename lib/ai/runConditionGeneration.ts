/**
 * 2·3단계 실행 (브라우저 측).
 *
 * 구역 확정 이후에 부른다. 구역마다 따로 요청해 한 요청의 실행 시간을
 * 구역 수와 무관하게 만든다. 받은 조건은 저장 전에 스키마 검증을 거치며,
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

type SectionResponse = {
  id?: string;
  rubric?: unknown[];
  example?: { html: string; css: string };
  error?: string;
};

/**
 * 동시에 띄우는 요청 수.
 *
 * 순차 실행은 구역 수만큼 시간이 늘고, 전부 동시에 띄우면 속도 제한에 걸린다.
 */
const CONCURRENCY = 4;

/** 목록을 정해진 수만큼만 동시에 처리한다. 입력 순서대로 결과를 돌려준다. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function runner() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner));
  return results;
}

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

export async function runConditionGeneration(
  source: StoredSource,
  onProgress?: (done: number, total: number) => void,
): Promise<ConditionOutcome> {
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

  // 구역 목록은 모든 요청에 함께 넘긴다. 자기 구역이 페이지의 어디쯤인지 알아야
  // 제목 단계를 정할 수 있고, 그래야 나눠 만들어도 결합 문서가 성립한다.
  const outline = source.sections.map((section) => ({
    id: section.id,
    name: section.name,
    order: section.order,
  }));

  let done = 0;
  const responses = await mapWithLimit(source.sections, CONCURRENCY, async (section) => {
    let result: SectionResponse;
    try {
      const response = await fetch("/api/analyze/conditions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image,
          mediaType: source.source.file.type,
          section: {
            id: section.id,
            name: section.name,
            order: section.order,
            bounds: section.bounds,
            structure: section.structure,
            sameStructureAs: section.sameStructureAs,
          },
          outline,
          mainTitleSectionId: source.mainTitleSectionId,
        }),
      });
      result = (await response.json()) as SectionResponse;
      if (!response.ok) {
        result = { error: result.error ?? `${section.name} 구역의 조건 생성에 실패했습니다.` };
      }
    } catch (error) {
      result = {
        error: error instanceof Error ? error.message : `${section.name} 구역의 요청이 실패했습니다.`,
      };
    }
    done += 1;
    onProgress?.(done, source.sections.length);
    return result;
  });

  const failed = responses.find((entry) => entry.error !== undefined || !entry.rubric || !entry.example);
  if (failed) {
    return { ok: false, error: failed.error ?? "조건 생성에 실패했습니다.", issues: [] };
  }

  // 검증은 저장된 구역 순서와 최상위 제목 구역을 기준으로 수행한다.
  const rubricById = new Map(
    responses.map((entry, index) => [source.sections[index].id, entry.rubric ?? []]),
  );
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

  const exampleById = new Map(
    responses.map((entry, index) => [source.sections[index].id, entry.example]),
  );
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
