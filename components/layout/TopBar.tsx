"use client";

import SettingsPopover from "@/components/editor/SettingsPopover";
import { DUMMY_SESSION, type EditorSettings } from "@/lib/constants";

type TopBarProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  saveFailed: boolean;
  attemptsUsed: number;
  /** 판정 중이거나 이미 끝난 구역이면 비활성. */
  canSubmit: boolean;
  onSubmit: () => void;
};

/**
 * 학습 화면 상단 바.
 * 구역 표시는 아직 더미 값이며, 소스 등록·구역 편집 화면이 생기면 교체한다.
 */
export default function TopBar({
  settings,
  onSettingsChange,
  saveFailed,
  attemptsUsed,
  canSubmit,
  onSubmit,
}: TopBarProps) {
  const { sectionIndex, sectionTotal, sectionName, attemptTotal } = DUMMY_SESSION;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-chrome-border bg-chrome-panel px-4">
      <span className="rounded-md bg-chrome-bg px-2.5 py-1 text-sm font-medium">
        구역 {sectionIndex}/{sectionTotal} · {sectionName}
      </span>

      <div className="flex items-center gap-3">
        {/*
          저장 실패는 사용자가 즉시 취할 수 있는 조치가 없으므로 흐름을 끊지 않는다.
          다만 저장되고 있다고 믿은 채 작업을 잃는 상황은 막아야 하므로 조용히 알린다.
        */}
        {saveFailed && (
          <span
            role="status"
            aria-live="polite"
            title="브라우저 저장소에 쓸 수 없습니다. 새로고침하면 작성 중인 코드가 사라집니다."
            className="text-xs text-chrome-warning"
          >
            저장되지 않음
          </span>
        )}

        <span className="text-sm text-chrome-muted">
          시도 {attemptsUsed}/{attemptTotal}
        </span>

        <SettingsPopover settings={settings} onChange={onSettingsChange} />

        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="rounded-md bg-chrome-accent px-4 py-1.5 text-sm font-medium text-white hover:brightness-110 disabled:cursor-not-allowed disabled:bg-chrome-handle disabled:hover:brightness-100"
        >
          확인
        </button>
      </div>
    </header>
  );
}
