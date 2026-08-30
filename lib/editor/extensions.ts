import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { bracketMatching, indentOnInput, syntaxHighlighting } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import {
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
 * 설정과 무관하게 항상 적용되는 에디터 기본 확장.
 *
 * `basicSetup`은 `autocompletion()`을 강제로 포함하므로 사용하지 않고 직접 조립한다.
 * `closeBrackets`는 @codemirror/autocomplete 패키지에 들어 있지만
 * 완성 기능과는 독립적으로 동작하는 별도 확장이다.
 *
 * 토글 대상(이름 제안, 줄바꿈)은 여기 넣지 않고 Compartment로 관리한다.
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
    // Tab은 바인딩하지 않는다. indentWithTab을 넣으면 키보드 사용자가
    // 에디터에서 포커스를 빼낼 수 없는 키보드 트랩이 된다.
    // 들여쓰기는 자동 들여쓰기와 defaultKeymap의 Mod-] / Mod-[ 로 대신한다.
    keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
    editorTheme,
    syntaxHighlighting(editorHighlightStyle),
    languageSupport(language),
  ];
}
