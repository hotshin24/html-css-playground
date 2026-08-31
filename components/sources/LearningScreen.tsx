"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import WorkspaceLayout from "@/components/layout/WorkspaceLayout";
import { useLearningSession } from "@/lib/learning/useLearningSession";

/** 학습 화면 진입점. 등록된 소스의 시안과 판정 조건을 물린다. */
export default function LearningScreen({ sourceId }: { sourceId: string }) {
  const session = useLearningSession(sourceId);
  const source = session.source;

  // Blob 자체를 의존성으로 삼는다. 저장할 때마다 소스 객체는 새로 만들어지지만
  // 이미지 Blob은 그대로이므로 URL을 다시 만들지 않는다.
  const imageFile = source?.source.file ?? null;
  const imageUrl = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  if (session.missing) {
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

  if (source.stage !== "ready") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-chrome-muted">아직 판정 조건이 준비되지 않았습니다.</p>
        <Link href="/" className="text-sm text-chrome-accent">
          목록으로
        </Link>
      </main>
    );
  }

  return <WorkspaceLayout designImageSrc={imageUrl} session={session} />;
}
