/**
 * 판정 실행.
 *
 * 구역 문서와 결합 문서를 각각 띄워 조건별 판정 함수를 돌린다.
 */

import {
  checkFormLabel,
  checkHeadingOrder,
  checkHeadingSingle,
  checkImageAlt,
  checkLayoutResult,
  checkListGrouping,
  type CheckResult,
} from "@/lib/judging/checks";
import {
  buildCombinedDocument,
  isDocumentScopeApplicable,
  type SectionInput,
} from "@/lib/judging/combined";
import { ENGINE_CONDITION_TYPES, type ConditionTypeId } from "@/lib/judging/conditionTypes";
import { openJudgeDocument } from "@/lib/judging/judgeFrame";
import type { RecommendedCondition, RequiredCondition } from "@/lib/judging/schema";

export type ConditionOutcome = {
  /** 엔진 상시 조건은 rubric에 없으므로 유형 이름을 id로 쓴다. */
  id: string;
  type: ConditionTypeId;
  origin: "engine" | "ai";
  passed: boolean;
  expected: Record<string, unknown> | null;
  actual: Record<string, unknown> | null;
};

export type JudgeResult = {
  /** 필수 조건을 모두 통과했는지. */
  passed: boolean;
  outcomes: ConditionOutcome[];
  /** 통과 여부와 무관하게 안내할 권장 조건. */
  recommended: RecommendedCondition[];
  /** 문서 전체 범위 조건을 적용했는지 (F-08-10). */
  documentScopeApplied: boolean;
  /** 결합에 예시 코드가 쓰인 구역. 화면에 표시해야 한다 (F-08-08). */
  substitutedSectionIds: string[];
};

export type JudgeInput = {
  sections: SectionInput[];
  currentSectionId: string;
  mainTitleSectionId: string;
  required: RequiredCondition[];
  recommended: RecommendedCondition[];
};

/** 현재 구역 문서로 판정하는 유형. */
function runSectionCheck(
  condition: RequiredCondition,
  judgeDocument: Document,
): CheckResult {
  switch (condition.type) {
    case "image-alt":
      return checkImageAlt(judgeDocument);
    case "form-label":
      return checkFormLabel(judgeDocument);
    case "list-grouping":
      return checkListGrouping(judgeDocument, condition.accept);
    case "layout-result":
      // 스키마 검증이 accept를 정확히 1개로 보장한다 (F-02-14).
      return checkLayoutResult(judgeDocument, condition.accept[0]);
    default:
      throw new Error(`구역 범위 판정을 지원하지 않는 유형입니다: ${condition.type}`);
  }
}

/** 결합 문서로 판정하는 유형. */
function runEngineCheck(type: ConditionTypeId, judgeDocument: Document): CheckResult {
  switch (type) {
    case "heading-order":
      return checkHeadingOrder(judgeDocument);
    case "heading-single":
      return checkHeadingSingle(judgeDocument);
    default:
      throw new Error(`엔진 상시 판정을 지원하지 않는 유형입니다: ${type}`);
  }
}

export async function judgeSection(input: JudgeInput): Promise<JudgeResult> {
  const current = input.sections.find((section) => section.id === input.currentSectionId);
  if (!current) {
    throw new Error(`현재 구역을 찾을 수 없습니다: ${input.currentSectionId}`);
  }

  // 구역 문서. layout-result 측정이 필요하므로 CSS를 함께 넣는다.
  const sectionOutcomes = await openJudgeDocument(
    current.code.html,
    current.code.css,
    (judgeDocument) =>
      input.required.map((condition): ConditionOutcome => {
        const result = runSectionCheck(condition, judgeDocument);
        return {
          id: condition.id,
          type: condition.type,
          origin: "ai",
          passed: result.passed,
          expected: result.expected,
          actual: result.actual,
        };
      }),
  );

  const documentScopeApplied = isDocumentScopeApplicable(
    input.sections,
    input.currentSectionId,
    input.mainTitleSectionId,
  );

  let engineOutcomes: ConditionOutcome[] = [];
  let substitutedSectionIds: string[] = [];

  if (documentScopeApplied) {
    const combined = buildCombinedDocument(input.sections, input.currentSectionId);
    substitutedSectionIds = combined.substitutedSectionIds;

    // 결합 문서는 HTML만 담는다. 여기서는 DOM 구조만 보므로 측정하지 않는다.
    engineOutcomes = await openJudgeDocument(combined.html, "", (judgeDocument) =>
      ENGINE_CONDITION_TYPES.map((type): ConditionOutcome => {
        const result = runEngineCheck(type.id as ConditionTypeId, judgeDocument);
        return {
          id: type.id,
          type: type.id as ConditionTypeId,
          origin: "engine",
          passed: result.passed,
          expected: result.expected,
          actual: result.actual,
        };
      }),
    );
  }

  const outcomes = [...sectionOutcomes, ...engineOutcomes];

  return {
    passed: outcomes.every((outcome) => outcome.passed),
    outcomes,
    recommended: input.recommended,
    documentScopeApplied,
    substitutedSectionIds,
  };
}
