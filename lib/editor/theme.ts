import { HighlightStyle } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

/**
 * 에디터 외형.
 * 색은 globals.css의 CSS 변수를 참조하므로 테마 교체 시 변수 값만 바꾸면 된다.
 */
export const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "var(--editor-bg)",
      color: "var(--editor-text)",
      fontSize: "13px",
    },
    "&.cm-focused": {
      outline: "none",
    },
    // 각 에디터는 자기 영역 안에서 Y축 스크롤한다.
    ".cm-scroller": {
      overflow: "auto",
      fontFamily:
        "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
      lineHeight: "1.65",
    },
    ".cm-content": {
      padding: "8px 0",
    },
    ".cm-gutters": {
      backgroundColor: "var(--editor-bg)",
      color: "var(--editor-gutter)",
      border: "none",
    },
    ".cm-activeLine": {
      backgroundColor: "var(--editor-active-line)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "var(--editor-active-line)",
      color: "var(--editor-text)",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: "var(--editor-selection)",
      },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--editor-text)",
    },
    ".cm-placeholder": {
      color: "var(--editor-gutter)",
    },
    // 짝이 맞는 괄호·태그 표시
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "var(--editor-active-line)",
      outline: "1px solid var(--editor-gutter)",
    },
  },
  { dark: false },
);

/** HTML/CSS 토큰 색 규칙. */
export const editorHighlightStyle = HighlightStyle.define([
  { tag: tags.tagName, color: "var(--editor-tag)" },
  { tag: [tags.angleBracket, tags.punctuation], color: "var(--editor-punctuation)" },
  { tag: tags.attributeName, color: "var(--editor-attribute)" },
  { tag: [tags.attributeValue, tags.string], color: "var(--editor-string)" },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: "var(--editor-comment)", fontStyle: "italic" },
  { tag: tags.propertyName, color: "var(--editor-property)" },
  { tag: [tags.className, tags.typeName, tags.tagName], color: "var(--editor-tag)" },
  { tag: [tags.keyword, tags.atom, tags.constant(tags.name), tags.standard(tags.name)], color: "var(--editor-value)" },
  { tag: [tags.number, tags.unit, tags.color, tags.literal], color: "var(--editor-value)" },
  { tag: tags.variableName, color: "var(--editor-text)" },
  { tag: tags.invalid, color: "#dc2626" },
]);
