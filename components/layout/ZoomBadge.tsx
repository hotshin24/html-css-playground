"use client";

/**
 * 확대 배율 표시와 되돌리기 (F-05-08).
 *
 * 기본 배율일 때는 띄우지 않는다. 확대하지 않은 학습자에게는 알릴 것이 없고,
 * 시안 위에 상시 얹히면 그 자리의 내용을 가린다.
 */
export default function ZoomBadge({ scale, onReset }: { scale: number; onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      title="원래 크기로 (시안을 두 번 눌러도 됩니다)"
      className="absolute right-2 top-2 z-10 rounded-md border border-chrome-border bg-chrome-panel/90 px-2 py-1 text-xs text-chrome-text hover:border-chrome-accent"
    >
      {Math.round(scale * 100)}% · 원래 크기
    </button>
  );
}
