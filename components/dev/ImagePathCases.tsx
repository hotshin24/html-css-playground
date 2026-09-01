"use client";

import { useCallback, useState } from "react";
import { checkLayoutResult } from "@/lib/judging/checks";
import { openJudgeDocument } from "@/lib/judging/judgeFrame";

/**
 * 이미지가 뜨지 않을 때 배치 측정이 어떻게 달라지는지 (조사용).
 *
 * 판정용 문서는 srcdoc이라 base URL이 없다. 학습자가 쓴 상대 경로는 물론
 * 절대 경로도 해석되지 않으므로 이미지는 항상 깨진 상태로 측정된다.
 * 그 상태가 layout-result 판정을 흔드는지 실제 판정 경로로 잰다.
 */

const CARD_HTML = `<ul class="list">
  <li><img src="/images/a.jpg" alt="상품 가"><p>상품 가</p></li>
  <li><img src="/images/b.jpg" alt="상품 나"><p>상품 나</p></li>
  <li><img src="/images/c.jpg" alt="상품 다"><p>상품 다</p></li>
</ul>`;

const BASE_CSS = `.list { display: flex; gap: 16px; list-style: none; padding: 0; margin: 0; }
.list li { flex: 1; }
p { margin: 8px 0 0; }`;

/** 픽스처 4벌이 쓰는 방식. 크기와 배경을 지정해 자리를 잡아 둔다. */
const SIZED_CSS = `${BASE_CSS}
.list img { display: block; width: 100%; height: 220px; background: #f4f4f5; }`;

/** 크기를 지정하지 않은 경우. 학습자가 흔히 쓰는 형태다. */
const UNSIZED_CSS = BASE_CSS;

/** 폭만 지정하고 높이를 비운 경우. 실제 이미지가 있으면 비율로 정해진다. */
const WIDTH_ONLY_CSS = `${BASE_CSS}
.list img { display: block; width: 100%; }`;

/** alt를 비운 경우. 깨진 이미지의 대체 표시가 달라진다. */
const EMPTY_ALT_HTML = CARD_HTML.replace(/alt="[^"]*"/g, 'alt=""');

type Row = {
  이름: string;
  html: string;
  css: string;
};

/* 항목 폭이 내용에서 나오는 배치. 정답 D가 쓰는 방식이다. */
const INLINE_CSS = `.list { list-style: none; padding: 0; margin: 0; font-size: 0; }
.list li { display: inline-block; vertical-align: top; width: 30%; margin-right: 3%; font-size: 16px; }
p { margin: 8px 0 0; }`;
const INLINE_SIZED_CSS = `${INLINE_CSS}
.list img { display: block; width: 100%; height: 220px; background: #f4f4f5; }`;

/* 폭도 내용이 정하는 경우. 이미지가 없으면 항목 폭이 대체 텍스트 크기로 줄어든다. */
const INLINE_AUTO_CSS = `.list { list-style: none; padding: 0; margin: 0; font-size: 0; }
.list li { display: inline-block; vertical-align: top; margin-right: 16px; font-size: 16px; }
p { margin: 8px 0 0; }`;

/* 이미지 자체가 반복 항목인 경우. 측정 대상이 img가 된다. */
const BARE_IMG_HTML = `<div class="row">
  <img src="/images/a.jpg" alt="로고 가">
  <img src="/images/b.jpg" alt="로고 나">
  <img src="/images/c.jpg" alt="로고 다">
</div>`;
const BARE_IMG_SIZED_CSS = `.row { display: flex; gap: 16px; }
.row img { width: 120px; height: 60px; background: #f4f4f5; }`;
const BARE_IMG_UNSIZED_CSS = `.row { display: flex; gap: 16px; }`;
const BARE_IMG_EMPTY_ALT_HTML = BARE_IMG_HTML.replace(/alt="[^"]*"/g, 'alt=""');

const ROWS: Row[] = [
  { 이름: "flex · 크기 지정 (픽스처 방식)", html: CARD_HTML, css: SIZED_CSS },
  { 이름: "flex · 크기 미지정", html: CARD_HTML, css: UNSIZED_CSS },
  { 이름: "flex · 폭만 지정", html: CARD_HTML, css: WIDTH_ONLY_CSS },
  { 이름: "flex · 크기 미지정 + 빈 alt", html: EMPTY_ALT_HTML, css: UNSIZED_CSS },
  { 이름: "inline-block · 폭 % + 이미지 크기 지정", html: CARD_HTML, css: INLINE_SIZED_CSS },
  { 이름: "inline-block · 폭 % + 이미지 크기 미지정", html: CARD_HTML, css: INLINE_CSS },
  { 이름: "inline-block · 폭 auto + 이미지 크기 지정", html: CARD_HTML, css: `${INLINE_AUTO_CSS}\n.list img { display: block; width: 300px; height: 220px; background: #f4f4f5; }` },
  { 이름: "inline-block · 폭 auto + 이미지 크기 미지정", html: CARD_HTML, css: INLINE_AUTO_CSS },
  { 이름: "이미지가 항목 · 크기 지정", html: BARE_IMG_HTML, css: BARE_IMG_SIZED_CSS },
  { 이름: "이미지가 항목 · 크기 미지정", html: BARE_IMG_HTML, css: BARE_IMG_UNSIZED_CSS },
  { 이름: "이미지가 항목 · 크기 미지정 + 빈 alt", html: BARE_IMG_EMPTY_ALT_HTML, css: BARE_IMG_UNSIZED_CSS },
];

type Report = {
  이름: string;
  판정: string;
  기대: string;
  실제: string;
  이미지크기: string;
  항목크기: string;
};

async function measure(row: Row): Promise<Report> {
  return openJudgeDocument(row.html, row.css, (judgeDocument) => {
    const result = checkLayoutResult(judgeDocument, { columns: 3, rows: 1 });
    const images = [...judgeDocument.querySelectorAll("img")];
    const items = [...judgeDocument.querySelectorAll("li, .row > img")];
    const box = (el: Element) => {
      const r = el.getBoundingClientRect();
      return `${Math.round(r.width)}×${Math.round(r.height)}`;
    };
    return {
      이름: row.이름,
      판정: result.passed ? "통과" : "실패",
      기대: JSON.stringify(result.expected),
      실제: JSON.stringify(result.actual),
      이미지크기: images.map(box).join(" · "),
      항목크기: items.map(box).join(" · "),
    };
  });
}

export default function ImagePathCases() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const out: Report[] = [];
    for (const row of ROWS) {
      out.push(await measure(row));
    }
    setReports(out);
    setRunning(false);
  }, []);

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">이미지 경로 — 배치 측정 영향</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        판정용 문서는 srcdoc이라 base URL이 없어 이미지가 항상 깨진 상태로 측정됩니다. 같은 마크업에
        CSS만 바꿔가며 <code>layout-result</code>(3열 1행) 판정을 실제 판정 경로로 잽니다.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-2 rounded border border-chrome-border px-3 py-1 text-sm disabled:opacity-50"
      >
        {running ? "측정 중…" : "실행"}
      </button>

      {reports && (
        <table className="mt-3 w-full text-xs">
          <thead>
            <tr className="text-left text-chrome-muted">
              <th className="py-1 font-medium">경우</th>
              <th className="py-1 font-medium">판정</th>
              <th className="py-1 font-medium">실제 측정</th>
              <th className="py-1 font-medium">이미지 크기</th>
              <th className="py-1 font-medium">항목 크기</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.이름} className="border-t border-chrome-border align-top">
                <td className="py-1 pr-3">{r.이름}</td>
                <td className="py-1 pr-3">
                  <span className={r.판정 === "통과" ? "text-chrome-success" : "text-chrome-danger"}>
                    {r.판정}
                  </span>
                </td>
                <td className="py-1 pr-3">{r.실제}</td>
                <td className="py-1 pr-3">{r.이미지크기}</td>
                <td className="py-1">{r.항목크기}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
