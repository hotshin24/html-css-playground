"use client";

import type { FeedbackItem } from "@/lib/judging/feedback";
import type { RecommendedCondition } from "@/lib/judging/schema";

/** 하단 패널이 보여줄 상태. */
export type FeedbackState =
  | { phase: "idle" }
  | { phase: "judging" }
  | { phase: "passed"; recommended: RecommendedCondition[]; substitutedSectionIds: string[] }
  | {
      phase: "failed";
      feedback: FeedbackItem[];
      recommended: RecommendedCondition[];
      substitutedSectionIds: string[];
      attemptsLeft: number;
    }
  | {
      phase: "revealed";
      feedback: FeedbackItem[];
      recommended: RecommendedCondition[];
      substitutedSectionIds: string[];
      example: { html: string; css: string };
    };

type FeedbackPanelProps = {
  expanded: boolean;
  onToggle: () => void;
  state: FeedbackState;
};

/** 결합 판정에 예시 코드가 쓰인 경우의 안내 (F-08-08). */
function SubstitutionNotice({ sectionIds }: { sectionIds: string[] }) {
  if (sectionIds.length === 0) return null;
  return (
    <p className="rounded-md bg-chrome-bg px-3 py-2 text-xs text-chrome-muted">
      제목 구조는 문서 전체를 기준으로 판정합니다. 시도를 소진한 구역(
      {sectionIds.join(", ")})은 학습자 코드 대신 <strong>모범 예시 코드</strong>로 대신했습니다.
    </p>
  );
}

function RecommendedList({ items }: { items: RecommendedCondition[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs font-medium text-chrome-muted">참고 — 통과에는 영향이 없습니다</h3>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-chrome-muted">
            {item.desc}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FailureList({ items }: { items: FeedbackItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.conditionId}>
          <p className="text-sm">{item.message}</p>
          <p className="mt-1 text-sm text-chrome-muted">{item.hint}</p>
        </li>
      ))}
    </ul>
  );
}

/** 시도를 소진했을 때 공개하는 모범 예시. 복사 기능을 제공하지 않는다 (F-07-05). */
function ExampleReveal({ example }: { example: { html: string; css: string } }) {
  return (
    <div>
      <h3 className="text-sm font-medium">모범 예시</h3>
      <p className="mt-1 text-xs text-chrome-muted">
        이것은 하나의 예시입니다. 다르게 작성하셨더라도 조건을 만족했다면 올바른 코드입니다.
      </p>
      <pre className="mt-2 overflow-x-auto rounded-md bg-chrome-bg p-3 text-xs">
        {example.html}
      </pre>
      {example.css.length > 0 && (
        <pre className="mt-2 overflow-x-auto rounded-md bg-chrome-bg p-3 text-xs">
          {example.css}
        </pre>
      )}
    </div>
  );
}

function PanelBody({ state }: { state: FeedbackState }) {
  switch (state.phase) {
    case "idle":
      return <p className="text-sm text-chrome-muted">판정 결과가 여기에 표시됩니다.</p>;

    case "judging":
      return <p className="text-sm text-chrome-muted">판정 중…</p>;

    case "passed":
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">통과했습니다.</p>
          <SubstitutionNotice sectionIds={state.substitutedSectionIds} />
          <RecommendedList items={state.recommended} />
        </div>
      );

    case "failed":
      return (
        <div className="space-y-3">
          <p className="text-sm text-chrome-muted">
            남은 시도 {state.attemptsLeft}회
          </p>
          <FailureList items={state.feedback} />
          <SubstitutionNotice sectionIds={state.substitutedSectionIds} />
          <RecommendedList items={state.recommended} />
        </div>
      );

    case "revealed":
      return (
        <div className="space-y-3">
          <p className="text-sm text-chrome-muted">시도를 모두 사용했습니다.</p>
          <FailureList items={state.feedback} />
          <ExampleReveal example={state.example} />
          <SubstitutionNotice sectionIds={state.substitutedSectionIds} />
          <RecommendedList items={state.recommended} />
        </div>
      );
  }
}

/**
 * 하단 채점 피드백 패널.
 * 기본 접힘이며, 확인 시 자동으로 펼쳐진다.
 */
export default function FeedbackPanel({ expanded, onToggle, state }: FeedbackPanelProps) {
  return (
    <section className="shrink-0 border-t border-chrome-border bg-chrome-panel">
      <div className="flex h-10 items-center justify-between px-4">
        <h2 className="text-sm font-medium">채점 피드백</h2>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="rounded-md border border-chrome-border px-2.5 py-1 text-xs text-chrome-muted hover:text-chrome-text"
        >
          {expanded ? "접기" : "펴기"}
        </button>
      </div>

      {expanded && (
        <div className="h-56 overflow-y-auto border-t border-chrome-border px-4 py-3">
          <PanelBody state={state} />
        </div>
      )}
    </section>
  );
}
