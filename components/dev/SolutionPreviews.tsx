"use client";

import { SOLUTIONS } from "@/fixtures/solutions";
import { buildJudgeDocument } from "@/lib/judging/judgeFrame";
import { JUDGE_FRAME_WIDTH_PX } from "@/lib/judging/judgeFrame";

const PREVIEW_HEIGHT = 560;

/**
 * 정답 코드 픽스처를 시안과 대조하기 위한 화면.
 * 재현이 어긋나면 오탐 측정 자체가 의미를 잃는다.
 *
 * 축소해 나란히 놓는 편이 보기 좋으나, transform으로 줄인 iframe은 환경에
 * 따라 내용이 합성되지 않아 빈 상자로 보인다. 확인 도구가 확인되지 않으면
 * 곤란하므로 실제 크기로 두고 가로 스크롤로 넘긴다.
 */
export default function SolutionPreviews() {
  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">정답 코드 픽스처</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        시안만 보고 작성한 {SOLUTIONS.length}벌입니다. 판정 프레임과 같은 너비(
        {JUDGE_FRAME_WIDTH_PX}px)로 렌더링하며, 각 상자 안에서 스크롤할 수 있습니다.
      </p>

      <div className="mt-3 flex gap-4 overflow-x-auto pb-2">
        <figure className="m-0 shrink-0">
          <figcaption className="mb-1 text-xs font-medium">시안 (원본)</figcaption>
          <div
            className="overflow-y-auto border border-chrome-border"
            style={{ width: JUDGE_FRAME_WIDTH_PX, height: PREVIEW_HEIGHT }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sample-design.svg" alt="원본 시안" className="block w-full" />
          </div>
        </figure>

        {SOLUTIONS.map((solution) => (
          <figure key={solution.id} className="m-0 shrink-0">
            <figcaption className="mb-1 text-xs font-medium">
              {solution.id} — {solution.approach}
            </figcaption>
            <iframe
              title={`정답 코드 ${solution.id}`}
              // 학습자가 보는 것과 같은 조건이어야 대조에 쓸 수 있다.
              sandbox="allow-same-origin"
              srcDoc={buildJudgeDocument(solution.html, solution.css)}
              className="border border-chrome-border bg-white"
              style={{ width: JUDGE_FRAME_WIDTH_PX, height: PREVIEW_HEIGHT }}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}
