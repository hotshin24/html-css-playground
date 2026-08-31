/**
 * 2·3단계 — 판정 조건과 모범 예시 생성 (F-02-03, F-02-04, F-02-17).
 *
 * 구역 하나를 처리한다. 구역 전체를 한 요청에 담으면 출력량이 구역 수에
 * 비례해 늘어나 11구역 시안에서 290초가 걸렸고, 배포 환경의 함수 실행 시간
 * 한도를 넘길 수밖에 없다. 구역 단위로 나누면 한 요청의 시간이 구역 수와
 * 무관해지고, 캐시도 구역 단위로 걸리며, 실패한 구역만 다시 부를 수 있다.
 *
 * 구역 확정 이후에 호출한다. 사용자가 병합·분할한 결과가 입력이므로,
 * 1단계 구조 트리는 참고로만 넘기고 시안 이미지를 함께 준다.
 */

import { askForJson } from "@/lib/ai/client";
import {
  buildConditionSystemPrompt,
  CONDITION_USER_PROMPT,
  EXAMPLE_SYSTEM_PROMPT,
  EXAMPLE_USER_PROMPT,
  CONDITION_PROMPT_VERSION,
} from "@/lib/ai/prompts";
import { cacheKey, readCache, writeCache } from "@/lib/ai/responseCache";

/**
 * 함수 최대 실행 시간(초).
 *
 * 구역 하나에 2단계와 3단계를 이어 부른다. 구역별 모드는 구역 수와 무관하게
 * 약 55초다. 통짜 모드는 시안 전체가 한 구역이라 더 걸리는데, 구역 5개 상한
 * (WHOLE_MODE_MAX_SECTIONS)에서 실측 약 97초였다. 여유를 두어 180으로 잡는다.
 */
export const maxDuration = 180;

type TargetSection = {
  id: string;
  name: string;
  order: number;
  bounds: { topRatio: number; heightRatio: number };
  structure: unknown;
  sameStructureAs: string | null;
};

/** 페이지 안에서 이 구역의 위치를 알려 주기 위한 최소 정보. */
type OutlineEntry = { id: string; name: string; order: number };

type RequestBody = {
  image?: string;
  mediaType?: string;
  section?: TargetSection;
  outline?: OutlineEntry[];
  mainTitleSectionId?: string | null;
  /** 검증용. 같은 입력으로 독립된 생성을 여러 번 받기 위해 캐시 키를 가른다. */
  variant?: string;
};

type RubricResponse = { rubric: unknown[] };
type ExampleResponse = { html: string; css: string };

const ALLOWED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: unknown): value is AllowedMediaType {
  return typeof value === "string" && ALLOWED_MEDIA_TYPES.includes(value as AllowedMediaType);
}

function hasRubricArray(value: unknown): value is RubricResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { rubric?: unknown }).rubric)
  );
}

function hasCode(value: unknown): value is ExampleResponse {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.html === "string" && typeof candidate.css === "string";
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const section = body.section;
  if (!body.image || !isAllowedMediaType(body.mediaType) || !section || !body.outline?.length) {
    return Response.json({ error: "이미지 또는 구역 정보가 없습니다." }, { status: 400 });
  }

  // 구역 목록을 함께 넘긴다. 이 구역이 페이지의 어디쯤인지 알아야 제목 단계를
  // 정할 수 있고, 그래야 구역을 나눠 만들어도 결합 문서에서 h1이 하나로 남는다.
  const targetPayload = JSON.stringify(
    {
      target: section,
      outline: body.outline,
      mainTitleSectionId: body.mainTitleSectionId ?? null,
      isMainTitleSection: body.mainTitleSectionId === section.id,
    },
    null,
    2,
  );
  const startedAt = Date.now();

  // 2단계 — 판정 조건
  const variant = body.variant ?? "";
  const rubricKey = cacheKey(
    "conditions",
    CONDITION_PROMPT_VERSION,
    body.image + targetPayload + variant,
  );
  let rubric = await readCache<RubricResponse>(rubricKey);
  let rubricAttempts = 0;

  if (!rubric) {
    const result = await askForJson<unknown>({
      system: buildConditionSystemPrompt(),
      userText: `${CONDITION_USER_PROMPT}\n\n${targetPayload}`,
      image: { data: body.image, mediaType: body.mediaType },
    });
    rubricAttempts = result.attempts;

    if (!result.ok) {
      return Response.json({ error: `조건 생성 실패 — ${result.error}` }, { status: 502 });
    }
    if (!hasRubricArray(result.value)) {
      return Response.json({ error: "조건 생성 결과의 형태가 올바르지 않습니다." }, { status: 502 });
    }
    rubric = result.value;
    await writeCache(rubricKey, rubric);
  }

  const conditionsDoneAt = Date.now();

  // 3단계 — 모범 예시. 조건이 먼저 확정되어야 예시가 조건에 종속되지 않는다.
  const rubricPayload = JSON.stringify(
    {
      section: { id: section.id, name: section.name, order: section.order },
      isMainTitleSection: body.mainTitleSectionId === section.id,
      rubric: rubric.rubric,
    },
    null,
    2,
  );
  const exampleKey = cacheKey("examples", CONDITION_PROMPT_VERSION, rubricPayload + variant);
  let examples = await readCache<ExampleResponse>(exampleKey);
  let exampleAttempts = 0;

  if (!examples) {
    const result = await askForJson<unknown>({
      system: EXAMPLE_SYSTEM_PROMPT,
      userText: `${EXAMPLE_USER_PROMPT}\n\n${rubricPayload}`,
    });
    exampleAttempts = result.attempts;

    if (!result.ok) {
      return Response.json({ error: `예시 생성 실패 — ${result.error}` }, { status: 502 });
    }
    if (!hasCode(result.value)) {
      return Response.json({ error: "예시 생성 결과의 형태가 올바르지 않습니다." }, { status: 502 });
    }
    examples = result.value;
    await writeCache(exampleKey, examples);
  }

  return Response.json({
    id: section.id,
    rubric: rubric.rubric,
    example: examples,
    attempts: { conditions: rubricAttempts, examples: exampleAttempts },
    // 배포 환경의 함수 실행 시간 한도를 가늠하기 위해 단계별로 나눠 돌려준다.
    elapsedMs: {
      conditions: conditionsDoneAt - startedAt,
      examples: Date.now() - conditionsDoneAt,
      total: Date.now() - startedAt,
    },
  });
}
