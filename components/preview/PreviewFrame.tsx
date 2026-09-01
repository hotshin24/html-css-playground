"use client";

import { useEffect, useState } from "react";
import { PREVIEW_DEBOUNCE_MS } from "@/lib/constants";

type PreviewFrameProps = {
  html: string;
  css: string;
};

/**
 * 사용자 코드를 그대로 담은 문서를 만든다.
 *
 * 리셋 CSS를 넣지 않는다. 학습자가 자기 CSS의 효과를 정확히 관찰해야 하므로
 * 브라우저 기본 스타일 위에 사용자 CSS만 얹힌 상태여야 한다.
 *
 * CSP는 판정용 문서와 같은 이중 차단이다. sandbox에 `allow-scripts`가 없어
 * 이미 스크립트가 막혀 있지만, 누군가 나중에 그 값을 더해도 살아나지 않는다.
 */
function buildDocument(html: string, css: string): string {
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
 * 실시간 결과 화면.
 *
 * `sandbox="allow-same-origin"` 단독으로 둔다. `allow-scripts`가 없으므로
 * 스크립트는 인라인·이벤트 핸들러·javascript: URL 모두 실행되지 않는다.
 * 문서가 능동적으로 할 수 있는 일이 없으니 오리진을 열어도 위험이 없다.
 * 판정용 문서(4.6.5)가 이미 같은 조합을 쓴다.
 *
 * 불투명 오리진(`sandbox=""`)이면 이미지 요청이 아예 나가지 않아 자리표시조차
 * 뜨지 않고, 판정 프레임은 이미지를 부르는데 미리보기는 부르지 않아 두 화면이
 * 서로 다르게 보였다. 오리진을 맞추면 그 불일치도 사라진다.
 *
 * 별도 문서라서 부모의 Tailwind가 내부로 새어 들어가지 않는 것은 그대로다.
 */
export default function PreviewFrame({ html, css }: PreviewFrameProps) {
  const [srcDoc, setSrcDoc] = useState(() => buildDocument(html, css));

  // 타이핑이 멈춘 뒤에만 갱신한다.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSrcDoc(buildDocument(html, css));
    }, PREVIEW_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [html, css]);

  return (
    // srcDoc만 바꾸고 iframe 자체는 다시 만들지 않는다.
    <iframe
      title="결과 화면"
      sandbox="allow-same-origin"
      srcDoc={srcDoc}
      className="h-full w-full border-0 bg-white"
    />
  );
}
