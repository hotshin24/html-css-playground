"use client";

import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { useEffect, useRef } from "react";
import {
  completionCompartment,
  lineWrapCompartment,
  lineWrapExtension,
  nameSuggestionExtension,
} from "@/lib/editor/compartments";
import { createBaseExtensions, type EditorLanguage } from "@/lib/editor/extensions";
import type { EditorSettings } from "@/lib/constants";

type CodeEditorProps = {
  language: EditorLanguage;
  value: string;
  onChange: (value: string) => void;
  settings: EditorSettings;
  /** 스크린 리더용 편집 영역 이름. */
  ariaLabel: string;
};

/**
 * CodeMirror 6 래퍼.
 *
 * `@uiw/react-codemirror`를 쓰지 않고 EditorView를 직접 만든다.
 * 설정 변경 시 Compartment로 확장을 갈아끼워야 하므로 인스턴스를 직접 들고 있어야 한다.
 */
export default function CodeEditor({
  language,
  value,
  onChange,
  settings,
  ariaLabel,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // 에디터를 다시 만들지 않고 최신 값을 참조하기 위한 보관용 ref.
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const settingsRef = useRef(settings);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    settingsRef.current = settings;
  }, [value, onChange, settings]);

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
          // 설정으로 켜고 끄는 확장은 Compartment에 담아 나중에 갈아끼운다.
          completionCompartment.of(
            nameSuggestionExtension(settingsRef.current.nameSuggestions),
          ),
          lineWrapCompartment.of(lineWrapExtension(settingsRef.current.lineWrap)),
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

  // 설정이 바뀌면 에디터를 다시 만들지 않고 해당 확장만 교체한다.
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        completionCompartment.reconfigure(
          nameSuggestionExtension(settings.nameSuggestions),
        ),
        lineWrapCompartment.reconfigure(lineWrapExtension(settings.lineWrap)),
      ],
    });
  }, [settings.nameSuggestions, settings.lineWrap]);

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
