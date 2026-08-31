/**
 * 판정용 문서 (F-05-04 ~ F-05-06).
 *
 * 미리보기(3열)와 별개로 운영한다. 미리보기는 `sandbox=""`를 유지하고,
 * 완화된 오리진을 갖는 이 문서는 판정 순간에만 존재한다.
 */

/** 시안 기준 고정 너비. 열 너비를 드래그해도 측정값이 흔들리지 않게 한다. */
export const JUDGE_FRAME_WIDTH_PX = 1200;

/** 뷰포트 단위(vh 등)가 현실적인 값을 갖도록 일반적인 화면 높이를 쓴다. */
export const JUDGE_FRAME_HEIGHT_PX = 900;

/**
 * 판정용 문서를 조립한다.
 *
 * 미리보기와 마찬가지로 리셋 CSS를 넣지 않는다. 판정 대상은 학습자 CSS만
 * 적용된 결과여야 한다. CSP는 sandbox와 별개의 이중 차단이며, 누군가
 * `allow-scripts`를 실수로 추가해도 스크립트가 살아나지 않게 한다.
 */
export function buildJudgeDocument(html: string, css: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="script-src 'none'">
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`;
}

/**
 * 판정용 iframe을 띄워 문서를 읽고 파기한다.
 *
 * `sandbox`에 **`allow-scripts`를 함께 주면 안 된다.** `allow-same-origin`
 * 단독으로 부모에서 `contentDocument` 접근이 가능하며 스크립트는 실행되지
 * 않는다. 측정 스크립트를 주입할 필요가 없다.
 *
 * 숨김은 **화면 밖 배치**로 한다. `display:none`은 레이아웃 박스를 만들지
 * 않아 모든 측정값이 0이 되고, 오류 없이 `layout-result`가 무조건 통과한다.
 */
export async function openJudgeDocument<T>(
  html: string,
  css: string,
  read: (document: Document) => T,
): Promise<T> {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin");
  frame.setAttribute("title", "판정용 문서");
  frame.style.cssText = [
    "position:absolute",
    "left:-10000px",
    "top:0",
    `width:${JUDGE_FRAME_WIDTH_PX}px`,
    `height:${JUDGE_FRAME_HEIGHT_PX}px`,
    "border:0",
  ].join(";");

  // load는 하위 리소스까지 기다리므로 이미지 로드 전후로 측정값이
  // 달라지는 문제를 피할 수 있다 (F-05-06).
  const loaded = new Promise<void>((resolve) => {
    frame.addEventListener("load", () => resolve(), { once: true });
  });

  frame.srcdoc = buildJudgeDocument(html, css);
  document.body.appendChild(frame);

  try {
    await loaded;
    const judgeDocument = frame.contentDocument;
    const judgeWindow = frame.contentWindow;
    if (!judgeDocument || !judgeWindow) {
      throw new Error("판정용 문서에 접근할 수 없습니다. sandbox 설정을 확인하십시오.");
    }

    await compensateScrollbar(frame, judgeDocument, judgeWindow);
    return read(judgeDocument);
  } finally {
    frame.remove();
  }
}

/**
 * 스크롤바가 가져간 폭을 프레임 너비로 되돌려준다.
 *
 * 문서가 프레임보다 길면 세로 스크롤바가 생기고, 그만큼 배치 가능 너비가
 * 줄어든다. 시안 너비에 딱 맞춘 설계는 이 몇 px 때문에 한 줄이 접히므로,
 * 학습자가 맞게 작성해도 배치 조건이 실패한다.
 *
 * CSS를 주입하지 않고 프레임 자체를 넓혀 **문서의 배치 너비가 정확히
 * 시안 너비가 되도록** 맞춘다. 높이는 건드리지 않으므로 vh 계산도 그대로다.
 */
async function compensateScrollbar(
  frame: HTMLIFrameElement,
  judgeDocument: Document,
  judgeWindow: Window,
): Promise<void> {
  const gutter = judgeWindow.innerWidth - judgeDocument.documentElement.clientWidth;
  if (gutter <= 0) return;

  frame.style.width = `${JUDGE_FRAME_WIDTH_PX + gutter}px`;

  // 새 너비로 다시 배치시킨다.
  // requestAnimationFrame은 탭이나 창이 가려지면 발화하지 않아 판정이
  // 무한 대기에 빠지므로 쓰지 않는다.
  void frame.offsetWidth;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** 측정에 쓰는 최소 사각형. */
export type Rect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export function measureRect(element: Element): Rect {
  const rect = element.getBoundingClientRect();
  return {
    left: Math.round(rect.left),
    top: Math.round(rect.top),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}
