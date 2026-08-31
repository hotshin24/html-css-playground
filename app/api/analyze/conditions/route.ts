/**
 * 2·3단계 — 판정 조건과 모범 예시 생성 (F-02-03, F-02-04, F-02-17).
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

type SectionInput = {
  id: string;
  name: string;
  bounds: { topRatio: number; heightRatio: number };
  structure: unknown;
};

type RequestBody = {
  image?: string;
  mediaType?: string;
  sections?: SectionInput[];
  /** 검증용. 같은 입력으로 독립된 생성을 여러 번 받기 위해 캐시 키를 가른다. */
  variant?: string;
};

type RubricResponse = { sections: { id: string; rubric: unknown[] }[] };
type ExampleResponse = { sections: { id: string; html: string; css: string }[] };

const ALLOWED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: unknown): value is AllowedMediaType {
  return typeof value === "string" && ALLOWED_MEDIA_TYPES.includes(value as AllowedMediaType);
}

function hasSectionArray(value: unknown): value is { sections: { id: string }[] } {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.sections) &&
    candidate.sections.every(
      (entry) => typeof entry === "object" && entry !== null && typeof (entry as { id?: unknown }).id === "string",
    )
  );
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.image || !isAllowedMediaType(body.mediaType) || !body.sections?.length) {
    return Response.json({ error: "이미지 또는 구역 정보가 없습니다." }, { status: 400 });
  }

  const sectionsPayload = JSON.stringify({ sections: body.sections }, null, 2);

  // 2단계 — 판정 조건
  const variant = body.variant ?? "";
  const rubricKey = cacheKey("conditions", CONDITION_PROMPT_VERSION, body.image + sectionsPayload + variant);
  let rubric = await readCache<RubricResponse>(rubricKey);
  let rubricAttempts = 0;

  if (!rubric) {
    const result = await askForJson<unknown>({
      system: buildConditionSystemPrompt(),
      userText: `${CONDITION_USER_PROMPT}\n\n${sectionsPayload}`,
      image: { data: body.image, mediaType: body.mediaType },
    });
    rubricAttempts = result.attempts;

    if (!result.ok) {
      return Response.json({ error: `조건 생성 실패 — ${result.error}` }, { status: 502 });
    }
    if (!hasSectionArray(result.value)) {
      return Response.json({ error: "조건 생성 결과의 형태가 올바르지 않습니다." }, { status: 502 });
    }
    rubric = result.value as RubricResponse;
    await writeCache(rubricKey, rubric);
  }

  // 3단계 — 모범 예시. 조건이 먼저 확정되어야 예시가 조건에 종속되지 않는다.
  const rubricPayload = JSON.stringify(rubric, null, 2);
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
    if (!hasSectionArray(result.value)) {
      return Response.json({ error: "예시 생성 결과의 형태가 올바르지 않습니다." }, { status: 502 });
    }
    examples = result.value as ExampleResponse;
    await writeCache(exampleKey, examples);
  }

  return Response.json({
    rubric,
    examples,
    attempts: { conditions: rubricAttempts, examples: exampleAttempts },
  });
}
