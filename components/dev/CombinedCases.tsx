"use client";

import { useEffect, useState } from "react";
import { buildCombinedDocument, type SectionInput } from "@/lib/judging/combined";
import { judgeSection } from "@/lib/judging/judge";

type CaseResult = { name: string; passed: boolean; detail: string };

function section(
  id: string,
  order: number,
  status: SectionInput["status"],
  html: string,
  options: { css?: string; example?: string } = {},
): SectionInput {
  return {
    id,
    order,
    status,
    code: { html, css: options.css ?? "" },
    example: { html: options.example ?? "", css: "" },
  };
}

/** 결합 문서에서 특정 태그 수를 센다. */
function countTags(html: string, tag: string): number {
  return html.split(`<${tag}`).length - 1;
}

async function runCases(): Promise<CaseResult[]> {
  const results: CaseResult[] = [];

  // 1. 현재 구역은 자기 order 자리에 들어간다
  {
    const sections = [
      section("sec-01", 1, "passed", "<header>로고</header>"),
      section("sec-02", 2, "in_progress", "<h1>제목</h1>"),
      section("sec-03", 3, "passed", "<h2>상품</h2>"),
      section("sec-04", 4, "passed", "<h2>배너</h2>"),
    ];
    const combined = buildCombinedDocument(sections, "sec-02");
    const order = combined.includedSectionIds.join(" ");
    results.push({
      name: "현재 구역이 맨 뒤가 아니라 자기 order 자리에 들어간다",
      passed: order === "sec-01 sec-02 sec-03 sec-04",
      detail: `결합 순서 = ${order}`,
    });
  }

  // 2. 순서가 틀리면 heading-order 위반을 놓친다
  {
    const sections = [
      section("sec-01", 1, "passed", "<header>로고</header>"),
      section("sec-02", 2, "in_progress", "<h1>제목</h1>"),
      section("sec-03", 3, "passed", "<h3>소제목</h3>"),
    ];
    const result = await judgeSection({
      sections,
      currentSectionId: "sec-02",
      mainTitleSectionId: "sec-02",
      required: [],
      recommended: [],
    });
    const headingOrder = result.outcomes.find((outcome) => outcome.type === "heading-order");
    results.push({
      name: "자기 자리에 넣어야 h1 → h3 건너뜀이 잡힌다",
      // 맨 뒤에 붙였다면 h3 → h1 순서가 되어 건너뜀이 아니게 되고 통과해버린다.
      passed: headingOrder?.passed === false,
      detail: `heading-order 판정 = ${headingOrder?.passed ? "통과" : "실패"}, 실제 ${JSON.stringify(headingOrder?.actual)}`,
    });
  }

  // 3. 현재 구역보다 뒤에 있는 통과 구역도 포함한다
  {
    const sections = [
      section("sec-01", 1, "passed", "<header>로고</header>"),
      section("sec-02", 2, "passed", "<h1>제목</h1>"),
      section("sec-03", 3, "in_progress", "<h2>상품</h2>"),
    ];
    const result = await judgeSection({
      sections,
      currentSectionId: "sec-03",
      mainTitleSectionId: "sec-02",
      required: [],
      recommended: [],
    });
    const single = result.outcomes.find((outcome) => outcome.type === "heading-single");
    results.push({
      name: "다른 구역의 h1이 포함되어 현재 구역이 h1 없이도 통과한다",
      passed: single?.passed === true,
      detail: `heading-single 실제 = ${JSON.stringify(single?.actual)}`,
    });
  }

  // 4. revealed 구역은 예시 코드로 결합한다
  {
    const sections = [
      // 학습자는 h1을 둘 쓴 채 시도를 소진했고, 예시에는 h1이 없다.
      section("sec-01", 1, "revealed", "<h1>가</h1><h1>나</h1>", {
        example: "<header>로고</header>",
      }),
      section("sec-02", 2, "in_progress", "<h1>제목</h1>"),
    ];
    const combined = buildCombinedDocument(sections, "sec-02");
    const result = await judgeSection({
      sections,
      currentSectionId: "sec-02",
      mainTitleSectionId: "sec-02",
      required: [],
      recommended: [],
    });
    const single = result.outcomes.find((outcome) => outcome.type === "heading-single");
    results.push({
      name: "revealed 구역의 위반이 전파되지 않는다 (예시 코드로 대체)",
      passed: single?.passed === true && countTags(combined.html, "h1") === 1,
      detail: `결합 문서의 h1 = ${countTags(combined.html, "h1")}개, 학습자 코드였다면 3개`,
    });
    results.push({
      name: "예시로 대체된 구역을 기록한다 (F-08-08)",
      passed: result.substitutedSectionIds.join() === "sec-01",
      detail: `대체 구역 = ${JSON.stringify(result.substitutedSectionIds)}`,
    });
  }

  // 5. CSS는 결합하지 않는다
  {
    const sections = [
      section("sec-01", 1, "passed", "<header>로고</header>", { css: ".card { color: red }" }),
      section("sec-02", 2, "in_progress", "<h1>제목</h1>", { css: ".card { color: blue }" }),
    ];
    const combined = buildCombinedDocument(sections, "sec-02");
    results.push({
      name: "결합 문서에 CSS가 들어가지 않는다 (F-08-07)",
      passed: !combined.html.includes(".card"),
      detail: `결합 HTML 길이 ${combined.html.length}자, ".card" 포함 여부 = ${combined.html.includes(".card")}`,
    });
  }

  // 6. 최상위 제목 구역 이전에는 적용하지 않는다
  {
    const sections = [
      section("sec-01", 1, "in_progress", "<header>로고</header>"),
      section("sec-02", 2, "locked", ""),
    ];
    const result = await judgeSection({
      sections,
      currentSectionId: "sec-01",
      mainTitleSectionId: "sec-02",
      required: [],
      recommended: [],
    });
    results.push({
      name: "최상위 제목 구역 이전에는 문서 전체 조건을 건너뛴다 (F-08-10)",
      passed: !result.documentScopeApplied && result.outcomes.length === 0,
      detail: `적용 여부 = ${result.documentScopeApplied}, 조건 수 = ${result.outcomes.length}`,
    });
  }

  // 7. 미개방 구역은 결합하지 않는다
  {
    const sections = [
      section("sec-01", 1, "passed", "<header>로고</header>"),
      section("sec-02", 2, "in_progress", "<h1>제목</h1>"),
      section("sec-03", 3, "locked", "<h2>아직</h2>"),
    ];
    const combined = buildCombinedDocument(sections, "sec-02");
    results.push({
      name: "locked 구역은 결합 대상에서 제외한다",
      passed: !combined.includedSectionIds.includes("sec-03"),
      detail: `결합 순서 = ${combined.includedSectionIds.join(" ")}`,
    });
  }

  return results;
}

export default function CombinedCases() {
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

  if (error) return <p className="mt-3 text-sm text-chrome-danger">실행 실패: {error}</p>;
  if (!results) return <p className="mt-3 text-sm text-chrome-muted">판정 중…</p>;

  const failed = results.filter((entry) => !entry.passed).length;

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">결합 판정</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        {results.length}건 중 {results.length - failed}건 통과
        {failed > 0 ? `, ${failed}건 실패` : ""}
      </p>

      <ul className="mt-3 space-y-1.5">
        {results.map((entry) => (
          <li key={entry.name} className="text-sm">
            <span className={entry.passed ? "text-chrome-success" : "text-chrome-danger"}>
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
