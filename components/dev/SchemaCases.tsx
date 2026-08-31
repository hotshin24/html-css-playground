"use client";

import { validateAnalysis, type ValidationResult } from "@/lib/judging/schema";

type Case = {
  name: string;
  input: unknown;
  /** 기대 결과를 만족하면 통과. */
  expect: (result: ValidationResult) => boolean;
};

/** 검증 통과가 기대되는 최소 구성. */
function analysis(rubric: unknown[], mainTitleSectionId: unknown = "sec-01") {
  return {
    mainTitleSectionId,
    sections: [{ id: "sec-01", order: 1, rubric }],
  };
}

const HINTS = { "1": "가", "2": "나", "3": "다" };

const VALID_LIST_GROUPING = {
  id: "r1",
  level: "required",
  type: "list-grouping",
  target: "제품 타일",
  desc: "타일 6개를 목록으로 묶을 것",
  accept: [
    { groupCount: 1, itemsPerGroup: 6 },
    { groupCount: 3, itemsPerGroup: 2 },
  ],
  hints: HINTS,
};

/** 조건 하나가 거부되었는지. */
function rejectedCondition(result: ValidationResult, code: string) {
  return result.issues.some((issue) => issue.code === code && issue.rejected);
}

const CASES: Case[] = [
  {
    name: "정상 조건 세트는 통과한다",
    input: analysis([VALID_LIST_GROUPING]),
    expect: (r) => r.ok && r.sections[0].required.length === 1 && r.issues.length === 0,
  },
  {
    name: "화이트리스트 밖 유형은 거부한다",
    input: analysis([{ ...VALID_LIST_GROUPING, type: "semantic" }, VALID_LIST_GROUPING]),
    expect: (r) => rejectedCondition(r, "unknown-type") && r.ok && r.sections[0].required.length === 1,
  },
  {
    name: "보류 유형(heading-hierarchy)은 거부한다",
    input: analysis([
      { id: "r2", level: "required", type: "heading-hierarchy", hints: HINTS },
      VALID_LIST_GROUPING,
    ]),
    expect: (r) => rejectedCondition(r, "deferred-type"),
  },
  {
    name: "엔진 상시 유형이 rubric에 있으면 거부한다",
    input: analysis([
      { id: "r3", level: "required", type: "heading-single", hints: HINTS },
      VALID_LIST_GROUPING,
    ]),
    expect: (r) => rejectedCondition(r, "unknown-type"),
  },
  {
    name: "layout-result의 accept가 2개면 거부한다",
    input: analysis([
      {
        id: "r4",
        level: "required",
        type: "layout-result",
        accept: [
          { columns: 2, rows: 3 },
          { columns: 3, rows: 2 },
        ],
        hints: HINTS,
      },
      VALID_LIST_GROUPING,
    ]),
    expect: (r) => rejectedCondition(r, "accept-cardinality"),
  },
  {
    name: "list-grouping에 accept가 없으면 거부한다",
    input: analysis([
      { id: "r5", level: "required", type: "list-grouping", hints: HINTS },
      VALID_LIST_GROUPING,
    ]),
    expect: (r) => rejectedCondition(r, "invalid-accept"),
  },
  {
    name: "accept 항목에 파라미터가 빠지면 거부한다",
    input: analysis([
      {
        id: "r6",
        level: "required",
        type: "list-grouping",
        accept: [{ groupCount: 1 }],
        hints: HINTS,
      },
      VALID_LIST_GROUPING,
    ]),
    expect: (r) => rejectedCondition(r, "invalid-accept"),
  },
  {
    name: "파라미터를 쓰지 않는 유형의 accept는 무시하고 기록만 한다",
    input: analysis([
      {
        id: "r7",
        level: "required",
        type: "image-alt",
        accept: [{ count: 3 }],
        hints: HINTS,
      },
    ]),
    expect: (r) =>
      r.ok &&
      r.sections[0].required[0].accept.length === 0 &&
      r.issues.some((issue) => issue.code === "unused-accept" && !issue.rejected),
  },
  {
    name: "힌트가 없어도 통과시키되 기록한다",
    input: analysis([{ ...VALID_LIST_GROUPING, hints: undefined }]),
    expect: (r) =>
      r.ok &&
      r.sections[0].required[0].hints === null &&
      r.issues.some((issue) => issue.code === "missing-hints" && !issue.rejected),
  },
  {
    name: "mainTitleSectionId가 없는 구역을 가리키면 전체를 거부한다",
    input: analysis([VALID_LIST_GROUPING], "sec-99"),
    expect: (r) => !r.ok && rejectedCondition(r, "invalid-main-title-section"),
  },
  {
    name: "mainTitleSectionId가 null이면 전체를 거부한다",
    input: analysis([VALID_LIST_GROUPING], null),
    expect: (r) => !r.ok && rejectedCondition(r, "invalid-main-title-section"),
  },
  {
    name: "필수 조건이 하나도 남지 않은 구역은 전체를 거부한다",
    input: analysis([{ id: "r8", level: "recommended", type: "semantic-suggestion", desc: "권장" }]),
    expect: (r) => !r.ok && rejectedCondition(r, "no-required-condition"),
  },
  {
    name: "권장 조건은 검증 없이 통과시킨다",
    input: analysis([
      VALID_LIST_GROUPING,
      { id: "r9", level: "recommended", type: "semantic-suggestion", target: "주 메뉴", desc: "nav 권장" },
    ]),
    expect: (r) => r.ok && r.sections[0].recommended.length === 1,
  },
];

export default function SchemaCases() {
  const results = CASES.map((testCase) => {
    const result = validateAnalysis(testCase.input);
    let passed = false;
    try {
      passed = testCase.expect(result);
    } catch {
      passed = false;
    }
    return { name: testCase.name, passed, result };
  });

  const failed = results.filter((entry) => !entry.passed).length;

  return (
    <section className="mt-6">
      <h2 className="text-base font-medium">스키마 검증</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        {results.length}건 중 {results.length - failed}건 통과
        {failed > 0 ? `, ${failed}건 실패` : ""}
      </p>

      <ul className="mt-3 space-y-1">
        {results.map((entry) => (
          <li key={entry.name} className="flex gap-2 text-sm">
            <span className={entry.passed ? "text-green-700" : "text-red-600"}>
              {entry.passed ? "통과" : "실패"}
            </span>
            <span>{entry.name}</span>
          </li>
        ))}
      </ul>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-chrome-muted">검증 결과 원문</summary>
        <pre className="mt-2 overflow-x-auto rounded bg-chrome-panel p-3 text-xs">
          {JSON.stringify(
            results.map((entry) => ({ name: entry.name, passed: entry.passed, result: entry.result })),
            null,
            1,
          )}
        </pre>
      </details>
    </section>
  );
}
