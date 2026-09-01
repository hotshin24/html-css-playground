/**
 * 등록된 소스 저장소.
 *
 * PRD 6장의 데이터 구조를 그대로 담는다. 시안 이미지는 Blob으로 함께 보관한다.
 */

import type { SectionStatus } from "@/lib/judging/combined";
import type { FeedbackItem } from "@/lib/judging/feedback";
import type { RecommendedCondition, RequiredCondition } from "@/lib/judging/schema";
import {
  deleteRecord,
  readAllRecords,
  readRecord,
  SOURCE_STORE,
  writeRecord,
} from "@/lib/storage/indexedDbDriver";

export type LearningMode = "whole" | "sectioned";

/**
 * 소스가 등록 절차의 어디까지 왔는지.
 *
 * 조건 생성이 구역 확정 이후로 옮겨졌으므로(PRD 3장) 분석이 두 시점으로
 * 나뉘고, 그 사이 상태를 구분할 값이 필요하다.
 */
export type SourceStage =
  /** 등록만 됨. 구조 분석 전이거나 실패한 상태. */
  | "structure-pending"
  /** 구조 분석 완료. 구역 확정 대기. */
  | "sections-pending"
  /** 조건·예시까지 생성됨. 학습 가능. */
  | "ready";

export type SectionBounds = {
  topRatio: number;
  heightRatio: number;
};

export type StoredSection = {
  id: string;
  name: string;
  order: number;
  bounds: SectionBounds;
  sameStructureAs: string | null;
  /** 1단계 분석의 의미 구조 트리. 판정에는 쓰지 않는다. */
  structure: unknown;
  required: RequiredCondition[];
  recommended: RecommendedCondition[];
  example: { html: string; css: string };
};

/**
 * 마지막 판정 결과. 구역을 옮겼다 돌아와도 다시 볼 수 있어야 한다.
 *
 * 통과한 구역은 확인 버튼을 다시 누를 수 없으므로, 저장해 두지 않으면
 * 학습자가 무엇을 지적받았는지 확인할 방법이 사라진다. 권장 조건 안내는
 * 통과해도 표시되는 정보라 더욱 그렇다.
 */
export type SectionResult = {
  /** 그때 판정이 낸 결과. 구역의 진행 상태(status)와는 별개다. */
  phase: "passed" | "failed" | "revealed";
  /** 새 시도였는지, 이미 끝난 구역을 다시 본 것인지. */
  mode: "attempt" | "recheck";
  /** 실패한 조건과 그때 보여준 힌트. 통과 시에는 빈 배열이다. */
  feedback: FeedbackItem[];
  recommended: RecommendedCondition[];
  substitutedSectionIds: string[];
  /** 실패 상태에서 남아 있던 시도 횟수. */
  attemptsLeft: number | null;
  /**
   * 판정에 쓴 코드.
   *
   * 이후 코드가 바뀌었는지는 플래그가 아니라 이 값과의 비교로 판단한다.
   * 변경 감지 시점과 저장 시점이 어긋나도 결과가 흔들리지 않는다.
   */
  code: { html: string; css: string };
};

export type SectionProgress = {
  status: SectionStatus;
  attemptsUsed: number;
  code: { html: string; css: string };
  needsRecheck: boolean;
  recheckCause: string | null;
  /** 아직 한 번도 확인하지 않았으면 null. */
  lastResult: SectionResult | null;
};

export type StoredSource = {
  id: string;
  title: string;
  createdAt: string;
  stage: SourceStage;
  source: {
    type: "image";
    /** 리사이즈·변환을 마친 시안 이미지. */
    file: Blob;
    width: number;
    height: number;
  };
  settings: {
    mode: LearningMode;
    maxAttempts: number;
  };
  /** 학습자에게 보조 정보로 표시. 판정에는 쓰지 않는다. */
  reference: unknown;
  /** 구조 분석이 남긴 주의 사항. 구역이 너무 많을 때 등. 없으면 null. */
  analysisWarning: string | null;
  mainTitleSectionId: string | null;
  sections: StoredSection[];
  progress: {
    currentSection: string | null;
    sections: Record<string, SectionProgress>;
  };
};

export type NewSourceInput = {
  title: string;
  file: Blob;
  width: number;
  height: number;
  mode: LearningMode;
  maxAttempts: number;
};

function createId(): string {
  return `src-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** 소스를 새로 등록한다. 분석은 아직 수행하지 않는다. */
export async function createSource(input: NewSourceInput): Promise<StoredSource | null> {
  const source: StoredSource = {
    id: createId(),
    title: input.title,
    createdAt: new Date().toISOString(),
    stage: "structure-pending",
    source: {
      type: "image",
      file: input.file,
      width: input.width,
      height: input.height,
    },
    settings: {
      mode: input.mode,
      maxAttempts: input.maxAttempts,
    },
    reference: null,
    analysisWarning: null,
    mainTitleSectionId: null,
    sections: [],
    progress: { currentSection: null, sections: {} },
  };

  const saved = await writeRecord(SOURCE_STORE, source);
  return saved ? source : null;
}

export async function loadSource(id: string): Promise<StoredSource | null> {
  return readRecord<StoredSource>(SOURCE_STORE, id);
}

/** 목록은 최근 등록 순으로 돌려준다. */
export async function listSources(): Promise<StoredSource[]> {
  const sources = await readAllRecords<StoredSource>(SOURCE_STORE);
  return sources.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveSource(source: StoredSource): Promise<boolean> {
  return writeRecord(SOURCE_STORE, source);
}

export async function deleteSource(id: string): Promise<boolean> {
  return deleteRecord(SOURCE_STORE, id);
}
