"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
}: {
  source: StoredSource;
  onDelete: (id: string) => void;
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

        <div className="mt-3 flex items-center gap-2">
          {source.stage === "structure-pending" && (
            <button
              type="button"
              disabled
              title="AI 분석 연동 준비 중입니다."
              className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-chrome-handle"
            >
              분석 시작
            </button>
          )}
          {source.stage === "sections-pending" && (
            <Link
              href={`/sources/${source.id}/sections`}
              className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-white"
            >
              구역 확인
            </Link>
          )}
          {source.stage === "ready" && (
            <Link
              href={`/sources/${source.id}/learn`}
              className="rounded-md bg-chrome-accent px-3 py-1.5 text-sm font-medium text-white"
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

  useEffect(() => {
    let cancelled = false;
    listSources().then((loaded) => {
      if (!cancelled) setSources(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
            className="mt-4 inline-block rounded-md bg-chrome-accent px-4 py-2 text-sm font-medium text-white"
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
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
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
              <SourceCard key={source.id} source={source} onDelete={setPendingDelete} />
            ),
          )}
        </ul>
      )}
    </div>
  );
}
