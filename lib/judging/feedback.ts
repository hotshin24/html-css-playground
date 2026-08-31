/**
 * 실패 문구와 회차별 힌트 (F-07-01, F-07-07, F-07-08).
 *
 * 문구는 `desc`가 아니라 **유형별 고정 템플릿에 실제 측정값을 넣어** 만든다.
 * `desc`는 AI가 쓴 문장이라 실제 판정 내용과 어긋날 수 있고, 그러면 학습자는
 * 무엇을 고쳐야 할지 알 수 없다.
 */

import type { ConditionTypeId } from "@/lib/judging/conditionTypes";
import type { ConditionOutcome } from "@/lib/judging/judge";
import type { RequiredCondition } from "@/lib/judging/schema";

export type FeedbackItem = {
  conditionId: string;
  type: ConditionTypeId;
  /** 무엇이 어긋났는지. 측정값을 담는다. */
  message: string;
  /** 회차 수위에 맞춘 힌트. */
  hint: string;
};

type Values = Record<string, unknown> | null;

/** 마지막 글자에 받침이 있는지. 조사를 고르는 데 쓴다. */
function hasFinalConsonant(text: string): boolean {
  const code = text.charCodeAt(text.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 받침 유무에 따라 조사를 고른다. */
function josa(text: string, withFinal: string, withoutFinal: string): string {
  return hasFinalConsonant(text) ? withFinal : withoutFinal;
}

function num(values: Values, key: string): number | null {
  const value = values?.[key];
  return typeof value === "number" ? value : null;
}

function numbers(values: Values, key: string): number[] | null {
  const value = values?.[key];
  return Array.isArray(value) && value.every((item) => typeof item === "number")
    ? (value as number[])
    : null;
}

/** 줄마다 몇 개씩인지를 사람이 읽는 문장으로. */
function describeColumns(columns: number[]): string {
  const unique = new Set(columns);
  if (unique.size === 1) {
    return `한 줄에 ${columns[0]}개씩 ${columns.length}줄`;
  }
  return `줄마다 ${columns.join(", ")}개`;
}

/** accept 항목을 "6개짜리 목록 1벌" 형태로. */
function describeListAccept(accept: Record<string, unknown>[]): string {
  return accept
    .map((params) => {
      const items = num(params, "itemsPerGroup");
      const groups = num(params, "groupCount");
      return `${items}개짜리 목록 ${groups}벌`;
    })
    .join(" 또는 ");
}

function buildMessage(outcome: ConditionOutcome): string {
  switch (outcome.type) {
    case "heading-single": {
      const count = num(outcome.actual, "count") ?? 0;
      if (count === 0) return "문서에 최상위 제목이 없습니다. 하나 두어야 합니다.";
      return `문서에 최상위 제목이 ${count}개 있습니다. 하나만 두어야 합니다.`;
    }

    case "heading-order": {
      const from = num(outcome.actual, "from");
      const to = num(outcome.actual, "to");
      if (from === null || to === null) return "제목 단계가 순서대로 내려가지 않았습니다.";
      return `제목 단계가 ${from}단계에서 ${to}단계로 건너뛰었습니다. 한 단계씩 내려가야 합니다.`;
    }

    case "image-alt": {
      const total = num(outcome.actual, "imageCount") ?? 0;
      const missing = num(outcome.actual, "missingAlt") ?? 0;
      return `이미지 ${total}개 중 ${missing}개에 대체 텍스트 속성이 없습니다. 장식용 이미지라면 빈 값으로 두어도 됩니다.`;
    }

    case "form-label": {
      const total = num(outcome.actual, "controlCount") ?? 0;
      const unlabeled = num(outcome.actual, "unlabeled") ?? 0;
      return `입력 요소 ${total}개 중 ${unlabeled}개에 레이블이 연결되지 않았습니다.`;
    }

    case "list-grouping": {
      const accept = outcome.expected?.accept;
      const expectedText = Array.isArray(accept)
        ? describeListAccept(accept as Record<string, unknown>[])
        : "지정된 형태의 목록";
      const counts = numbers(outcome.actual, "listItemCounts");

      if (!counts || counts.length === 0) {
        return `반복되는 항목이 목록으로 묶이지 않았습니다. ${expectedText}${josa(expectedText, "이", "가")} 필요합니다.`;
      }
      return `목록은 있으나 항목 수가 맞지 않습니다. 현재 목록의 항목 수는 ${counts.join(", ")}개이고, ${expectedText}${josa(expectedText, "이", "가")} 필요합니다.`;
    }

    case "layout-result": {
      const expectedColumns = num(outcome.expected, "columns");
      const expectedRows = num(outcome.expected, "rows");
      const expectedText = `가로 ${expectedColumns}개씩 ${expectedRows}줄`;

      const actualColumns = numbers(outcome.actual, "columns");
      if (!actualColumns) {
        const size = (expectedColumns ?? 0) * (expectedRows ?? 0);
        return `${expectedText}로 놓인 항목 ${size}개를 찾지 못했습니다.`;
      }
      return `항목이 ${describeColumns(actualColumns)}로 놓여 있습니다. ${expectedText}${josa(expectedText, "이어야", "여야")} 합니다.`;
    }

    default:
      return "조건을 충족하지 않았습니다.";
  }
}

/**
 * 유형별 고정 힌트.
 *
 * 엔진 상시 조건은 `rubric`에 없어 `hints` 필드가 존재하지 않으므로 여기서
 * 정의한다 (F-07-08). AI 생성 조건도 힌트가 누락된 경우 이 값으로 대체한다.
 */
const FIXED_HINTS: Record<ConditionTypeId, [string, string, string]> = {
  "heading-single": [
    "문서 전체의 제목 구조를 확인해보세요.",
    "페이지에서 가장 상위 제목이 몇 개인지 세어보세요.",
    "최상위 제목은 문서에 하나만 두어야 합니다.",
  ],
  "heading-order": [
    "제목들의 단계가 순서대로 내려가는지 확인해보세요.",
    "앞선 제목보다 두 단계 이상 낮은 제목이 있습니다.",
    "제목 단계는 한 번에 한 단계씩만 내려갈 수 있습니다.",
  ],
  "image-alt": [
    "이미지 요소의 속성을 다시 확인해보세요.",
    "화면을 볼 수 없는 사용자에게 이 이미지를 어떻게 설명할지 생각해보세요.",
    "모든 이미지에는 대체 텍스트 속성이 필요합니다. 장식용이라면 빈 값으로 둡니다.",
  ],
  "form-label": [
    "입력 요소 주변의 설명 문구를 확인해보세요.",
    "설명 문구와 입력 요소가 서로 연결되어 있는지 생각해보세요.",
    "모든 입력 요소에는 레이블이 연결되어야 합니다.",
  ],
  "list-grouping": [
    "반복되는 항목이 있는 영역을 다시 확인해보세요.",
    "같은 구조가 여러 번 나타나고 있습니다. 이런 반복을 어떻게 표현하는지 생각해보세요.",
    "반복되는 항목은 목록 요소로 묶습니다.",
  ],
  "layout-result": [
    "이 영역의 배치를 시안과 비교해보세요.",
    "항목이 몇 개씩 몇 줄로 놓여야 하는지 시안에서 확인해보세요.",
    "시안과 같은 줄 수와 열 수가 되도록 배치해야 합니다.",
  ],
  "heading-hierarchy": [
    "제목들의 상하 관계를 확인해보세요.",
    "구역 제목과 항목 제목 중 어느 쪽이 상위인지 생각해보세요.",
    "항목 제목은 구역 제목보다 하위 단계여야 합니다.",
  ],
};

/**
 * 회차를 힌트 수위로 옮긴다 (F-07-01).
 *
 * 시도 횟수가 3회보다 적으면 단계를 압축한다. 마지막 시도에서는 항상
 * 가장 구체적인 힌트가 나오도록 올림으로 계산한다.
 */
export function hintTier(attempt: number, maxAttempts: number): 1 | 2 | 3 {
  if (maxAttempts <= 0) return 3;
  const tier = Math.ceil((attempt * 3) / maxAttempts);
  return Math.min(3, Math.max(1, tier)) as 1 | 2 | 3;
}

function resolveHint(
  outcome: ConditionOutcome,
  condition: RequiredCondition | undefined,
  tier: 1 | 2 | 3,
): string {
  const authored = condition?.hints?.[String(tier) as "1" | "2" | "3"];
  if (authored) return authored;
  return FIXED_HINTS[outcome.type]?.[tier - 1] ?? "조건을 다시 확인해보세요.";
}

/** 실패한 조건들에 대해 표시할 문구와 힌트를 만든다. */
export function buildFailureFeedback(
  outcomes: ConditionOutcome[],
  required: RequiredCondition[],
  attempt: number,
  maxAttempts: number,
): FeedbackItem[] {
  const tier = hintTier(attempt, maxAttempts);
  const byId = new Map(required.map((condition) => [condition.id, condition]));

  return outcomes
    .filter((outcome) => !outcome.passed)
    .map((outcome) => ({
      conditionId: outcome.id,
      type: outcome.type,
      message: buildMessage(outcome),
      hint: resolveHint(outcome, byId.get(outcome.id), tier),
    }));
}
