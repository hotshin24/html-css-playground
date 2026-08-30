import { DUMMY_SESSION } from "@/lib/constants";

/**
 * 학습 화면 상단 바.
 * 구역·시도 표시는 1단계에서 더미 값이며, 소스 등록·구역 편집 화면이 생기면 교체한다.
 */
export default function TopBar() {
  const { sectionIndex, sectionTotal, sectionName, attemptUsed, attemptTotal } =
    DUMMY_SESSION;

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-chrome-border bg-chrome-panel px-4">
      <span className="rounded-md bg-chrome-bg px-2.5 py-1 text-sm font-medium">
        구역 {sectionIndex}/{sectionTotal} · {sectionName}
      </span>

      <div className="flex items-center gap-3">
        <span className="text-sm text-chrome-muted">
          시도 {attemptUsed}/{attemptTotal}
        </span>

        {/* 설정 패널은 3단계에서 연결한다. */}
        <button
          type="button"
          disabled
          className="rounded-md border border-chrome-border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:text-chrome-muted"
        >
          설정
        </button>

        {/* 판정 로직은 다음 단계 범위이므로 비활성 상태로 둔다. */}
        <button
          type="button"
          disabled
          className="rounded-md bg-chrome-accent px-4 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-chrome-handle"
        >
          확인
        </button>
      </div>
    </header>
  );
}
