/**
 * 유형별 판정 함수.
 *
 * 모든 검사는 **구조 패턴**으로 수행한다. `target`과 `desc`는 학습자 코드에
 * 존재하지 않는 문자열이므로 읽지 않는다 (PRD 4.6.4).
 */

import { measureRect, type Rect } from "@/lib/judging/judgeFrame";
import type { AcceptParams } from "@/lib/judging/schema";

export type CheckResult = {
  passed: boolean;
  /** 실패 문구에서 기대값으로 보여줄 값. */
  expected: Record<string, unknown> | null;
  /** 실패 문구에서 실제값으로 보여줄 값. */
  actual: Record<string, unknown> | null;
};

const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";

function headingLevels(root: ParentNode): number[] {
  return Array.from(root.querySelectorAll(HEADING_SELECTOR)).map((element) =>
    Number(element.tagName.slice(1)),
  );
}

/**
 * 제목 레벨이 2 이상 건너뛰지 않는지 (엔진 상시).
 * 첫 제목은 앞선 제목이 없으므로 검사 대상이 아니다.
 */
export function checkHeadingOrder(root: ParentNode): CheckResult {
  const levels = headingLevels(root);

  for (let index = 1; index < levels.length; index += 1) {
    const previous = levels[index - 1];
    const current = levels[index];
    if (current > previous + 1) {
      return {
        passed: false,
        expected: { maxJump: 1 },
        actual: { from: previous, to: current, position: index + 1 },
      };
    }
  }

  return { passed: true, expected: null, actual: { levels } };
}

/** 문서 내 최상위 제목이 정확히 1개인지 (엔진 상시). */
export function checkHeadingSingle(root: ParentNode): CheckResult {
  const count = root.querySelectorAll("h1").length;
  return {
    passed: count === 1,
    expected: { count: 1 },
    actual: { count },
  };
}

/**
 * 구역 내 모든 이미지에 `alt` 속성이 있는지.
 *
 * **값이 비어 있어도 통과시킨다.** `alt=""`는 "장식이므로 읽지 말라"는
 * 올바른 선언이며, 어떤 이미지가 장식인지는 시안만으로 판별할 수 없다.
 * 빈 값을 실패로 처리하면 맞게 작성한 코드를 오답으로 만든다 (4.6.1).
 * 속성 자체가 없는 것은 판단의 여지가 없는 오류이므로 이것만 잡는다.
 */
export function checkImageAlt(root: ParentNode): CheckResult {
  const images = Array.from(root.querySelectorAll("img"));
  const missing = images.filter((image) => !image.hasAttribute("alt"));

  return {
    passed: missing.length === 0,
    expected: { missingAlt: 0 },
    actual: { imageCount: images.length, missingAlt: missing.length },
  };
}

const LABELABLE_SELECTOR = "input, select, textarea";
/** 레이블이 필요 없는 입력 유형. */
const UNLABELED_INPUT_TYPES = new Set(["hidden", "submit", "reset", "button", "image"]);

function needsLabel(element: Element): boolean {
  if (element.tagName !== "INPUT") return true;
  const type = (element.getAttribute("type") ?? "text").toLowerCase();
  return !UNLABELED_INPUT_TYPES.has(type);
}

function hasLabel(element: Element, root: ParentNode): boolean {
  if (element.closest("label")) return true;
  if (element.hasAttribute("aria-label")) return true;
  if (element.hasAttribute("aria-labelledby")) return true;

  const id = element.getAttribute("id");
  if (!id) return false;
  // CSS.escape가 없는 환경을 고려해 순회로 찾는다.
  return Array.from(root.querySelectorAll("label[for]")).some(
    (label) => label.getAttribute("for") === id,
  );
}

/** 구역 내 모든 폼 컨트롤에 레이블이 연결되었는지. */
export function checkFormLabel(root: ParentNode): CheckResult {
  const controls = Array.from(root.querySelectorAll(LABELABLE_SELECTOR)).filter(needsLabel);
  const unlabeled = controls.filter((control) => !hasLabel(control, root));

  return {
    passed: unlabeled.length === 0,
    expected: { unlabeled: 0 },
    actual: { controlCount: controls.length, unlabeled: unlabeled.length },
  };
}

const LIST_SELECTOR = "ul, ol, menu";

/** 목록별 직계 항목 수. */
function listItemCounts(root: ParentNode): number[] {
  return Array.from(root.querySelectorAll(LIST_SELECTOR)).map(
    (list) => Array.from(list.children).filter((child) => child.tagName === "LI").length,
  );
}

/**
 * 구역 내에 지정된 크기의 목록이 충분히 있는지.
 *
 * **항목의 내부 구조가 서로 같은지는 검사하지 않는다.** 목록 요소로 묶었다는
 * 사실 자체가 "같은 종류의 항목"이라는 선언이며, 구조 동일성까지 요구하면
 * 항목마다 배지나 부가 정보가 붙는 정상적인 마크업이 실패한다.
 *
 * 개수는 **이상**으로 본다. 구역 안에 관계없는 목록(예: 푸터 링크)이 함께
 * 있을 수 있으므로 전체 개수를 정확히 맞추라고 요구하면 오탐이 생긴다.
 */
export function checkListGrouping(root: ParentNode, accept: AcceptParams[]): CheckResult {
  const counts = listItemCounts(root);

  for (const params of accept) {
    const matched = counts.filter((count) => count === params.itemsPerGroup).length;
    if (matched >= params.groupCount) {
      return { passed: true, expected: params, actual: { listItemCounts: counts } };
    }
  }

  return {
    passed: false,
    expected: { accept },
    actual: { listItemCounts: counts },
  };
}

/** 렌더 박스를 갖는 자식 요소만 남긴다. */
function boxedChildren(element: Element): Element[] {
  return Array.from(element.children).filter((child) => {
    const rect = child.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  });
}

/**
 * 격자를 이루는 후보 집합을 모은다.
 *
 * 같은 시안이라도 타일을 평면으로 늘어놓을 수도, 행으로 감쌀 수도 있다.
 * 두 마크업의 렌더 결과는 같으므로 **직계 자식이 N개가 아니면 자식들을 한 단계
 * 펼쳐서** 다시 센다. 행 래퍼 한 겹까지 흡수하기 위한 것이며, 그보다 깊은
 * 중첩은 실제 시안에서 나타나지 않는다.
 */
function gridCandidates(root: Document, size: number): Element[][] {
  const candidates: Element[][] = [];
  const parents = [root.body, ...Array.from(root.body.querySelectorAll("*"))];

  for (const parent of parents) {
    if (!parent) continue;

    const children = boxedChildren(parent);
    if (children.length === size) {
      candidates.push(children);
      continue;
    }

    if (children.length < 2) continue;
    const flattened = children.flatMap((child) => boxedChildren(child));
    if (flattened.length === size) {
      candidates.push(flattened);
    }
  }

  return candidates;
}

/**
 * 사각형들을 시각적 행으로 묶는다.
 * 세로로 겹치면 같은 행으로 본다. 높이가 다른 항목도 함께 묶이도록 하기 위한 것이다.
 */
function groupIntoRows(rects: Rect[]): Rect[][] {
  const sorted = [...rects].sort((a, b) => a.top - b.top || a.left - b.left);
  const rows: Rect[][] = [];

  for (const rect of sorted) {
    const currentRow = rows[rows.length - 1];
    if (currentRow) {
      const rowBottom = Math.min(...currentRow.map((item) => item.top + item.height));
      if (rect.top < rowBottom) {
        currentRow.push(rect);
        continue;
      }
    }
    rows.push([rect]);
  }

  return rows;
}

/**
 * N개 요소의 렌더 배치가 기대 격자와 일치하는지.
 *
 * 대상은 `columns × rows`개의 형제 요소로 특정한다. 시안에서 몇 개가 어떻게
 * 놓이는지는 알지만 그것이 어느 요소인지는 알 수 없으므로, 구역 안에서
 * 그 개수를 이루는 집합을 찾아 기하를 검사한다. 하나라도 맞으면 통과다.
 */
export function checkLayoutResult(root: Document, expected: AcceptParams): CheckResult {
  const size = expected.columns * expected.rows;
  const candidates = gridCandidates(root, size);

  let closest: { rows: number; columns: number[] } | null = null;

  for (const candidate of candidates) {
    const rows = groupIntoRows(candidate.map(measureRect));
    const columns = rows.map((row) => row.length);
    const shape = { rows: rows.length, columns };

    if (rows.length === expected.rows && columns.every((count) => count === expected.columns)) {
      return { passed: true, expected, actual: shape };
    }
    closest = closest ?? shape;
  }

  return {
    passed: false,
    expected,
    actual: closest ?? { matchedGroups: 0, size },
  };
}
