"use client";

import CodeEditor from "@/components/editor/CodeEditor";
import PaneHeader from "@/components/layout/PaneHeader";
import type { EditorSettings } from "@/lib/constants";
import type { EditorLanguage } from "@/lib/editor/extensions";

type EditorPaneProps = {
  label: string;
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  settings: EditorSettings;
};

/** 이름 표시줄과 에디터를 묶은 한 칸. */
export default function EditorPane({
  label,
  language,
  value,
  onChange,
  settings,
}: EditorPaneProps) {
  return (
    <section className="flex min-h-0 flex-col bg-chrome-panel">
      <PaneHeader>{label}</PaneHeader>
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={language}
          value={value}
          onChange={onChange}
          settings={settings}
          ariaLabel={`${label} 편집기`}
        />
      </div>
    </section>
  );
}
