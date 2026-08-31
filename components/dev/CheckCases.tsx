"use client";

import { useEffect, useState } from "react";
import {
  checkFormLabel,
  checkHeadingOrder,
  checkHeadingSingle,
  checkImageAlt,
  checkLayoutResult,
  checkListGrouping,
  type CheckResult,
} from "@/lib/judging/checks";
import { openJudgeDocument } from "@/lib/judging/judgeFrame";

type Case = {
  group: string;
  name: string;
  html: string;
  css?: string;
  shouldPass: boolean;
  run: (judgeDocument: Document) => CheckResult;
};

const GRID_CSS = `
.tiles { display: grid; grid-template-columns: repeat(2, 200px); gap: 16px; }
.row { display: flex; gap: 16px; margin-bottom: 16px; }
.tile { width: 200px; height: 80px; background: #ddd; }
.stack .tile { margin-bottom: 16px; }
`;

const tile = '<div class="tile"></div>';
const FLAT_GRID = `<div class="tiles">${tile.repeat(6)}</div>`;
const NESTED_GRID = `<div class="tiles-rows">${`<div class="row">${tile.repeat(2)}</div>`.repeat(3)}</div>`;
const STACKED = `<div class="stack">${tile.repeat(6)}</div>`;

const GRID_ACCEPT = { columns: 2, rows: 3 };

const CASES: Case[] = [
  // heading-order (엔진 상시)
  {
    group: "heading-order",
    name: "h1 → h2 → h3 은 통과",
    html: "<h1>가</h1><h2>나</h2><h3>다</h3>",
    shouldPass: true,
    run: (doc) => checkHeadingOrder(doc),
  },
  {
    group: "heading-order",
    name: "h1 → h3 은 실패",
    html: "<h1>가</h1><h3>나</h3>",
    shouldPass: false,
    run: (doc) => checkHeadingOrder(doc),
  },
  {
    group: "heading-order",
    name: "레벨이 내려가는 것은 건너뜀이 아니다",
    html: "<h1>가</h1><h2>나</h2><h3>다</h3><h2>라</h2>",
    shouldPass: true,
    run: (doc) => checkHeadingOrder(doc),
  },

  // heading-single (엔진 상시)
  {
    group: "heading-single",
    name: "h1이 하나면 통과",
    html: "<h1>가</h1><h2>나</h2>",
    shouldPass: true,
    run: (doc) => checkHeadingSingle(doc),
  },
  {
    group: "heading-single",
    name: "h1이 둘이면 실패",
    html: "<h1>가</h1><h1>나</h1>",
    shouldPass: false,
    run: (doc) => checkHeadingSingle(doc),
  },
  {
    group: "heading-single",
    name: "h1이 없으면 실패",
    html: "<h2>가</h2>",
    shouldPass: false,
    run: (doc) => checkHeadingSingle(doc),
  },

  // image-alt
  {
    group: "image-alt",
    name: "alt가 있으면 통과",
    html: '<img src="a.png" alt="상품 사진">',
    shouldPass: true,
    run: (doc) => checkImageAlt(doc),
  },
  {
    group: "image-alt",
    name: "빈 alt(장식 선언)도 통과",
    html: '<img src="a.png" alt="">',
    shouldPass: true,
    run: (doc) => checkImageAlt(doc),
  },
  {
    group: "image-alt",
    name: "alt 속성이 없으면 실패",
    html: '<img src="a.png" alt="가"><img src="b.png">',
    shouldPass: false,
    run: (doc) => checkImageAlt(doc),
  },

  // form-label
  {
    group: "form-label",
    name: "label로 감싸면 통과",
    html: "<label>이름 <input></label>",
    shouldPass: true,
    run: (doc) => checkFormLabel(doc),
  },
  {
    group: "form-label",
    name: "label[for]로 연결하면 통과",
    html: '<label for="q">검색</label><input id="q">',
    shouldPass: true,
    run: (doc) => checkFormLabel(doc),
  },
  {
    group: "form-label",
    name: "레이블이 없으면 실패",
    html: "<input>",
    shouldPass: false,
    run: (doc) => checkFormLabel(doc),
  },
  {
    group: "form-label",
    name: "submit 버튼은 레이블 대상이 아니다",
    html: '<input type="submit" value="보내기">',
    shouldPass: true,
    run: (doc) => checkFormLabel(doc),
  },

  // list-grouping
  {
    group: "list-grouping",
    name: "6개 항목 한 목록 — accept {1,6} 만족",
    html: `<ul>${"<li>항목</li>".repeat(6)}</ul>`,
    shouldPass: true,
    run: (doc) =>
      checkListGrouping(doc, [
        { groupCount: 1, itemsPerGroup: 6 },
        { groupCount: 3, itemsPerGroup: 2 },
      ]),
  },
  {
    group: "list-grouping",
    name: "2개짜리 목록 3벌 — accept {3,2} 만족",
    html: `${`<ul>${"<li>항목</li>".repeat(2)}</ul>`.repeat(3)}`,
    shouldPass: true,
    run: (doc) =>
      checkListGrouping(doc, [
        { groupCount: 1, itemsPerGroup: 6 },
        { groupCount: 3, itemsPerGroup: 2 },
      ]),
  },
  {
    group: "list-grouping",
    name: "목록으로 묶지 않으면 실패",
    html: `<div>${"<div>항목</div>".repeat(6)}</div>`,
    shouldPass: false,
    run: (doc) =>
      checkListGrouping(doc, [
        { groupCount: 1, itemsPerGroup: 6 },
        { groupCount: 3, itemsPerGroup: 2 },
      ]),
  },
  {
    group: "list-grouping",
    name: "항목마다 내부 구조가 달라도 통과",
    html: `<ul><li><span>가</span></li><li><span>나</span><em>신상</em></li><li>다</li><li>라</li><li>마</li><li>바</li></ul>`,
    shouldPass: true,
    run: (doc) => checkListGrouping(doc, [{ groupCount: 1, itemsPerGroup: 6 }]),
  },
  {
    group: "list-grouping",
    name: "관계없는 목록이 함께 있어도 통과",
    html: `<ul>${"<li>항목</li>".repeat(6)}</ul><ul><li>푸터</li><li>링크</li></ul>`,
    shouldPass: true,
    run: (doc) => checkListGrouping(doc, [{ groupCount: 1, itemsPerGroup: 6 }]),
  },

  // layout-result
  {
    group: "layout-result",
    name: "평면 마크업 6개가 2열 3행이면 통과",
    html: FLAT_GRID,
    css: GRID_CSS,
    shouldPass: true,
    run: (doc) => checkLayoutResult(doc, GRID_ACCEPT),
  },
  {
    group: "layout-result",
    name: "행으로 감싼 마크업도 같은 배치면 통과",
    html: NESTED_GRID,
    css: GRID_CSS,
    shouldPass: true,
    run: (doc) => checkLayoutResult(doc, GRID_ACCEPT),
  },
  {
    group: "layout-result",
    name: "세로로 쌓으면 실패",
    html: STACKED,
    css: GRID_CSS,
    shouldPass: false,
    run: (doc) => checkLayoutResult(doc, GRID_ACCEPT),
  },
  {
    group: "layout-result",
    name: "개수가 맞아도 3열 2행이면 실패",
    html: `<div class="three">${tile.repeat(6)}</div>`,
    css: `${GRID_CSS}\n.three { display: grid; grid-template-columns: repeat(3, 150px); gap: 16px; }\n.three .tile { width: 150px; }`,
    shouldPass: false,
    run: (doc) => checkLayoutResult(doc, GRID_ACCEPT),
  },
];

type CaseResult = { group: string; name: string; passed: boolean; detail: string };

async function runCases(): Promise<CaseResult[]> {
  const results: CaseResult[] = [];

  for (const testCase of CASES) {
    const result = await openJudgeDocument(testCase.html, testCase.css ?? "", testCase.run);
    results.push({
      group: testCase.group,
      name: testCase.name,
      passed: result.passed === testCase.shouldPass,
      detail: `판정 ${result.passed ? "통과" : "실패"} · 실제 ${JSON.stringify(result.actual)}`,
    });
  }

  return results;
}

export default function CheckCases() {
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
      <h2 className="text-base font-medium">유형별 판정</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        {results.length}건 중 {results.length - failed}건 통과
        {failed > 0 ? `, ${failed}건 실패` : ""}
      </p>

      <ul className="mt-3 space-y-1.5">
        {results.map((entry) => (
          <li key={`${entry.group}-${entry.name}`} className="text-sm">
            <span className={entry.passed ? "text-chrome-success" : "text-chrome-danger"}>
              {entry.passed ? "통과" : "실패"}
            </span>{" "}
            <span className="text-chrome-muted">[{entry.group}]</span> {entry.name}
            <span className="block pl-9 text-xs text-chrome-muted">{entry.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
