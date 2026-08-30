"use client";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef } from "react";
import { createBaseExtensions, type EditorLanguage } from "@/lib/editor/extensions";

type CodeEditorProps = {
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  /** 스크린 리더용 편집 영역 이름. */
  ariaLabel: string;
};

/**
 * CodeMirror 6 래퍼.
 *
 * `@uiw/react-codemirror`를 쓰지 않고 EditorView를 직접 만든다.
 * 3단계에서 Compartment로 확장을 갈아끼워야 하므로 인스턴스를 직접 들고 있어야 한다.
 */
export default function CodeEditor({
  language,
  value,
  onChange,
  ariaLabel,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // 에디터를 다시 만들지 않고 최신 값을 참조하기 위한 보관용 ref.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [value, onChange]);

  // 마운트 시 1회 생성한다.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const view = new EditorView({
      parent: host,
      state: EditorState.create({
        doc: valueRef.current,
        extensions: [
          ...createBaseExtensions(language),
          EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            onChangeRef.current(update.state.doc.toString());
          }),
          EditorView.contentAttributes.of({ "aria-label": ariaLabel }),
        ],
      }),
    });

    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [language, ariaLabel]);

  // 저장된 코드 복원처럼 바깥에서 값이 바뀐 경우에만 문서를 교체한다.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const current = view.state.doc.toString();
    if (current === value) return;

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
  }, [value]);

  return <div ref={hostRef} className="h-full" />;
}
