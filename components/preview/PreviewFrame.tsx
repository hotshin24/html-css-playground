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
 */
function buildDocument(html: string, css: string): string {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
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
 * `sandbox=""`로 스크립트 실행을 차단한다. 권한을 하나도 주지 않으므로
 * 문서는 불투명 오리진에 놓이고 부모 페이지와 서로 접근할 수 없다.
 * 별도 문서라서 부모의 Tailwind가 내부로 새어 들어가지도 않는다.
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
      sandbox=""
      srcDoc={srcDoc}
      className="h-full w-full border-0 bg-white"
    />
  );
}
