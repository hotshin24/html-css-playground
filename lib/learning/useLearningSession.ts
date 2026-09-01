"use client";

/**
 * 학습 세션 상태 (F-08).
 *
 * 구역별 코드·시도 횟수·통과 상태를 IndexedDB에 보관하고, 확인 시 판정을
 * 실행한다. 레이아웃 비율과 에디터 설정은 학습 내용이 아니므로 그대로
 * localStorage에 둔다 (PRD 7.3).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeedbackState } from "@/components/layout/FeedbackPanel";
import { SAVE_DEBOUNCE_MS } from "@/lib/constants";
import type { SectionInput } from "@/lib/judging/combined";
import { buildFailureFeedback } from "@/lib/judging/feedback";
import { judgeSection } from "@/lib/judging/judge";
import {
  loadSource,
  saveSource,
  type SectionResult,
  type StoredSource,
} from "@/lib/storage/sourceStore";

export type LearningSession = {
  source: StoredSource | null;
  missing: boolean;
  /** 현재 작성 중인 구역. */
  sectionId: string | null;
  sectionIndex: number;
  html: string;
  css: string;
  setHtml: (value: string) => void;
  setCss: (value: string) => void;
  attemptsUsed: number;
  maxAttempts: number;
  /** 확인 버튼을 누를 수 있는지. 끝난 구역에서도 다시 볼 수 있다. */
  canSubmit: boolean;
  /**
   * 확인이 새 시도인지 다시 보기인지.
   *
   * 이미 통과했거나 예시가 공개된 구역에서는 시도를 차감하지 않는다.
   * 학습자가 결과를 확인하는 행위에 비용을 물릴 이유가 없다 (F-08-06과 같은 취지).
   */
  submitMode: "attempt" | "recheck";
  feedbackState: FeedbackState;
  submit: () => Promise<void>;
  /** 잠기지 않은 구역으로 이동한다 (F-08-03). */
  selectSection: (id: string) => void;
  saveFailed: boolean;
};

/**
 * 저장된 판정 결과를 화면 상태로 되살린다.
 *
 * 판정 당시 코드와 지금 코드가 다르면 결과가 낡았다는 표시를 붙인다.
 * 지우지 않는 이유는, 학습자가 무엇을 지적받았는지 보려고 돌아오는 경우가
 * 많고 코드를 조금 고쳤다고 그 정보가 쓸모없어지지는 않기 때문이다.
 */
function restoreFeedback(
  result: SectionResult | null,
  example: { html: string; css: string },
  code: { html: string; css: string },
  restored: boolean,
): FeedbackState {
  if (!result) return { phase: "idle" };

  const shared = {
    recommended: result.recommended,
    substitutedSectionIds: result.substitutedSectionIds,
    /** 방금 실행한 결과가 아니라 저장해 둔 것을 다시 꺼낸 경우. */
    restored,
    /** 판정 이후 코드가 바뀌어 결과가 지금 코드와 맞지 않는 경우. */
    stale: result.code.html !== code.html || result.code.css !== code.css,
    /** 이미 끝난 구역을 다시 본 결과. 시도는 쓰이지 않았다. */
    recheck: result.mode === "recheck",
  };

  if (result.phase === "passed") return { phase: "passed", ...shared };
  if (result.phase === "revealed") {
    return { phase: "revealed", feedback: result.feedback, example, ...shared };
  }
  // null은 "시도가 쓰이지 않았다"는 뜻이므로 0으로 바꾸면 안 된다.
  return {
    phase: "failed",
    feedback: result.feedback,
    attemptsLeft: result.attemptsLeft,
    ...shared,
  };
}

/** 판정에 넘길 구역 목록. 저장된 코드와 예시를 붙인다. */
function toJudgeSections(source: StoredSource): SectionInput[] {
  return source.sections.map((section) => {
    const progress = source.progress.sections[section.id];
    return {
      id: section.id,
      order: section.order,
      status: progress?.status ?? "locked",
      code: progress?.code ?? { html: "", css: "" },
      example: section.example,
    };
  });
}

export function useLearningSession(sourceId: string): LearningSession {
  const [source, setSource] = useState<StoredSource | null>(null);
  const [missing, setMissing] = useState(false);
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({ phase: "idle" });
  const [saveFailed, setSaveFailed] = useState(false);

  /** 마지막으로 저장한 코드. 복원 직후 같은 값을 다시 쓰지 않기 위한 것이다. */
  const savedCodeRef = useRef<{ sectionId: string; html: string; css: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSource(sourceId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setMissing(true);
        return;
      }

      const current =
        loaded.progress.currentSection ?? loaded.sections[0]?.id ?? null;
      const code = current ? loaded.progress.sections[current]?.code : undefined;

      const entry = current ? loaded.progress.sections[current] : undefined;
      const target = loaded.sections.find((item) => item.id === current);

      setSource(loaded);
      setSectionId(current);
      setHtml(code?.html ?? "");
      setCss(code?.css ?? "");
      setFeedbackState(
        restoreFeedback(
          entry?.lastResult ?? null,
          target?.example ?? { html: "", css: "" },
          entry?.code ?? { html: "", css: "" },
          true,
        ),
      );
      savedCodeRef.current = current
        ? { sectionId: current, html: code?.html ?? "", css: code?.css ?? "" }
        : null;
    });
    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  const section = useMemo(
    () => source?.sections.find((entry) => entry.id === sectionId) ?? null,
    [source, sectionId],
  );
  const progress = sectionId ? source?.progress.sections[sectionId] : undefined;

  // 코드 자동 저장. 저장값과 같으면 쓰지 않는다.
  useEffect(() => {
    if (!source || !sectionId) return;

    const timer = setTimeout(() => {
      const last = savedCodeRef.current;
      if (last && last.sectionId === sectionId && last.html === html && last.css === css) {
        return;
      }

      const entry = source.progress.sections[sectionId];
      if (!entry) return;

      const next: StoredSource = {
        ...source,
        progress: {
          ...source.progress,
          sections: {
            ...source.progress.sections,
            [sectionId]: { ...entry, code: { html, css } },
          },
        },
      };

      savedCodeRef.current = { sectionId, html, css };
      void saveSource(next).then((ok) => {
        setSaveFailed(!ok);
        if (ok) setSource(next);
      });
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [source, sectionId, html, css]);

  const selectSection = useCallback(
    (id: string) => {
      if (!source) return;
      const entry = source.progress.sections[id];
      if (!entry || entry.status === "locked") return;

      const target = source.sections.find((item) => item.id === id);

      setSectionId(id);
      setHtml(entry.code.html);
      setCss(entry.code.css);
      savedCodeRef.current = { sectionId: id, html: entry.code.html, css: entry.code.css };
      // 구역을 옮겼다 돌아와도 지난 판정 결과를 다시 볼 수 있어야 한다.
      setFeedbackState(
        restoreFeedback(
          entry.lastResult,
          target?.example ?? { html: "", css: "" },
          entry.code,
          true,
        ),
      );
    },
    [source],
  );

  const submit = useCallback(async () => {
    if (!source || !sectionId || !section || !progress) return;
    if (feedbackState.phase === "judging") return;

    setFeedbackState({ phase: "judging" });

    // 이미 끝난 구역에서 다시 누른 경우다. 결과만 새로 보여 주고 진행 상태는
    // 건드리지 않는다. 통과를 되돌리면 F-08-06이 막으려던 되감기가 생긴다.
    const isRecheck = progress.status === "passed" || progress.status === "revealed";
    const maxAttempts = source.settings.maxAttempts;
    const attempt = isRecheck ? progress.attemptsUsed : progress.attemptsUsed + 1;

    // 판정에는 방금 작성한 코드를 쓴다. 자동 저장을 기다리지 않는다.
    const sections = toJudgeSections(source).map((entry) =>
      entry.id === sectionId ? { ...entry, code: { html, css } } : entry,
    );

    const result = await judgeSection({
      sections,
      currentSectionId: sectionId,
      mainTitleSectionId: source.mainTitleSectionId ?? sectionId,
      required: section.required,
      recommended: section.recommended,
    });

    const passed = result.passed;
    const exhausted = !isRecheck && !passed && attempt >= maxAttempts;

    /*
     * 판정이 낸 결과와 구역의 진행 상태를 분리한다.
     *
     * 통과한 구역을 재확인했는데 지금 코드가 조건을 만족하지 않으면, 결과는
     * 실패로 보여야 학습자가 무엇이 깨졌는지 안다. 그렇다고 status를 되돌리면
     * 뒤 구역이 잠겨 F-08-06이 막으려던 되감기가 생긴다.
     */
    const phase: SectionResult["phase"] = passed ? "passed" : exhausted ? "revealed" : "failed";

    const lastResult: SectionResult = {
      phase,
      mode: isRecheck ? "recheck" : "attempt",
      feedback: passed
        ? []
        : buildFailureFeedback(result.outcomes, section.required, attempt, maxAttempts),
      recommended: result.recommended,
      substitutedSectionIds: result.substitutedSectionIds,
      // 재확인은 시도를 쓰지 않으므로 남은 횟수를 말할 자리가 아니다.
      attemptsLeft: !isRecheck && phase === "failed" ? maxAttempts - attempt : null,
      code: { html, css },
    };

    // 통과했거나 시도를 소진했으면 다음 구역을 연다 (F-08-02).
    const nextSections = { ...source.progress.sections };
    nextSections[sectionId] = {
      ...progress,
      attemptsUsed: attempt,
      code: { html, css },
      status: isRecheck ? progress.status : passed ? "passed" : exhausted ? "revealed" : "in_progress",
      // 재확인은 이 구역을 직접 다시 잰 것이므로 재확인 표시를 지운다.
      needsRecheck: false,
      recheckCause: null,
      lastResult,
    };

    let nextCurrent = sectionId;
    if (!isRecheck && (passed || exhausted)) {
      const nextLocked = source.sections.find(
        (entry) => nextSections[entry.id]?.status === "locked",
      );
      if (nextLocked) {
        nextSections[nextLocked.id] = {
          ...nextSections[nextLocked.id],
          status: "in_progress",
        };
        nextCurrent = nextLocked.id;
      }

      /*
       * 이 구역의 코드가 바뀌면 문서 전체 범위 조건의 결과도 달라질 수 있다.
       * 이미 통과한 다른 구역에 재확인 표시를 남기되, 통과 상태와 개방은
       * 유지한다. 실패 원인이 그 구역이 아니기 때문이다 (F-08-06).
       */
      for (const entry of source.sections) {
        if (entry.id === sectionId) continue;
        const other = nextSections[entry.id];
        if (other?.status !== "passed") continue;
        nextSections[entry.id] = { ...other, needsRecheck: true, recheckCause: sectionId };
      }
    }

    const updated: StoredSource = {
      ...source,
      progress: { currentSection: nextCurrent, sections: nextSections },
    };

    const saved = await saveSource(updated);
    setSaveFailed(!saved);
    setSource(updated);
    savedCodeRef.current = { sectionId, html, css };

    setFeedbackState(restoreFeedback(lastResult, section.example, { html, css }, false));
  }, [source, sectionId, section, progress, feedbackState.phase, html, css]);

  const sectionIndex = source && sectionId
    ? source.sections.findIndex((entry) => entry.id === sectionId)
    : -1;

  const finished = progress?.status === "passed" || progress?.status === "revealed";

  return {
    source,
    missing,
    sectionId,
    sectionIndex,
    html,
    css,
    setHtml,
    setCss,
    attemptsUsed: progress?.attemptsUsed ?? 0,
    maxAttempts: source?.settings.maxAttempts ?? 3,
    canSubmit: Boolean(section) && feedbackState.phase !== "judging",
    submitMode: finished ? "recheck" : "attempt",
    feedbackState,
    submit,
    selectSection,
    saveFailed,
  };
}
