import type { ReactNode } from "react";

/** 각 영역 상단의 이름 표시줄. */
export default function PaneHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-8 shrink-0 items-center border-b border-chrome-border bg-chrome-subtle px-3 text-xs font-medium text-chrome-muted">
      {children}
    </div>
  );
}
