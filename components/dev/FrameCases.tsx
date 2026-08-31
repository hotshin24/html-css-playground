"use client";

import { useEffect, useState } from "react";
import { SOLUTIONS } from "@/fixtures/solutions";
import {
  buildJudgeDocument,
  JUDGE_FRAME_HEIGHT_PX,
  JUDGE_FRAME_WIDTH_PX,
  measureRect,
  openJudgeDocument,
} from "@/lib/judging/judgeFrame";

type CaseResult = { name: string; passed: boolean; detail: string };

/** 측정 대상. 타일 6개가 가로 2개씩 3행으로 놓인다. */
const TILE_HTML = `
<h1 id="title">제목</h1>
<div class="tiles">
  <div class="tile" id="t1"></div>
  <div class="tile" id="t2"></div>
  <div class="tile" id="t3"></div>
  <div class="tile" id="t4"></div>
  <div class="tile" id="t5"></div>
  <div class="tile" id="t6"></div>
</div>
`;

const TILE_CSS = `
.tiles { display: grid; grid-template-columns: repeat(2, 200px); gap: 20px; }
.tile { height: 100px; background: #ddd; }
`;

/** 사용자가 스크립트 실행을 시도할 만한 경로들. */
const SCRIPT_HTML = `
<h1 id="flag">변경 없음</h1>
<scr` + `ipt>document.getElementById('flag').textContent = '인라인 스크립트 실행됨';</scr` + `ipt>
<img src="does-not-exist.png" onerror="document.getElementById('flag').textContent = 'onerror 실행됨'">
<a id="link" href="javascript:document.getElementById('flag').textContent='javascript URL 실행됨'">링크</a>
`;

/**
 * display:none 대조군.
 * 판정용 프레임과 같은 문서를 띄우되 숨김 방식만 바꾼다.
 */
async function measureWithDisplayNone(): Promise<{ tileWidth: number; sameRow: boolean }> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.style.cssText = `display:none;width:${JUDGE_FRAME_WIDTH_PX}px;height:${JUDGE_FRAME_HEIGHT_PX}px`;

  const loaded = new Promise<void>((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });
  frame.srcdoc = buildJudgeDocument(TILE_HTML, TILE_CSS);
  document.body.appendChild(frame);

  try {
    await loaded;
    const judgeDocument = frame.contentDocument;
    if (!judgeDocument) return { tileWidth: -1, sameRow: false };
    const first = measureRect(judgeDocument.getElementById("t1")!);
    const third = measureRect(judgeDocument.getElementById("t3")!);
    // "같은 행에 있는가"를 top 비교로 판정한다고 가정한 것이다.
    return { tileWidth: first.width, sameRow: first.top === third.top };
  } finally {
    frame.remove();
  }
}

async function runCases(): Promise<CaseResult[]> {
  const results: CaseResult[] = [];

  // 1. contentDocument 접근과 측정
  const measured = await openJudgeDocument(TILE_HTML, TILE_CSS, (judgeDocument) => ({
    t1: measureRect(judgeDocument.getElementById("t1")!),
    t2: measureRect(judgeDocument.getElementById("t2")!),
    t3: measureRect(judgeDocument.getElementById("t3")!),
    titleFontSize: getComputedStyle(judgeDocument.getElementById("title")!).fontSize,
    hasCsp: Boolean(
      judgeDocument.querySelector('meta[http-equiv="Content-Security-Policy"]'),
    ),
  }));

  results.push({
    name: "allow-same-origin 단독으로 contentDocument를 읽고 측정한다",
    passed: measured.t1.width === 200 && measured.t1.height === 100,
    detail: `t1 = ${measured.t1.width}×${measured.t1.height}`,
  });

  results.push({
    name: "격자 기하가 측정된다 (1·2번 타일 같은 행, 3번은 다음 행)",
    passed: measured.t1.top === measured.t2.top && measured.t3.top > measured.t1.top,
    detail: `top: t1=${measured.t1.top}, t2=${measured.t2.top}, t3=${measured.t3.top}`,
  });

  results.push({
    name: "브라우저 기본 스타일이 유지된다 (리셋 CSS 미주입)",
    passed: measured.titleFontSize === "32px",
    detail: `h1 font-size = ${measured.titleFontSize}`,
  });

  results.push({
    name: "CSP script-src none이 문서에 주입된다 (이중 차단)",
    passed: measured.hasCsp,
    detail: measured.hasCsp ? "meta 존재" : "meta 없음",
  });

  // 2. 사용자 스크립트 차단
  const scriptFlag = await openJudgeDocument(SCRIPT_HTML, "", (judgeDocument) => {
    // javascript: URL도 실제로 눌러 본다.
    (judgeDocument.getElementById("link") as HTMLAnchorElement | null)?.click();
    return judgeDocument.getElementById("flag")?.textContent ?? "(없음)";
  });

  results.push({
    name: "인라인 script · img onerror · javascript URL이 모두 차단된다",
    passed: scriptFlag === "변경 없음",
    detail: `제목 텍스트 = "${scriptFlag}"`,
  });

  // 3. 스크롤바 폭 보정
  {
    const solution = SOLUTIONS[0];
    const layoutWidth = await openJudgeDocument(
      solution.html,
      solution.css,
      (judgeDocument) => judgeDocument.documentElement.clientWidth,
    );

    results.push({
      name: "문서가 길어 스크롤바가 생겨도 배치 너비가 시안 너비와 같다",
      passed: layoutWidth === JUDGE_FRAME_WIDTH_PX,
      detail: `배치 너비 = ${layoutWidth}px (보정 없으면 ${JUDGE_FRAME_WIDTH_PX - 15}px 안팎)`,
    });
  }

  // 4. display:none 대조군
  const hidden = await measureWithDisplayNone();

  results.push({
    name: "display:none이면 측정값이 0이 된다",
    passed: hidden.tileWidth === 0,
    detail: `타일 너비 = ${hidden.tileWidth}px (화면 밖 배치에서는 ${measured.t1.width}px)`,
  });

  results.push({
    name: "display:none이면 배치 조건이 오류 없이 통과해버린다",
    passed: hidden.sameRow,
    detail: hidden.sameRow
      ? "1번과 3번 타일이 '같은 행'으로 판정됨 — 실제로는 다른 행이다"
      : "재현되지 않음",
  });

  return results;
}

export default function FrameCases() {
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

  if (error) {
    return <p className="mt-3 text-sm text-red-600">실행 실패: {error}</p>;
  }
  if (!results) {
    return <p className="mt-3 text-sm text-chrome-muted">측정 중…</p>;
  }

  const failed = results.filter((entry) => !entry.passed).length;

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">판정용 문서</h2>
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
