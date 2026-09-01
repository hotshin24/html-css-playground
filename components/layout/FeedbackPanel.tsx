"use client";

import type { FeedbackItem } from "@/lib/judging/feedback";
import type { RecommendedCondition } from "@/lib/judging/schema";

/** 결과 상태가 공통으로 갖는 값. */
type ResultMeta = {
  recommended: RecommendedCondition[];
  substitutedSectionIds: string[];
  /** 방금 실행한 결과가 아니라 저장해 둔 것을 다시 꺼낸 경우. */
  restored: boolean;
  /** 판정 이후 코드가 바뀌어 결과가 지금 코드와 맞지 않는 경우. */
  stale: boolean;
  /** 이미 끝난 구역을 다시 본 결과. 시도가 쓰이지 않았다. */
  recheck: boolean;
  /** 시도를 소진해 예시가 공개된 구역인지. */
  revealedSection: boolean;
};

/** 하단 패널이 보여줄 상태. */
export type FeedbackState =
  | { phase: "idle" }
  | { phase: "judging" }
  | ({ phase: "passed" } & ResultMeta)
  | ({ phase: "failed"; feedback: FeedbackItem[]; attemptsLeft: number | null } & ResultMeta)
  | ({
      phase: "revealed";
      feedback: FeedbackItem[];
      example: { html: string; css: string };
    } & ResultMeta);

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

/**
 * 결과가 지금 코드와 맞지 않을 때의 표시.
 *
 * 지우지 않고 남기는 이유는, 학습자가 무엇을 지적받았는지 보려고 돌아오는
 * 경우가 많고 코드를 조금 고쳤다고 그 정보가 쓸모없어지지는 않기 때문이다.
 * 낡았다는 사실만 분명히 알린다.
 */
function StaleNotice({ state }: { state: ResultMeta }) {
  if (!state.stale) return null;
  return (
    <p className="rounded-md bg-chrome-bg px-3 py-2 text-xs text-chrome-warning">
      확인한 뒤 코드를 고쳤습니다. 아래는 지난 확인 시점의 결과입니다. 다시 확인을 누르면
      지금 코드로 새로 판정합니다.
    </p>
  );
}

/** 접혀 있을 때 머리말에 붙는 한 줄 요약. */
function CollapsedSummary({ state }: { state: FeedbackState }) {
  const label = (() => {
    switch (state.phase) {
      case "passed":
        return state.restored ? "지난 결과 — 통과" : "통과";
      case "failed":
        return state.restored
          ? `지난 결과 — 지적 ${state.feedback.length}건`
          : `지적 ${state.feedback.length}건`;
      case "revealed":
        return "모범 예시 공개됨";
      default:
        return null;
    }
  })();
  if (!label) return null;

  const tone = state.phase === "passed" ? "text-chrome-success" : "text-chrome-warning";
  return <span className={`text-xs ${tone}`}>{label}</span>;
}

/** 끝난 구역을 다시 확인해 결과가 상태와 어긋나는 경우. */
function RecheckMismatchNotice({ state }: { state: FeedbackState }) {
  if (state.phase === "idle" || state.phase === "judging" || !state.recheck) return null;

  if (state.phase === "failed") {
    return (
      <p className="rounded-md bg-chrome-bg px-3 py-2 text-xs text-chrome-warning">
        이 구역은 통과로 남아 있지만 지금 코드는 조건을 만족하지 않습니다. 뒤 구역이 잠기지는
        않으니 편할 때 고치면 됩니다.
      </p>
    );
  }

  if (state.phase === "passed" && state.revealedSection) {
    return (
      <p className="rounded-md bg-chrome-bg px-3 py-2 text-xs text-chrome-muted">
        지금 코드는 조건을 만족합니다. 시도를 소진한 구역이라 진행 상태는 그대로입니다.
      </p>
    );
  }

  return null;
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
          <p className="text-sm font-medium">
            {state.restored ? "지난 확인 결과 — 통과" : "통과했습니다."}
          </p>
          <StaleNotice state={state} />
          <RecheckMismatchNotice state={state} />
          <SubstitutionNotice sectionIds={state.substitutedSectionIds} />
          <RecommendedList items={state.recommended} />
        </div>
      );

    case "failed":
      return (
        <div className="space-y-3">
          <p className="text-sm text-chrome-muted">
            {state.attemptsLeft === null
              ? state.restored
                ? "지난 확인 결과"
                : "다시 확인했습니다. 시도는 쓰이지 않았습니다."
              : `남은 시도 ${state.attemptsLeft}회`}
          </p>
          <StaleNotice state={state} />
          <RecheckMismatchNotice state={state} />
          <FailureList items={state.feedback} />
          <SubstitutionNotice sectionIds={state.substitutedSectionIds} />
          <RecommendedList items={state.recommended} />
        </div>
      );

    case "revealed":
      return (
        <div className="space-y-3">
          <p className="text-sm text-chrome-muted">
            {state.recheck
              ? "다시 확인했습니다. 시도를 소진한 구역이라 예시는 그대로 볼 수 있습니다."
              : state.restored
                ? "지난 확인 결과 — 시도를 모두 사용함"
                : "시도를 모두 사용했습니다."}
          </p>
          <StaleNotice state={state} />
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
      <div className="flex h-10 items-center gap-2 px-4">
        <h2 className="text-sm font-medium">채점 피드백</h2>
        {/*
          접힌 상태에서는 저장된 결과가 있어도 보이지 않는다. 기본 접힘은
          유지하되(5.2), 볼 것이 있다는 사실은 알려야 학습자가 펴 볼 생각을 한다.
        */}
        {!expanded && <CollapsedSummary state={state} />}
        <span className="flex-1" />
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
