/**
 * 조건 유형 단일 정의 (F-02-15).
 *
 * 스키마 검증용 열거형과 프롬프트 주입 텍스트를 **모두 이 상수에서 파생**한다.
 * 두 곳에 따로 정의하면 "프롬프트가 제시한 유형"과 "검증이 통과시키는 유형"이
 * 어긋날 수 있으므로, 파생 함수 외의 경로로 목록을 다시 적지 않는다.
 *
 * 명세는 PRD 4.6.4의 조건 유형 정의표다.
 */

/** 조건을 만드는 주체. */
export type ConditionOrigin =
  /** 판정 엔진이 항상 검사한다. rubric에 포함되지 않는다 (F-08-09). */
  | "engine"
  /** AI가 구역별 rubric에 생성한다. */
  | "ai";

/** 화이트리스트 등재 상태. */
export type ConditionStatus = "active" | "deferred";

/** 판정에 넘길 문서. */
export type ConditionScope =
  /** 선행 구역 HTML을 결합한 문서 (F-08-05). */
  | "combined"
  /** 현재 구역 문서. */
  | "section";

/** accept 배열이 가질 수 있는 항목 수. */
export type AcceptCardinality =
  /** accept를 쓰지 않는다. */
  | "none"
  /** 정확히 1개 (F-02-14). */
  | "single"
  /** 1개 이상. 해석이 갈리는 경우 복수 허용. */
  | "multiple";

export const CONDITION_TYPES = [
  {
    id: "heading-order",
    origin: "engine",
    status: "active",
    scope: "combined",
    check: "제목 요소의 레벨이 2 이상 건너뛰지 않는지",
    acceptCardinality: "none",
    acceptKeys: [],
    rationale: "`h1` → `h3`은 명백한 오류",
  },
  {
    id: "heading-single",
    origin: "engine",
    status: "active",
    scope: "combined",
    check: "문서 내 `h1`이 정확히 1개인지",
    acceptCardinality: "none",
    acceptKeys: [],
    rationale: "문서 구조의 기본",
  },
  {
    id: "image-alt",
    origin: "ai",
    status: "active",
    scope: "section",
    check: "구역 내 모든 의미 있는 이미지에 `alt`가 존재하는지",
    acceptCardinality: "none",
    acceptKeys: [],
    rationale: "접근성 필수 요건",
  },
  {
    id: "list-grouping",
    origin: "ai",
    status: "active",
    scope: "section",
    check: "구역 내에 N개의 동일 구조 항목을 담은 목록이 존재하는지",
    // 격자 구조에서 반복 단위 해석이 갈리므로 복수 허용 (F-02-13).
    acceptCardinality: "multiple",
    acceptKeys: ["groupCount", "itemsPerGroup"],
    rationale: "목록 요소의 정의에 부합",
  },
  {
    id: "form-label",
    origin: "ai",
    status: "active",
    scope: "section",
    check: "구역 내 모든 폼 컨트롤에 레이블이 연결되었는지",
    acceptCardinality: "none",
    acceptKeys: [],
    rationale: "접근성 필수 요건",
  },
  {
    id: "layout-result",
    origin: "ai",
    status: "active",
    scope: "section",
    check: "N개 형제 말단 요소의 렌더 측정값이 기대 배치와 일치하는지",
    // 중첩과 평면의 차이는 렌더 결과가 같아 흡수되므로 복수 해석이 불필요 (F-02-14).
    acceptCardinality: "single",
    acceptKeys: ["columns", "rows"],
    rationale: "측정 가능한 객관적 기준",
  },
  {
    id: "heading-hierarchy",
    origin: "ai",
    // 구조 패턴으로 정의하려면 두 대상을 특정해야 해 성격이 다르다.
    // 6개 유형으로 검증한 뒤 필요성을 판단한다 (PRD 4.6.4).
    status: "deferred",
    scope: "section",
    check: "지정된 두 요소의 제목 레벨 상하 관계",
    acceptCardinality: "none",
    acceptKeys: [],
    rationale: "보류",
  },
] as const satisfies readonly ConditionTypeDef[];

export type ConditionTypeDef = {
  id: string;
  origin: ConditionOrigin;
  status: ConditionStatus;
  scope: ConditionScope;
  check: string;
  acceptCardinality: AcceptCardinality;
  acceptKeys: readonly string[];
  rationale: string;
};

export type ConditionTypeId = (typeof CONDITION_TYPES)[number]["id"];

/** 현재 화이트리스트에 있는 유형. 보류 유형은 제외된다. */
export const ACTIVE_CONDITION_TYPES = CONDITION_TYPES.filter(
  (type) => type.status === "active",
);

/** 판정 엔진이 항상 검사하는 유형 (F-08-09). */
export const ENGINE_CONDITION_TYPES = ACTIVE_CONDITION_TYPES.filter(
  (type) => type.origin === "engine",
);

/** AI가 rubric에 생성하는 유형. */
export const AI_CONDITION_TYPES = ACTIVE_CONDITION_TYPES.filter(
  (type) => type.origin === "ai",
);

const BY_ID = new Map(CONDITION_TYPES.map((type) => [type.id as string, type]));

/** 유형 정의를 찾는다. 보류 유형도 반환하므로 상태를 함께 확인해야 한다. */
export function findConditionType(id: string): ConditionTypeDef | undefined {
  return BY_ID.get(id);
}

/** 필수 조건으로 쓸 수 있는 유형인지. 보류 유형은 false. */
export function isActiveConditionType(id: string): boolean {
  return findConditionType(id)?.status === "active";
}

/**
 * 프롬프트의 `{{CONDITION_TYPES}}` 자리에 넣을 표를 만든다 (3단계에서 사용).
 *
 * 엔진 상시 유형과 보류 유형은 제외한다. AI가 생성해서는 안 되는 유형을
 * 표에 넣어두고 "생성하지 마십시오"라고 덧붙이는 것보다, 애초에 보이지
 * 않게 하는 편이 어긋날 여지가 적다.
 */
export function buildPromptConditionTypeTable(): string {
  const header = "| 유형 | 검사 내용 | 파라미터 |\n|---|---|---|";
  const rows = AI_CONDITION_TYPES.map((type) => {
    const params =
      type.acceptKeys.length > 0 ? type.acceptKeys.map((key) => `\`${key}\``).join(", ") : "없음";
    return `| \`${type.id}\` | ${type.check} | ${params} |`;
  });
  return [header, ...rows].join("\n");
}
