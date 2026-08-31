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
import { loadSource, saveSource, type StoredSource } from "@/lib/storage/sourceStore";

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
  /** 판정 중이거나 이미 끝난 구역이면 false. */
  canSubmit: boolean;
  feedbackState: FeedbackState;
  submit: () => Promise<void>;
  /** 잠기지 않은 구역으로 이동한다 (F-08-03). */
  selectSection: (id: string) => void;
  saveFailed: boolean;
};

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

      setSource(loaded);
      setSectionId(current);
      setHtml(code?.html ?? "");
      setCss(code?.css ?? "");
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

      setSectionId(id);
      setHtml(entry.code.html);
      setCss(entry.code.css);
      savedCodeRef.current = { sectionId: id, html: entry.code.html, css: entry.code.css };
      setFeedbackState({ phase: "idle" });
    },
    [source],
  );

  const submit = useCallback(async () => {
    if (!source || !sectionId || !section || !progress) return;
    if (feedbackState.phase === "judging") return;

    setFeedbackState({ phase: "judging" });

    const attempt = progress.attemptsUsed + 1;
    const maxAttempts = source.settings.maxAttempts;

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

    const shared = {
      recommended: result.recommended,
      substitutedSectionIds: result.substitutedSectionIds,
    };

    const passed = result.passed;
    const exhausted = !passed && attempt >= maxAttempts;

    // 통과했거나 시도를 소진했으면 다음 구역을 연다 (F-08-02).
    const nextSections = { ...source.progress.sections };
    nextSections[sectionId] = {
      ...progress,
      attemptsUsed: attempt,
      code: { html, css },
      status: passed ? "passed" : exhausted ? "revealed" : "in_progress",
      needsRecheck: false,
      recheckCause: null,
    };

    let nextCurrent = sectionId;
    if (passed || exhausted) {
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

    if (passed) {
      setFeedbackState({ phase: "passed", ...shared });
      return;
    }

    const feedback = buildFailureFeedback(result.outcomes, section.required, attempt, maxAttempts);

    if (exhausted) {
      setFeedbackState({ phase: "revealed", feedback, example: section.example, ...shared });
      return;
    }

    setFeedbackState({
      phase: "failed",
      feedback,
      attemptsLeft: maxAttempts - attempt,
      ...shared,
    });
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
    canSubmit: Boolean(section) && feedbackState.phase !== "judging" && !finished,
    feedbackState,
    submit,
    selectSection,
    saveFailed,
  };
}
