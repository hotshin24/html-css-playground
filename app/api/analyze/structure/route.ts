/**
 * 1단계 구조 분석 (F-02-01, F-02-02, F-02-05, F-02-16).
 *
 * 등록 시점에 한 번 호출한다. 조건·예시 생성은 구역 확정 이후이므로
 * 여기서는 구조와 구역만 받는다 (PRD 3장).
 */

import { askForJson } from "@/lib/ai/client";
import {
  STRUCTURE_PROMPT_VERSION,
  STRUCTURE_SYSTEM_PROMPT,
  STRUCTURE_USER_PROMPT,
} from "@/lib/ai/prompts";
import { cacheKey, readCache, writeCache } from "@/lib/ai/responseCache";

export type StructureAnalysis = {
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

type RequestBody = {
  image?: string;
  mediaType?: string;
  /** 검증용. 같은 이미지로 독립된 분석을 여러 번 받기 위해 캐시 키를 가른다. */
  variant?: string;
};

const ALLOWED_MEDIA_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AllowedMediaType = (typeof ALLOWED_MEDIA_TYPES)[number];

function isAllowedMediaType(value: unknown): value is AllowedMediaType {
  return typeof value === "string" && ALLOWED_MEDIA_TYPES.includes(value as AllowedMediaType);
}

/** 형태가 어긋난 응답을 저장하지 않도록 최소한만 확인한다. */
function looksLikeStructure(value: unknown): value is StructureAnalysis {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.sections) || candidate.sections.length === 0) return false;
  return candidate.sections.every((section) => {
    if (typeof section !== "object" || section === null) return false;
    const entry = section as Record<string, unknown>;
    const bounds = entry.bounds as Record<string, unknown> | undefined;
    return (
      typeof entry.id === "string" &&
      typeof entry.name === "string" &&
      typeof bounds?.topRatio === "number" &&
      typeof bounds?.heightRatio === "number"
    );
  });
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.image || !isAllowedMediaType(body.mediaType)) {
    return Response.json({ error: "이미지가 없거나 지원하지 않는 형식입니다." }, { status: 400 });
  }

  const key = cacheKey("structure", STRUCTURE_PROMPT_VERSION, body.image + (body.variant ?? ""));
  const cached = await readCache<StructureAnalysis>(key);
  if (cached) {
    return Response.json({ analysis: cached, cached: true, attempts: 0 });
  }

  const result = await askForJson<unknown>({
    system: STRUCTURE_SYSTEM_PROMPT,
    userText: STRUCTURE_USER_PROMPT,
    image: { data: body.image, mediaType: body.mediaType },
  });

  if (!result.ok) {
    return Response.json({ error: result.error, attempts: result.attempts }, { status: 502 });
  }

  if (!looksLikeStructure(result.value)) {
    return Response.json(
      { error: "분석 결과의 형태가 올바르지 않습니다.", attempts: result.attempts },
      { status: 502 },
    );
  }

  await writeCache(key, result.value);
  return Response.json({ analysis: result.value, cached: false, attempts: result.attempts });
}
