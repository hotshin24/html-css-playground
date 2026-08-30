import { autocompletion } from "@codemirror/autocomplete";
import { Compartment, type Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

/**
 * 런타임에 갈아끼울 확장을 담는 Compartment.
 *
 * Compartment 자체는 식별자 역할만 하므로 모듈 수준에 하나씩 두고
 * 여러 EditorView가 공유해도 각 뷰의 상태는 서로 독립적이다.
 */
export const completionCompartment = new Compartment();
export const lineWrapCompartment = new Compartment();

/**
 * 이름 제안 확장.
 *
 * 태그 이름, HTML 속성 이름·값, CSS 속성명·값 제안은 전부 `autocompletion()`에서
 * 발생하고, 항상 켜져 있어야 하는 닫는 태그 자동 생성(`html({ autoCloseTags })`)과
 * 괄호·따옴표 짝맞춤(`closeBrackets()`)은 별개 확장이다.
 *
 * 따라서 완성 소스를 `override`로 개별 필터링하지 않고 확장 자체를 넣고 뺀다.
 * 언어 패키지가 등록하는 완성 소스의 내부 표현에 의존하지 않으므로
 * 라이브러리 버전이 올라가도 동작이 달라지지 않는다.
 */
export function nameSuggestionExtension(enabled: boolean): Extension {
  return enabled ? autocompletion() : [];
}

/** 줄바꿈 확장. */
export function lineWrapExtension(enabled: boolean): Extension {
  return enabled ? EditorView.lineWrapping : [];
}
