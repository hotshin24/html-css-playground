"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { EditorSettings } from "@/lib/constants";

type SettingsPopoverProps = {
  settings: EditorSettings;
  onChange: (settings: EditorSettings) => void;
};

type ToggleRowProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

/** 설명이 붙은 체크박스 한 줄. */
function ToggleRow({ id, label, description, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-chrome-accent"
      />
      <div className="min-w-0">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
        </label>
        <p className="mt-0.5 text-xs leading-relaxed text-chrome-muted">{description}</p>
      </div>
    </div>
  );
}

/** 상단 바의 설정 버튼과 그 아래 열리는 패널. */
export default function SettingsPopover({ settings, onChange }: SettingsPopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nameSuggestionsId = useId();
  const lineWrapId = useId();

  // 패널 바깥을 누르거나 Escape를 누르면 닫는다.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="rounded-md border border-chrome-border px-3 py-1.5 text-sm hover:bg-chrome-bg"
      >
        설정
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="에디터 설정"
          className="absolute right-0 top-full z-10 mt-2 w-80 rounded-lg border border-chrome-border bg-chrome-panel p-3 shadow-lg"
        >
          <ToggleRow
            id={nameSuggestionsId}
            label="코드 이름 제안"
            description="태그 이름, HTML 속성 이름·값, CSS 속성명·값 제안을 켭니다. 이름을 직접 떠올리는 것이 훈련의 핵심이므로 기본은 꺼짐입니다."
            checked={settings.nameSuggestions}
            onChange={(checked) => onChange({ ...settings, nameSuggestions: checked })}
          />
          <ToggleRow
            id={lineWrapId}
            label="줄바꿈"
            description="긴 줄을 에디터 너비에 맞춰 접어서 표시합니다."
            checked={settings.lineWrap}
            onChange={(checked) => onChange({ ...settings, lineWrap: checked })}
          />
        </div>
      )}
    </div>
  );
}
