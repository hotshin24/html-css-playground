/**
 * 구역 편집 연산 (F-03).
 *
 * 구역은 시안의 세로 범위를 빈틈없이 나눠 가진다. 편집 후에도 이 성질이
 * 유지되어야 오버레이와 판정 범위가 어긋나지 않는다.
 */

export type EditableSection = {
  id: string;
  name: string;
  bounds: { topRatio: number; heightRatio: number };
  sameStructureAs: string | null;
  structure: unknown;
};

/**
 * 구역이 가질 수 있는 최소 높이(시안 픽셀).
 *
 * 비율로 두면 시안이 길수록 최소 높이가 함께 커진다. 세로 22590px 시안에서
 * 2%는 452px이라, AI가 낸 얇은 띠 구역 주변에서는 경계 드래그가 아무 반응 없이
 * 무시됐다. 시안 길이와 무관한 값이어야 한다.
 */
export const MIN_HEIGHT_PX = 40;

/** 이 시안에서 최소 높이가 차지하는 비율. */
function minRatioOf(designHeight: number): number {
  if (designHeight <= 0) return 0;
  return MIN_HEIGHT_PX / designHeight;
}

function createSectionId(): string {
  return `sec-${Math.random().toString(36).slice(2, 8)}`;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * 위에서 아래로 빈틈없이 이어지도록 맞춘다.
 *
 * AI가 낸 경계는 대체로 이어지지만 반올림으로 미세한 틈이나 겹침이 생길 수
 * 있다. 오버레이가 시안을 덮지 못하는 구간이 생기면 사용자가 그 부분을 어느
 * 구역으로 봐야 할지 알 수 없다.
 */
export function normalizeSections(sections: EditableSection[]): EditableSection[] {
  const sorted = [...sections].sort((a, b) => a.bounds.topRatio - b.bounds.topRatio);

  // 첫 구역은 맨 위에서 시작하고, 각 구역은 다음 구역이 시작하는 지점까지 차지한다.
  const tops = sorted.map((section, index) => (index === 0 ? 0 : section.bounds.topRatio));

  return sorted.map((section, index) => ({
    ...section,
    bounds: {
      topRatio: tops[index],
      heightRatio: (index === sorted.length - 1 ? 1 : tops[index + 1]) - tops[index],
    },
  }));
}

/** 구역의 아래쪽 끝. */
function bottomOf(section: EditableSection): number {
  return section.bounds.topRatio + section.bounds.heightRatio;
}

/**
 * `index`와 `index + 1` 사이의 경계를 옮긴다 (F-03-06).
 * 양쪽 구역이 최소 높이를 지키는 범위 안으로 제한한다.
 */
export function moveBoundary(
  sections: EditableSection[],
  index: number,
  ratio: number,
  designHeight: number,
): EditableSection[] {
  const upper = sections[index];
  const lower = sections[index + 1];
  if (!upper || !lower) return sections;

  const minRatio = minRatioOf(designHeight);
  const min = upper.bounds.topRatio + minRatio;
  const max = bottomOf(lower) - minRatio;
  if (min > max) return sections;

  const boundary = clamp(ratio, min, max);

  return sections.map((section, position) => {
    if (position === index) {
      return {
        ...section,
        bounds: { topRatio: section.bounds.topRatio, heightRatio: boundary - section.bounds.topRatio },
      };
    }
    if (position === index + 1) {
      return {
        ...section,
        bounds: { topRatio: boundary, heightRatio: bottomOf(section) - boundary },
      };
    }
    return section;
  });
}

/** 합쳐진 구역의 구조 트리를 만든다. 판정에 쓰이지 않고 2단계 입력으로만 쓰인다. */
function mergeStructures(first: unknown, second: unknown): unknown {
  const isMerged =
    typeof first === "object" &&
    first !== null &&
    (first as { role?: unknown }).role === "합쳐진 구역";

  if (isMerged) {
    const merged = first as { role: string; children: unknown[] };
    return { role: "합쳐진 구역", children: [...merged.children, second] };
  }
  return { role: "합쳐진 구역", children: [first, second] };
}

/**
 * `index` 구역을 바로 아래 구역과 합친다 (F-03-04).
 * 최소 한 개 구역은 남는다 (F-03-09).
 */
export function mergeWithNext(
  sections: EditableSection[],
  index: number,
): EditableSection[] {
  const upper = sections[index];
  const lower = sections[index + 1];
  if (!upper || !lower) return sections;

  const merged: EditableSection = {
    ...upper,
    name: `${upper.name} + ${lower.name}`,
    bounds: {
      topRatio: upper.bounds.topRatio,
      heightRatio: bottomOf(lower) - upper.bounds.topRatio,
    },
    // 합친 구역은 더 이상 다른 구역과 같은 구조가 아니다.
    sameStructureAs: null,
    structure: mergeStructures(upper.structure, lower.structure),
  };

  return [...sections.slice(0, index), merged, ...sections.slice(index + 2)];
}

/**
 * `index` 구역을 지정한 지점에서 둘로 나눈다 (F-03-05).
 * 지점을 주지 않으면 가운데를 쓴다.
 *
 * 나뉜 두 구역은 원래 구조 트리를 그대로 물려받는다. 트리는 원래 구역
 * 기준이라 새 경계와 어긋날 수 있으며, 2단계에서 어떻게 다룰지는 미정이다.
 */
export function splitSection(
  sections: EditableSection[],
  index: number,
  designHeight: number,
  ratio?: number,
): EditableSection[] {
  const target = sections[index];
  if (!target) return sections;

  const minRatio = minRatioOf(designHeight);
  if (target.bounds.heightRatio < minRatio * 2) return sections;

  const min = target.bounds.topRatio + minRatio;
  const max = bottomOf(target) - minRatio;
  const boundary = clamp(
    ratio ?? target.bounds.topRatio + target.bounds.heightRatio / 2,
    min,
    max,
  );

  const upper: EditableSection = {
    ...target,
    bounds: {
      topRatio: target.bounds.topRatio,
      heightRatio: boundary - target.bounds.topRatio,
    },
  };
  const lower: EditableSection = {
    ...target,
    id: createSectionId(),
    name: `${target.name} (아래)`,
    sameStructureAs: null,
    bounds: { topRatio: boundary, heightRatio: bottomOf(target) - boundary },
  };

  return [...sections.slice(0, index), upper, lower, ...sections.slice(index + 1)];
}

/** 구역 이름을 바꾼다 (F-03-07). */
export function renameSection(
  sections: EditableSection[],
  index: number,
  name: string,
): EditableSection[] {
  return sections.map((section, position) =>
    position === index ? { ...section, name } : section,
  );
}

/** 구역들이 위에서 아래로 빈틈없이 이어지는지. 검증용. */
export function isContiguous(sections: EditableSection[]): boolean {
  if (sections.length === 0) return false;
  if (Math.abs(sections[0].bounds.topRatio) > 0.0001) return false;
  if (Math.abs(bottomOf(sections[sections.length - 1]) - 1) > 0.0001) return false;

  return sections.every((section, index) => {
    if (index === 0) return true;
    return Math.abs(sections[index - 1].bounds.topRatio + sections[index - 1].bounds.heightRatio - section.bounds.topRatio) < 0.0001;
  });
}
