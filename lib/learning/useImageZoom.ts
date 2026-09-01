"use client";

/**
 * 시안 확대·축소 (F-05-08).
 *
 * 크기는 CSS 변형이 아니라 **너비 비율**로 바꾼다. 변형을 쓰면 오버레이의
 * 퍼센트 좌표와 `offsetTop`이 확대 전 좌표계에 남아 계산을 따로 해야 하지만,
 * 너비를 바꾸면 배치가 다시 흐르므로 기존 좌표 코드가 그대로 맞는다.
 * 구역 오버레이와 경계 드래그가 손대지 않고도 따라오는 이유다.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** 열 너비에 맞춘 상태가 1이다. 그보다 작으면 전체 윤곽, 크면 세부를 본다. */
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 8;
export const DEFAULT_SCALE = 1;

/** 휠 한 칸의 배율 변화량. 값이 클수록 급격해진다. */
const WHEEL_SENSITIVITY = 0.0015;

const clamp = (value: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));

export type ImageZoom = {
  scale: number;
  /** 스크롤을 맡는 요소. 이 안에서만 휠을 가로챈다. */
  scrollRef: React.RefObject<HTMLDivElement | null>;
  /** 확대 대상 요소에 그대로 얹는다. */
  contentStyle: { width: string };
  reset: () => void;
  /** 배율이 기본값이 아닐 때만 되돌리기 표시를 띄우기 위한 값. */
  zoomed: boolean;
};

export function useImageZoom(): ImageZoom {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(DEFAULT_SCALE);

  /**
   * 배율이 바뀐 뒤 적용할 스크롤 위치.
   *
   * 너비를 바꾸면 배치가 다시 흐른 뒤에야 스크롤 범위가 정해지므로, 상태를
   * 바꾸는 시점에는 옮길 수 없다. 그려진 직후에 적용한다.
   */
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const target = pendingScroll.current;
    if (!scroller || !target) return;
    pendingScroll.current = null;
    scroller.scrollLeft = target.left;
    scroller.scrollTop = target.top;
  }, [scale]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const onWheel = (event: WheelEvent) => {
      // 확대 조합이 아니면 평소대로 스크롤한다.
      if (!event.ctrlKey && !event.metaKey) return;

      /*
       * 브라우저 페이지 확대를 막는다. 시안 열 위에서만 가로채므로 다른
       * 영역에서는 기본 동작이 그대로 남는다. macOS 트랙패드 핀치도 ctrlKey가
       * 켜진 wheel로 들어오므로 같은 경로로 처리된다.
       *
       * passive 기본값이면 preventDefault가 무시되므로 직접 등록한다.
       */
      event.preventDefault();

      const box = scroller.getBoundingClientRect();
      const cursorX = event.clientX - box.left;
      const cursorY = event.clientY - box.top;

      setScale((current) => {
        const next = clamp(current * Math.exp(-event.deltaY * WHEEL_SENSITIVITY));
        if (next === current) return current;

        /*
         * 커서 밑의 지점을 제자리에 붙든다. 열 중앙을 기준으로 하면 보려던
         * 곳이 화면 밖으로 밀려난다. 너비가 배율에 비례하므로 확대 후 좌표는
         * 비율만 곱하면 되고, 새 크기를 재지 않아도 된다.
         */
        const k = next / current;
        pendingScroll.current = {
          left: (scroller.scrollLeft + cursorX) * k - cursorX,
          top: (scroller.scrollTop + cursorY) * k - cursorY,
        };
        return next;
      });
    };

    scroller.addEventListener("wheel", onWheel, { passive: false });
    return () => scroller.removeEventListener("wheel", onWheel);
  }, []);

  const reset = useCallback(() => {
    pendingScroll.current = null;
    setScale(DEFAULT_SCALE);
  }, []);

  return {
    scale,
    scrollRef,
    contentStyle: { width: `${scale * 100}%` },
    reset,
    zoomed: scale !== DEFAULT_SCALE,
  };
}
