/**
 * 결합 판정 입력 구성 (F-08-05 ~ F-08-10).
 *
 * `heading-single`과 `heading-order`만 이 문서로 판정한다. 두 조건은 문서
 * 전체가 근거이므로 현재 구역만으로는 판정할 수 없다.
 */

export type SectionStatus = "locked" | "in_progress" | "passed" | "revealed";

export type SectionInput = {
  id: string;
  order: number;
  status: SectionStatus;
  /** 학습자가 작성한 코드. */
  code: { html: string; css: string };
  /** 시도 소진 시 공개되는 모범 예시. */
  example: { html: string; css: string };
};

export type CombinedDocument = {
  /** 이어붙인 HTML. CSS는 결합하지 않는다 (F-08-07). */
  html: string;
  /** order 순으로 포함된 구역. */
  includedSectionIds: string[];
  /** 학습자 코드 대신 예시 코드가 쓰인 구역. 화면에 표시해야 한다 (F-08-08). */
  substitutedSectionIds: string[];
};

/**
 * 결합 문서를 만든다.
 *
 * CSS를 결합하지 않는 이유: 구역별로 작성하므로 클래스 이름이 겹치는 것이
 * 자연스럽고, 클래스 네이밍은 자유 등급이라 판정 대상이 아니다. 이어붙이면
 * 뒤 구역의 규칙이 앞 구역 요소를 덮어 학습자가 잘못한 것 없이 판정이 틀어진다.
 * 두 조건은 DOM 구조만 보므로 CSS가 필요하지 않다.
 *
 * `revealed` 구역에 예시 코드를 쓰는 이유: 그 구역은 정의상 판정을 통과하지
 * 못했다. 학습자 코드를 결합하면 그 위반이 이후 모든 구역으로 전파되어
 * 무엇을 작성해도 통과할 수 없게 된다.
 */
export function buildCombinedDocument(
  sections: SectionInput[],
  currentSectionId: string,
): CombinedDocument {
  const included = sections
    .filter(
      (section) =>
        section.id === currentSectionId ||
        section.status === "passed" ||
        section.status === "revealed",
    )
    // 현재 구역은 맨 뒤가 아니라 자기 order 자리에 들어간다.
    // 완료 구역에 재진입하면 현재 구역이 마지막이 아니기 때문이다 (F-08-03).
    .sort((a, b) => a.order - b.order);

  const substitutedSectionIds: string[] = [];

  const html = included
    .map((section) => {
      if (section.id === currentSectionId) return section.code.html;
      if (section.status === "revealed") {
        substitutedSectionIds.push(section.id);
        return section.example.html;
      }
      return section.code.html;
    })
    .join("\n");

  return {
    html,
    includedSectionIds: included.map((section) => section.id),
    substitutedSectionIds,
  };
}

/**
 * 문서 전체 범위 조건을 적용할 구역인지 (F-08-10).
 *
 * 최상위 제목이 있는 구역 이전에는 건너뛴다. 헤더만 작성하는 시점에
 * "`h1`이 하나 있어야 한다"를 적용하면, 아직 열리지 않은 구역에 있어야 할
 * 제목을 헤더에 넣도록 강요하게 된다.
 */
export function isDocumentScopeApplicable(
  sections: SectionInput[],
  currentSectionId: string,
  mainTitleSectionId: string,
): boolean {
  const current = sections.find((section) => section.id === currentSectionId);
  const mainTitle = sections.find((section) => section.id === mainTitleSectionId);
  if (!current || !mainTitle) return false;
  return current.order >= mainTitle.order;
}
