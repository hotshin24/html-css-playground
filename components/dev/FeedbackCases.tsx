"use client";

import { useEffect, useState } from "react";
import { buildFailureFeedback, hintTier } from "@/lib/judging/feedback";
import { judgeSection } from "@/lib/judging/judge";
import type { RequiredCondition } from "@/lib/judging/schema";

type CaseResult = { name: string; passed: boolean; detail: string };

const TILE_CSS = ".tile { width: 200px; height: 80px; background: #ddd; margin-bottom: 8px; }";
const STACKED = `<div>${'<div class="tile"></div>'.repeat(6)}</div>`;

const LAYOUT_CONDITION: RequiredCondition = {
  id: "r1",
  level: "required",
  type: "layout-result",
  accept: [{ columns: 2, rows: 3 }],
  target: "제품 타일",
  desc: "AI가 쓴 설명. 판정과 어긋날 수 있으므로 문구에 쓰지 않는다.",
  hints: null,
};

const LIST_CONDITION: RequiredCondition = {
  id: "r2",
  level: "required",
  type: "list-grouping",
  accept: [
    { groupCount: 1, itemsPerGroup: 6 },
    { groupCount: 3, itemsPerGroup: 2 },
  ],
  target: "제품 타일",
  desc: "타일 6개를 목록으로 묶을 것",
  hints: {
    "1": "제품 영역을 다시 확인해보세요.",
    "2": "타일이 같은 구조로 반복되고 있습니다.",
    "3": "반복되는 항목은 목록 요소로 묶습니다.",
  },
};

async function runCases(): Promise<CaseResult[]> {
  const results: CaseResult[] = [];

  // 1. 측정값이 문구에 들어간다 (세로로 쌓인 경우)
  {
    const judged = await judgeSection({
      sections: [
        {
          id: "sec-01",
          order: 1,
          status: "in_progress",
          code: { html: STACKED, css: TILE_CSS },
          example: { html: "", css: "" },
        },
      ],
      currentSectionId: "sec-01",
      mainTitleSectionId: "sec-99",
      required: [LAYOUT_CONDITION],
      recommended: [],
    });
    const feedback = buildFailureFeedback(judged.outcomes, [LAYOUT_CONDITION], 1, 3);
    const message = feedback[0]?.message ?? "";

    results.push({
      name: "세로로 쌓인 배치를 측정값으로 설명한다",
      passed: message.includes("한 줄에 1개씩 6줄") && message.includes("가로 2개씩 3줄"),
      detail: message,
    });
    results.push({
      name: "실패 문구에 AI가 쓴 desc를 쓰지 않는다",
      passed: !message.includes("AI가 쓴 설명"),
      detail: `desc 포함 여부 = ${message.includes("AI가 쓴 설명")}`,
    });
  }

  // 2. 엔진 상시 조건의 문구와 힌트
  {
    const judged = await judgeSection({
      sections: [
        {
          id: "sec-01",
          order: 1,
          status: "in_progress",
          code: { html: "<h1>가</h1><h3>나</h3><h1>다</h1>", css: "" },
          example: { html: "", css: "" },
        },
      ],
      currentSectionId: "sec-01",
      mainTitleSectionId: "sec-01",
      required: [],
      recommended: [],
    });
    const feedback = buildFailureFeedback(judged.outcomes, [], 2, 3);
    const order = feedback.find((item) => item.type === "heading-order");
    const single = feedback.find((item) => item.type === "heading-single");

    results.push({
      name: "heading-order 문구에 실제 단계가 들어간다",
      passed: Boolean(order?.message.includes("1단계에서 3단계로")),
      detail: order?.message ?? "(없음)",
    });
    results.push({
      name: "heading-single 문구에 실제 개수가 들어간다",
      passed: Boolean(single?.message.includes("2개")),
      detail: single?.message ?? "(없음)",
    });
    results.push({
      name: "엔진 상시 조건은 코드에 고정된 힌트를 쓴다 (F-07-08)",
      passed: single?.hint === "페이지에서 가장 상위 제목이 몇 개인지 세어보세요.",
      detail: `2회차 힌트 = ${single?.hint ?? "(없음)"}`,
    });
  }

  // 3. AI 조건은 rubric의 힌트를, 없으면 고정 힌트를 쓴다
  {
    const outcomes = [
      {
        id: "r2",
        type: "list-grouping" as const,
        origin: "ai" as const,
        passed: false,
        expected: { accept: LIST_CONDITION.accept },
        actual: { listItemCounts: [3] },
      },
    ];

    const authored = buildFailureFeedback(outcomes, [LIST_CONDITION], 3, 3);
    const fallback = buildFailureFeedback(
      outcomes,
      [{ ...LIST_CONDITION, hints: null }],
      3,
      3,
    );

    results.push({
      name: "AI 조건은 rubric의 힌트를 쓴다",
      passed: authored[0]?.hint === "반복되는 항목은 목록 요소로 묶습니다.",
      detail: authored[0]?.hint ?? "(없음)",
    });
    results.push({
      name: "힌트가 없으면 고정 템플릿으로 대체한다",
      passed: fallback[0]?.hint === "반복되는 항목은 목록 요소로 묶습니다.",
      detail: fallback[0]?.hint ?? "(없음)",
    });
    results.push({
      name: "목록 조건 문구에 기대 형태와 실제 항목 수가 함께 들어간다",
      passed:
        authored[0]?.message.includes("6개짜리 목록 1벌 또는 2개짜리 목록 3벌") === true &&
        authored[0]?.message.includes("3개") === true,
      detail: authored[0]?.message ?? "(없음)",
    });
  }

  // 4. 회차별 수위와 압축 적용
  {
    const table = [
      { max: 3, tiers: [1, 2, 3].map((n) => hintTier(n, 3)) },
      { max: 2, tiers: [1, 2].map((n) => hintTier(n, 2)) },
      { max: 1, tiers: [1].map((n) => hintTier(n, 1)) },
      { max: 5, tiers: [1, 2, 3, 4, 5].map((n) => hintTier(n, 5)) },
    ];

    results.push({
      name: "3회 설정은 1 → 2 → 3 단계로 올라간다",
      passed: table[0].tiers.join() === "1,2,3",
      detail: `수위 = ${table[0].tiers.join(" → ")}`,
    });
    results.push({
      name: "시도 횟수가 적으면 수위를 압축한다 (마지막은 항상 구체적)",
      passed:
        table[1].tiers.join() === "2,3" &&
        table[2].tiers.join() === "3" &&
        table[3].tiers[4] === 3,
      detail: `2회 = ${table[1].tiers.join(" → ")}, 1회 = ${table[2].tiers.join()}, 5회 = ${table[3].tiers.join(" → ")}`,
    });
  }

  return results;
}

export default function FeedbackCases() {
  const [results, setResults] = useState<CaseResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    runCases()
      .then((next) => {
        if (!cancelled) setResults(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : String(caught));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="mt-3 text-sm text-red-600">실행 실패: {error}</p>;
  if (!results) return <p className="mt-3 text-sm text-chrome-muted">생성 중…</p>;

  const failed = results.filter((entry) => !entry.passed).length;

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">실패 문구와 힌트</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        {results.length}건 중 {results.length - failed}건 통과
        {failed > 0 ? `, ${failed}건 실패` : ""}
      </p>

      <ul className="mt-3 space-y-1.5">
        {results.map((entry) => (
          <li key={entry.name} className="text-sm">
            <span className={entry.passed ? "text-green-700" : "text-red-600"}>
              {entry.passed ? "통과" : "실패"}
            </span>{" "}
            {entry.name}
            <span className="block pl-9 text-xs text-chrome-muted">{entry.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
