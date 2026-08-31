"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";
import { loadSource, type StoredSource } from "@/lib/storage/sourceStore";

/**
 * 학습 화면 진입점.
 *
 * 등록된 소스의 시안 이미지를 불러와 1열에 표시한다. 판정 조건은 AI 연동이
 * 붙기 전까지 임시 세션을 쓴다.
 */
export default function LearningScreen({ sourceId }: { sourceId: string }) {
  const [source, setSource] = useState<StoredSource | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;

    loadSource(sourceId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setMissing(true);
        return;
      }
      url = URL.createObjectURL(loaded.source.file);
      setSource(loaded);
      setImageUrl(url);
    });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [sourceId]);

  if (missing) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-chrome-muted">등록된 시안을 찾을 수 없습니다.</p>
        <Link href="/" className="text-sm text-chrome-accent">
          목록으로
        </Link>
      </main>
    );
  }

  if (!source || !imageUrl) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-chrome-muted">불러오는 중…</p>
      </main>
    );
  }

  return <WorkspaceLayout designImageSrc={imageUrl} />;
}
