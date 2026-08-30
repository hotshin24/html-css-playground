"use client";

type FeedbackPanelProps = {
  expanded: boolean;
  onToggle: () => void;
};

/**
 * 하단 채점 피드백 패널.
 * 기본 접힘이며, 판정 결과의 실제 내용은 다음 단계에서 채운다.
 */
export default function FeedbackPanel({ expanded, onToggle }: FeedbackPanelProps) {
  return (
    <section className="shrink-0 border-t border-chrome-border bg-chrome-panel">
      <div className="flex h-10 items-center justify-between px-4">
        <h2 className="text-sm font-medium">채점 피드백</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="rounded-md border border-chrome-border px-2.5 py-1 text-xs text-chrome-muted hover:text-chrome-text"
        >
          {expanded ? "접기" : "펴기"}
        </button>
      </div>

      {expanded && (
        <div className="h-44 overflow-y-auto border-t border-chrome-border px-4 py-3">
          <p className="text-sm text-chrome-muted">판정 결과가 여기에 표시됩니다.</p>
        </div>
      )}
    </section>
  );
}
