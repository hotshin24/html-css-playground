/**
 * Claude API 호출 (서버 전용).
 *
 * API 키는 서버에만 두고 Route Handler로 프록시한다.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { APIError } from "@anthropic-ai/sdk";

const MODEL = "claude-opus-5";

/** 분석 출력은 구역 수에 따라 길어질 수 있어 넉넉히 잡는다. */
const MAX_TOKENS = 32000;

/** 재시도 횟수 (F-02-07). */
const MAX_ATTEMPTS = 3;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) client = new Anthropic();
  return client;
}

export type ImageInput = {
  /** base64로 인코딩한 이미지. */
  data: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
};

export type AskOptions = {
  system: string;
  userText: string;
  image?: ImageInput;
};

/** 재시도해도 결과가 같은 오류. 키·요청 형식·잔액 문제가 여기 해당한다. */
function isPermanent(status: number | undefined): boolean {
  return status === 400 || status === 401 || status === 403 || status === 404;
}

/**
 * API 오류를 사람이 읽을 수 있는 문구로 바꾼다.
 * 응답 본문을 그대로 보여주면 화면에 JSON이 노출된다.
 */
function describeApiError(error: APIError): string {
  const body = error.error as { error?: { message?: string } } | undefined;
  const message = body?.error?.message;
  return message ? `API 오류 ${error.status}: ${message}` : `API 오류 ${error.status}`;
}

/** 응답에서 텍스트 블록만 이어 붙인다. thinking 블록은 버린다. */
function collectText(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/**
 * 모델이 코드 펜스를 붙이는 경우가 있어 방어적으로 벗겨낸다.
 * 프롬프트로 금지하고 있으나 파싱 실패는 재시도 비용이 크다.
 */
function stripFence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\n?/, "")
    .replace(/```$/, "")
    .trim();
}

export type AskResult<T> =
  | { ok: true; value: T; attempts: number }
  | { ok: false; error: string; attempts: number };

/**
 * JSON 하나를 돌려주는 호출을 수행한다.
 *
 * 파싱에 실패하거나 API가 오류를 내면 재시도한다. 마지막까지 실패하면
 * 오류 문구를 돌려주고 호출부가 화면에 알린다.
 */
export async function askForJson<T>(options: AskOptions): Promise<AskResult<T>> {
  let lastError = "알 수 없는 오류";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const content: Anthropic.ContentBlockParam[] = [];
      if (options.image) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: options.image.mediaType,
            data: options.image.data,
          },
        });
      }
      content.push({ type: "text", text: options.userText });

      // 출력이 길 수 있으므로 스트리밍으로 받아 요청 시간 초과를 피한다.
      const stream = getClient().messages.stream({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        thinking: { type: "adaptive" },
        system: options.system,
        messages: [{ role: "user", content }],
      });
      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") {
        lastError = "모델이 요청을 거절했습니다.";
        continue;
      }

      const text = stripFence(collectText(message));
      if (!text) {
        lastError = "빈 응답을 받았습니다.";
        continue;
      }

      return { ok: true, value: JSON.parse(text) as T, attempts: attempt };
    } catch (error) {
      if (error instanceof SyntaxError) {
        lastError = "응답을 JSON으로 읽을 수 없습니다.";
      } else if (error instanceof Anthropic.AuthenticationError) {
        // 키 문제는 재시도해도 같으므로 즉시 중단한다.
        return { ok: false, error: "API 키가 유효하지 않습니다.", attempts: attempt };
      } else if (error instanceof Anthropic.APIError) {
        lastError = describeApiError(error);
        // 요청 자체가 거절된 경우는 다시 보내도 같은 답이 온다.
        if (isPermanent(error.status)) {
          return { ok: false, error: lastError, attempts: attempt };
        }
      } else {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  return { ok: false, error: lastError, attempts: MAX_ATTEMPTS };
}
