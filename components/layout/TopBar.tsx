"use client";

import SettingsPopover from "@/components/editor/SettingsPopover";
import type { EditorSettings } from "@/lib/constants";
import type { LearningSession } from "@/lib/learning/useLearningSession";

type TopBarProps = {
  settings: EditorSettings;
  onSettingsChange: (settings: EditorSettings) => void;
  saveFailed: boolean;
  session: LearningSession;
  onSubmit: () => void;
};

const STATUS_MARK: Record<string, string> = {
  passed: "통과",
  revealed: "예시 공개",
  in_progress: "작성 중",
  locked: "잠김",
};

/** 학습 화면 상단 바. */
export default function TopBar({
  settings,
  onSettingsChange,
  saveFailed,
  session,
  onSubmit,
}: TopBarProps) {
  const { source, sectionId, sectionIndex, attemptsUsed, maxAttempts, canSubmit } = session;
  const progress = sectionId ? source?.progress.sections[sectionId] : undefined;
  const sectionCount = source?.sections.length ?? 0;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-chrome-border bg-chrome-panel px-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-chrome-muted">
          구역 {sectionIndex + 1}/{sectionCount}
        </span>
        {/* 완료한 구역에 다시 들어갈 수 있다 (F-08-03). */}
        <select
          value={sectionId ?? ""}
          onChange={(event) => session.selectSection(event.target.value)}
          aria-label="구역 선택"
          className="rounded-md border border-chrome-border bg-chrome-bg px-2 py-1 text-sm"
        >
          {source?.sections.map((section) => {
            const status = source.progress.sections[section.id]?.status ?? "locked";
            return (
              <option key={section.id} value={section.id} disabled={status === "locked"}>
                {section.name} · {STATUS_MARK[status] ?? status}
              </option>
            );
          })}
        </select>

        {progress?.needsRecheck && (
          <span
            title={`${
              source?.sections.find((entry) => entry.id === progress.recheckCause)?.name ??
              "다른 구역"
            }의 코드가 바뀌어 다시 확인이 필요합니다.`}
            className="rounded-md bg-chrome-bg px-2 py-1 text-xs text-chrome-warning"
          >
            재확인 필요
          </span>
        )}
      </div>

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
          시도 {attemptsUsed}/{maxAttempts}
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
