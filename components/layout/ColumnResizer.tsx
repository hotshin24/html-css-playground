"use client";

import { useRef, useState } from "react";
import { RESIZER_KEY_STEP_PX } from "@/lib/constants";

type ColumnResizerProps = {
  /** 스크린 리더용 설명. 어느 두 열 사이인지 밝힌다. */
  label: string;
  /** 드래그 시작. 부모가 현재 비율을 스냅숏으로 잡는다. */
  onDragStart: () => void;
  /** 드래그 시작 지점 기준 이동량(px). 오른쪽이 양수. */
  onDrag: (deltaPx: number) => void;
  /** 드래그 종료. 5단계에서 저장을 연결한다. */
  onDragEnd?: () => void;
};

/** 열과 열 사이의 세로 경계선. 좌우 드래그로 너비를 조절한다. */
export default function ColumnResizer({
  label,
  onDragStart,
  onDrag,
  onDragEnd,
}: ColumnResizerProps) {
  const startXRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // 드래그 중 텍스트가 선택되지 않도록 기본 동작을 막는다.
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    startXRef.current = event.clientX;
    setDragging(true);
    onDragStart();
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    onDrag(event.clientX - startXRef.current);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    onDragEnd?.();
  };

  // 마우스 없이도 조절할 수 있도록 방향키를 지원한다.
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    onDragStart();
    onDrag(event.key === "ArrowLeft" ? -RESIZER_KEY_STEP_PX : RESIZER_KEY_STEP_PX);
    onDragEnd?.();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      className={`group relative cursor-col-resize touch-none bg-chrome-border outline-none ${
        dragging ? "bg-chrome-accent" : "hover:bg-chrome-handle focus-visible:bg-chrome-accent"
      }`}
    >
      {/* 손잡이가 얇아 잡기 어려우므로 실제 판정 영역을 좌우로 넓힌다. */}
      <span className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}
