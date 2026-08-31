/**
 * 조건 JSON 스키마 검증 (F-02-11, F-02-12).
 *
 * 프롬프트만으로는 화이트리스트 준수를 보장할 수 없으므로, 판정에 넘기기 전에
 * 형태를 검사해 목록 밖의 값과 파라미터가 빠진 조건을 걸러낸다.
 *
 * `desc`와 `target`은 표시 전용이라 검증하지 않고 판정에도 쓰지 않는다.
 */

import {
  findConditionType,
  type ConditionTypeId,
} from "@/lib/judging/conditionTypes";

/** accept 항목. 유형이 요구하는 키를 모두 가져야 한다. */
export type AcceptParams = Record<string, number>;

export type HintSet = { "1": string; "2": string; "3": string };

export type RequiredCondition = {
  id: string;
  level: "required";
  type: ConditionTypeId;
  accept: AcceptParams[];
  /** 표시용. 판정에 사용하지 않는다. */
  target: string | null;
  /** 표시용. 판정에 사용하지 않는다. */
  desc: string | null;
  /** 없으면 유형별 고정 템플릿으로 대체한다. */
  hints: HintSet | null;
};

export type RecommendedCondition = {
  id: string;
  level: "recommended";
  target: string | null;
  desc: string | null;
};

export type ValidatedSection = {
  id: string;
  order: number;
  required: RequiredCondition[];
  recommended: RecommendedCondition[];
};

export type SchemaIssueCode =
  | "malformed"
  | "unknown-type"
  | "deferred-type"
  | "invalid-accept"
  | "accept-cardinality"
  | "unused-accept"
  | "missing-hints"
  | "no-required-condition"
  | "invalid-main-title-section";

export type SchemaIssue = {
  code: SchemaIssueCode;
  scope: "analysis" | "section" | "condition";
  /** 해당 대상을 실제로 걸러냈는지. false면 기록만 하고 통과시킨 것이다. */
  rejected: boolean;
  message: string;
  sectionId?: string;
  conditionId?: string;
};

export type ValidationResult =
  | {
      ok: true;
      mainTitleSectionId: string;
      sections: ValidatedSection[];
      issues: SchemaIssue[];
    }
  | { ok: false; issues: SchemaIssue[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** 개수를 나타내는 파라미터이므로 1 이상의 정수만 받는다. */
function asCount(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : null;
}

function parseHints(value: unknown): HintSet | null {
  if (!isRecord(value)) return null;
  const first = asString(value["1"]);
  const second = asString(value["2"]);
  const third = asString(value["3"]);
  if (!first || !second || !third) return null;
  return { "1": first, "2": second, "3": third };
}

/**
 * 필수 조건 하나를 검증한다.
 * 통과하면 정규화된 조건을, 거부하면 null을 반환하고 issues에 사유를 남긴다.
 */
function validateRequired(
  raw: Record<string, unknown>,
  sectionId: string,
  issues: SchemaIssue[],
): RequiredCondition | null {
  const conditionId = asString(raw.id) ?? "(id 없음)";
  const reject = (code: SchemaIssueCode, message: string) => {
    issues.push({ code, scope: "condition", rejected: true, message, sectionId, conditionId });
    return null;
  };

  const typeId = asString(raw.type);
  if (!typeId) return reject("malformed", "type이 없습니다.");

  const definition = findConditionType(typeId);
  if (!definition) {
    return reject("unknown-type", `화이트리스트에 없는 유형입니다: ${typeId}`);
  }
  if (definition.status !== "active") {
    return reject("deferred-type", `보류 중인 유형입니다: ${typeId}`);
  }
  if (definition.origin === "engine") {
    // 엔진이 항상 검사하므로 rubric에 있으면 중복 판정이 된다 (F-08-09).
    return reject("unknown-type", `엔진이 상시 검사하는 유형은 rubric에 둘 수 없습니다: ${typeId}`);
  }

  const rawAccept = raw.accept;
  const acceptItems = Array.isArray(rawAccept) ? rawAccept : [];

  if (definition.acceptCardinality === "none") {
    if (acceptItems.length > 0) {
      // 판정에 쓰지 않으므로 거부하지 않되, 프롬프트 품질 지표로 남긴다.
      issues.push({
        code: "unused-accept",
        scope: "condition",
        rejected: false,
        message: `${typeId}은 파라미터를 쓰지 않는데 accept가 들어 있어 무시했습니다.`,
        sectionId,
        conditionId,
      });
    }
  } else {
    if (acceptItems.length === 0) {
      return reject("invalid-accept", `${typeId}에 accept가 없습니다.`);
    }
    if (definition.acceptCardinality === "single" && acceptItems.length !== 1) {
      return reject(
        "accept-cardinality",
        `${typeId}의 accept는 정확히 1개여야 하는데 ${acceptItems.length}개입니다.`,
      );
    }
  }

  const accept: AcceptParams[] = [];
  for (const item of acceptItems) {
    if (definition.acceptCardinality === "none") break;
    if (!isRecord(item)) {
      return reject("invalid-accept", "accept 항목이 객체가 아닙니다.");
    }
    const params: AcceptParams = {};
    for (const key of definition.acceptKeys) {
      const count = asCount(item[key]);
      if (count === null) {
        return reject("invalid-accept", `accept 항목에 ${key}가 없거나 1 이상의 정수가 아닙니다.`);
      }
      params[key] = count;
    }
    accept.push(params);
  }

  const hints = parseHints(raw.hints);
  if (!hints) {
    // 힌트가 없어도 판정은 가능하다. 고정 템플릿으로 대체한다.
    issues.push({
      code: "missing-hints",
      scope: "condition",
      rejected: false,
      message: "3단계 힌트가 없어 고정 템플릿으로 대체합니다.",
      sectionId,
      conditionId,
    });
  }

  return {
    id: conditionId,
    level: "required",
    type: definition.id as ConditionTypeId,
    accept,
    target: asString(raw.target),
    desc: asString(raw.desc),
    hints,
  };
}

/** 분석 결과 전체를 검증한다. */
export function validateAnalysis(input: unknown): ValidationResult {
  const issues: SchemaIssue[] = [];

  if (!isRecord(input) || !Array.isArray(input.sections)) {
    issues.push({
      code: "malformed",
      scope: "analysis",
      rejected: true,
      message: "sections 배열이 없습니다.",
    });
    return { ok: false, issues };
  }

  const sections: ValidatedSection[] = [];

  input.sections.forEach((rawSection, index) => {
    if (!isRecord(rawSection)) {
      issues.push({
        code: "malformed",
        scope: "section",
        rejected: true,
        message: `${index}번째 구역이 객체가 아닙니다.`,
      });
      return;
    }

    const sectionId = asString(rawSection.id) ?? `(${index}번째 구역)`;
    const order = asCount(rawSection.order) ?? index + 1;
    const rawRubric = Array.isArray(rawSection.rubric) ? rawSection.rubric : [];

    const required: RequiredCondition[] = [];
    const recommended: RecommendedCondition[] = [];

    for (const entry of rawRubric) {
      if (!isRecord(entry)) {
        issues.push({
          code: "malformed",
          scope: "condition",
          rejected: true,
          message: "rubric 항목이 객체가 아닙니다.",
          sectionId,
        });
        continue;
      }

      if (entry.level === "required") {
        const condition = validateRequired(entry, sectionId, issues);
        if (condition) required.push(condition);
        continue;
      }

      if (entry.level === "recommended") {
        recommended.push({
          id: asString(entry.id) ?? "(id 없음)",
          level: "recommended",
          target: asString(entry.target),
          desc: asString(entry.desc),
        });
        continue;
      }

      issues.push({
        code: "malformed",
        scope: "condition",
        rejected: true,
        message: `알 수 없는 등급입니다: ${String(entry.level)}`,
        sectionId,
        conditionId: asString(entry.id) ?? undefined,
      });
    }

    sections.push({ id: sectionId, order, required, recommended });
  });

  // 문서 전체 범위 조건의 검사 시작 구역 (F-02-16, F-08-10).
  const mainTitleSectionId = asString(input.mainTitleSectionId);
  const mainTitleSection = sections.find((section) => section.id === mainTitleSectionId);
  const mainTitleExists = mainTitleSection !== undefined;

  /*
   * 필수 조건이 없는 구역은 그 자체로 오류가 아니다.
   * 저작권 문구만 있는 푸터처럼 화이트리스트에 걸리는 것이 없는 구역이 실제로
   * 존재하며, 그런 구역도 엔진 상시 조건(heading-single, heading-order)은
   * 결합 문서에서 검사받는다.
   *
   * 문제가 되는 것은 최상위 제목 구역보다 앞선 구역이다. 그 구간은 엔진 상시
   * 조건도 건너뛰므로(F-08-10) 조건이 하나도 없으면 무엇을 작성해도 통과한다.
   */
  for (const section of sections) {
    if (section.required.length > 0) continue;

    const beforeMainTitle =
      mainTitleSection !== undefined && section.order < mainTitleSection.order;

    issues.push({
      code: "no-required-condition",
      scope: "section",
      rejected: beforeMainTitle,
      message: beforeMainTitle
        ? "최상위 제목 구역보다 앞선 구역에 필수 조건이 없어 무엇을 작성해도 통과합니다."
        : "필수 조건이 없습니다. 문서 전체 범위 조건만 검사합니다.",
      sectionId: section.id,
    });
  }

  if (!mainTitleExists) {
    issues.push({
      code: "invalid-main-title-section",
      scope: "analysis",
      rejected: true,
      message:
        mainTitleSectionId === null
          ? "mainTitleSectionId가 없습니다."
          : `mainTitleSectionId가 존재하지 않는 구역을 가리킵니다: ${mainTitleSectionId}`,
    });
  }

  const blocked = issues.some(
    (issue) => issue.rejected && issue.scope !== "condition",
  );
  if (blocked || !mainTitleExists) {
    return { ok: false, issues };
  }

  return { ok: true, mainTitleSectionId: mainTitleSectionId as string, sections, issues };
}
