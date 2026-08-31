"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { runConditionGeneration } from "@/lib/ai/runConditionGeneration";
import { runStructureAnalysis } from "@/lib/ai/runStructureAnalysis";
import {
  deleteSource,
  listSources,
  type SourceStage,
  type StoredSource,
} from "@/lib/storage/sourceStore";

const STAGE_LABEL: Record<SourceStage, string> = {
  "structure-pending": "분석 대기",
  "sections-pending": "구역 확인 필요",
  ready: "학습 가능",
};

const MODE_LABEL = { whole: "통짜", sectioned: "구역별" } as const;

/** 소스 카드 하나. 썸네일 URL의 수명을 스스로 관리한다. */
function SourceCard({
  source,
  onDelete,
  onAnalyze,
  analyzing,
  error,
}: {
  source: StoredSource;
  onDelete: (id: string) => void;
  onAnalyze: (source: StoredSource) => void;
  analyzing: boolean;
  error: string | null;
}) {
  // 렌더 중에 만들고 정리만 효과에 맡긴다.
  const thumbnailUrl = useMemo(
    () => URL.createObjectURL(source.source.file),
    [source.source.file],
  );
  useEffect(() => () => URL.revokeObjectURL(thumbnailUrl), [thumbnailUrl]);

  const registeredAt = new Date(source.createdAt).toLocaleDateString("ko-KR");

  return (
    <li className="flex gap-4 rounded-lg border border-chrome-border bg-chrome-panel p-4">
      <div className="h-28 w-40 shrink-0 overflow-hidden border border-chrome-border bg-white">
        {/* 저장된 Blob을 표시하므로 next/image를 쓰지 않는다. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailUrl} alt="" className="w-full" />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-medium">{source.title}</h2>
        <p className="mt-1 text-xs text-chrome-muted">
          {MODE_LABEL[source.settings.mode]} · 시도 {source.settings.maxAttempts}회 ·{" "}
          {registeredAt}
        </p>
        <p className="mt-2 text-xs text-chrome-muted">{STAGE_LABEL[source.stage]}</p>

        {analyzing && (
          <p className="mt-1 text-xs text-chrome-muted">
            {source.settings.mode === "whole"
              ? "시안을 읽고 판정 조건과 모범 예시를 만듭니다. 1~2분 걸립니다."
              : "시안의 구조와 구역을 읽고 있습니다. 수 초 걸립니다."}
          </p>
        )}
        {error && <p className="mt-1 text-xs text-chrome-danger">{error}</p>}
        {source.analysisWarning && (
          <p className="mt-1 max-w-prose text-xs leading-relaxed text-chrome-warning">
            {source.analysisWarning}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          {source.stage === "structure-pending" && (
            <button
              type="button"
              onClick={() => onAnalyze(source)}
              disabled={analyzing}
              className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-chrome-on-accent disabled:cursor-not-allowed disabled:bg-chrome-handle disabled:text-chrome-on-disabled"
            >
              {analyzing ? "분석 중…" : "분석 시작"}
            </button>
          )}
          {source.stage === "sections-pending" &&
            (source.settings.mode === "whole" ? (
              // 통짜 모드는 구역 편집 화면을 거치지 않는다 (PRD 5.5).
              // 조건 생성이 실패했을 때만 이 상태로 남는다.
              <button
                type="button"
                onClick={() => onAnalyze(source)}
                disabled={analyzing}
                className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-chrome-on-accent disabled:cursor-not-allowed disabled:bg-chrome-handle disabled:text-chrome-on-disabled"
              >
                {analyzing ? "조건 만드는 중…" : "조건 생성 다시 시도"}
              </button>
            ) : (
              <Link
                href={`/sources/${source.id}/sections`}
                className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-chrome-on-accent"
              >
                구역 확인
              </Link>
            ))}
          {source.stage === "ready" && (
            <Link
              href={`/sources/${source.id}/learn`}
              className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-chrome-on-accent"
            >
              이어하기
            </Link>
          )}

          <button
            type="button"
            onClick={() => onDelete(source.id)}
            className="rounded-md border border-chrome-border px-3 py-1.5 text-sm text-chrome-muted hover:text-chrome-text"
          >
            삭제
          </button>
        </div>
      </div>
    </li>
  );
}

/** 등록된 소스 목록 (F-01-05). */
export default function SourceList() {
  const [sources, setSources] = useState<StoredSource[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    listSources().then((loaded) => {
      if (!cancelled) setSources(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnalyze = async (source: StoredSource) => {
    setAnalyzingId(source.id);
    setErrors((current) => {
      const next = { ...current };
      delete next[source.id];
      return next;
    });

    // 구조 분석이 끝난 소스를 다시 누르면(통짜 재시도) 그 단계는 건너뛴다.
    let analyzed = source;
    if (source.stage === "structure-pending") {
      const outcome = await runStructureAnalysis(source);
      if (!outcome.ok) {
        setAnalyzingId(null);
        // 등록 시점에 조건이 부실하면 학습 내내 영향을 받으므로 화면에 알린다.
        setErrors((current) => ({ ...current, [source.id]: outcome.error }));
        return;
      }
      analyzed = outcome.source;
      setSources(
        (current) =>
          current?.map((entry) => (entry.id === analyzed.id ? analyzed : entry)) ?? null,
      );
    }

    // 통짜 모드는 구역을 확인할 것이 없으므로 조건 생성까지 이어서 끝낸다 (PRD 5.5).
    if (analyzed.settings.mode !== "whole") {
      setAnalyzingId(null);
      return;
    }

    const generated = await runConditionGeneration(analyzed);
    setAnalyzingId(null);

    if (!generated.ok) {
      setErrors((current) => ({ ...current, [source.id]: generated.error }));
      return;
    }

    setSources(
      (current) =>
        current?.map((entry) => (entry.id === generated.source.id ? generated.source : entry)) ??
        null,
    );
  };

  const handleDelete = async (id: string) => {
    await deleteSource(id);
    setSources((current) => current?.filter((source) => source.id !== id) ?? null);
    setPendingDelete(null);
  };

  if (!sources) {
    return <p className="mt-6 text-sm text-chrome-muted">불러오는 중…</p>;
  }

  return (
    <div className="mt-6">
      {sources.length === 0 ? (
        <div className="rounded-lg border border-dashed border-chrome-border p-10 text-center">
          <p className="text-sm text-chrome-muted">
            등록된 시안이 없습니다. 연습하고 싶은 화면을 올려보세요.
          </p>
          <Link
            href="/sources/new"
            className="mt-4 inline-block rounded-md bg-chrome-accent px-4 py-2 text-sm font-medium text-chrome-on-accent"
          >
            시안 등록
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {sources.map((source) =>
            pendingDelete === source.id ? (
              <li
                key={source.id}
                className="flex items-center justify-between rounded-lg border border-chrome-border bg-chrome-panel p-4"
              >
                <p className="text-sm">
                  <strong>{source.title}</strong>을(를) 삭제하면 작성한 코드와 진행 상태도 함께
                  사라집니다.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDelete(source.id)}
                    className="rounded-md bg-chrome-danger-strong px-3 py-1.5 text-sm font-medium text-white"
                  >
                    삭제
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(null)}
                    className="rounded-md border border-chrome-border px-3 py-1.5 text-sm"
                  >
                    취소
                  </button>
                </div>
              </li>
            ) : (
              <SourceCard
                key={source.id}
                source={source}
                onDelete={setPendingDelete}
                onAnalyze={(target) => void handleAnalyze(target)}
                analyzing={analyzingId === source.id}
                error={errors[source.id] ?? null}
              />
            ),
          )}
        </ul>
      )}
    </div>
  );
}
