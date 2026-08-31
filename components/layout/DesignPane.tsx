"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SectionBounds } from "@/lib/storage/sourceStore";

/**
 * 학습 화면 1열. 시안을 보여주고 구역별 모드에서는 현재 구역을 강조한다 (PRD 5.2).
 *
 * 강조가 필요한 이유는 긴 시안에서 드러난다. 11구역 7072px 시안의 첫 구역은
 * 전체의 1.2%라, 표시가 없으면 어디를 작성해야 하는지 알 수 없다. 같은 이유로
 * 구역이 보이는 위치까지 자동으로 스크롤한다.
 */

type DesignPaneProps = {
  imageSrc: string;
  /** 통짜 모드이거나 구역이 정해지지 않았으면 null. 시안 전체를 그대로 보여준다. */
  bounds: SectionBounds | null;
  /** 구역이 바뀔 때만 스크롤을 옮기기 위한 값. */
  sectionId: string | null;
};

export default function DesignPane({
  imageSrc,
  bounds,
  sectionId,
}: DesignPaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  /** 이 구역으로 아직 옮기지 않았다는 표시. 옮긴 뒤에는 사용자의 스크롤을 건드리지 않는다. */
  const pendingRef = useRef(true);

  /**
   * 강조 구역이 보이도록 옮긴다.
   *
   * 이미지 크기가 정해지기 전에는 계산이 무의미하므로 아무것도 하지 않고 표시를
   * 남겨 둔다. 강조 박스는 테두리가 있어 이미지가 비어 있어도 높이가 0이 아니므로,
   * 크기가 정해졌는지는 이미지로 판단해야 한다.
   */
  const scrollToSection = useCallback(() => {
    if (!pendingRef.current) return;
    const scroller = scrollRef.current;
    const image = imageRef.current;
    const box = boxRef.current;
    if (!scroller || !image || !box || image.offsetHeight === 0) return;

    pendingRef.current = false;
    const offset =
      box.offsetTop - (scroller.clientHeight - box.offsetHeight) / 2;
    // 부드러운 스크롤은 직후의 배치 변화(이미지 디코드 완료 등)에 취소된다.
    scroller.scrollTop = Math.max(0, offset);
  }, []);

  // 구역이 바뀌었을 때. 이때는 이미지가 이미 그려져 있으므로 이 자리에서 끝난다.
  useEffect(() => {
    pendingRef.current = true;
    scrollToSection();
  }, [sectionId, scrollToSection]);

  const topPercent = bounds ? bounds.topRatio * 100 : 0;
  const heightPercent = bounds ? bounds.heightRatio * 100 : 100;

  return (
    // 시안도 대개 밝은 배경이라 미리보기와 같은 문제를 갖는다. 3열과 동일한
    // 프레임을 둘러 "양쪽은 참조 대상, 가운데는 작업 영역"으로 읽히게 한다.
    <div className="min-h-0 flex-1 p-3">
      <div className="h-full overflow-hidden rounded-lg border border-chrome-border bg-chrome-bg p-2">
        <div ref={scrollRef} className="h-full overflow-auto rounded-md">
          <div className="relative">
            {/* 사용자가 등록한 이미지를 Blob URL로 표시하므로 next/image를 쓰지 않는다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="학습 시안"
              className="block w-full"
              // 첫 진입에는 위 효과가 돌 때 이미지 크기가 아직 0이다. 로드가 끝나야 정해진다.
              onLoad={scrollToSection}
            />

            {bounds ? (
              <>
                {/* 현재 구역 위아래를 덮어 가린다. 이미지를 지우지 않고 흐리게만 한다. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 bg-chrome-panel/70"
                  style={{ height: `${topPercent}%` }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 bg-chrome-panel/70"
                  style={{
                    height: `${Math.max(0, 100 - topPercent - heightPercent)}%`,
                  }}
                />
                <div
                  ref={boxRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 border-y-2 border-chrome-accent"
                  style={{ top: `${topPercent}%`, height: `${heightPercent}%` }}
                />
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
