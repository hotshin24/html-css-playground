import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import {
  EditorView,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";
import { editorHighlightStyle, editorTheme } from "@/lib/editor/theme";

export type EditorLanguage = "html" | "css";

/**
 * 언어별 지원 확장.
 *
 * `html()`과 `css()`는 완성 소스를 language data에 등록만 해둔다.
 * `autocompletion()` 확장을 넣지 않는 한 이름 제안은 동작하지 않으므로,
 * 이 파일에는 항상 켜져 있어야 하는 기능만 둔다. (3단계에서 토글을 붙인다)
 */
function languageSupport(language: EditorLanguage): Extension {
  // autoCloseTags는 autocompletion()과 무관한 별도 확장이라 항상 활성이다.
  return language === "html" ? html({ autoCloseTags: true }) : css();
}

const PLACEHOLDER_TEXT: Record<EditorLanguage, string> = {
  html: "시안의 구조를 HTML로 작성하세요.",
  css: "레이아웃을 CSS로 작성하세요.",
};

/**
 * 이름 제안(자동완성)을 제외한 에디터 기본 확장.
 *
 * `basicSetup`은 `autocompletion()`을 강제로 포함하므로 사용하지 않고 직접 조립한다.
 * `closeBrackets`는 @codemirror/autocomplete 패키지에 들어 있지만
 * 완성 기능과는 독립적으로 동작하는 별도 확장이다.
 */
export function createBaseExtensions(language: EditorLanguage): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    placeholder(PLACEHOLDER_TEXT[language]),
    // 줄바꿈은 기본 켜짐. 3단계에서 Compartment로 옮겨 토글 대상으로 만든다.
    EditorView.lineWrapping,
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...historyKeymap,
      // 코드 에디터이므로 Tab을 들여쓰기에 사용한다.
      indentWithTab,
    ]),
    editorTheme,
    syntaxHighlighting(editorHighlightStyle),
    languageSupport(language),
  ];
}
