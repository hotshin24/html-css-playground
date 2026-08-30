"use client";

import { useRef, useState } from "react";
import { RESIZER_KEY_STEP_PX } from "@/lib/constants";

type RowResizerProps = {
  /** 스크린 리더용 설명. 어느 두 영역 사이인지 밝힌다. */
  label: string;
  /** 드래그 시작. 부모가 현재 비율을 스냅숏으로 잡는다. */
  onDragStart: () => void;
  /** 드래그 시작 지점 기준 이동량(px). 아래쪽이 양수. */
  onDrag: (deltaPx: number) => void;
  /** 드래그 종료. 5단계에서 저장을 연결한다. */
  onDragEnd?: () => void;
};

/** 행과 행 사이의 가로 경계선. 위아래 드래그로 높이를 조절한다. */
export default function RowResizer({
  label,
  onDragStart,
  onDrag,
  onDragEnd,
}: RowResizerProps) {
  const startYRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    startYRef.current = event.clientY;
    setDragging(true);
    onDragStart();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onDrag(event.clientY - startYRef.current);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    onDragEnd?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    onDragStart();
    onDrag(event.key === "ArrowUp" ? -RESIZER_KEY_STEP_PX : RESIZER_KEY_STEP_PX);
    onDragEnd?.();
  };

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label={label}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`group relative cursor-row-resize touch-none bg-chrome-border outline-none ${
        dragging ? "bg-chrome-accent" : "hover:bg-chrome-handle focus-visible:bg-chrome-accent"
      }`}
    >
      <span className="absolute inset-x-0 -top-1 -bottom-1" />
    </div>
  );
}
