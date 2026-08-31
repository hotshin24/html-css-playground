"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState } from "react";
import { formatBytes, prepareDesignImage, type PreparedImage } from "@/lib/image/prepareDesignImage";
import { createSource, type LearningMode } from "@/lib/storage/sourceStore";

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

/** 소스 등록 폼 (F-01). */
export default function SourceForm() {
  const router = useRouter();
  const titleId = useId();
  const fileId = useId();
  const attemptsId = useId();
  const noticeId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [prepared, setPrepared] = useState<PreparedImage | null>(null);

  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<LearningMode>("sectioned");
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 렌더 중에 만들고 정리만 효과에 맡긴다.
  const previewUrl = useMemo(
    () => (prepared ? URL.createObjectURL(prepared.blob) : null),
    [prepared],
  );
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const handleFile = async (selected: File | null) => {
    setError(null);
    setPrepared(null);
    setFile(selected);
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("PNG 또는 JPG 파일을 올려주세요.");
      return;
    }

    try {
      const result = await prepareDesignImage(selected);
      setPrepared(result);
      // 제목을 비워 뒀다면 파일명을 기본값으로 쓴다.
      setTitle((current) => current || selected.name.replace(/\.[^.]+$/, ""));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "이미지를 처리할 수 없습니다.");
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prepared || !agreed || saving) return;

    setSaving(true);
    setError(null);

    const source = await createSource({
      title: title.trim() || "제목 없음",
      file: prepared.blob,
      width: prepared.width,
      height: prepared.height,
      mode,
      maxAttempts,
    });

    if (!source) {
      setSaving(false);
      setError("저장에 실패했습니다. 브라우저 저장 공간을 확인해주세요.");
      return;
    }

    router.push("/");
  };

  const canSubmit = Boolean(prepared) && agreed && !saving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor={fileId} className="block text-sm font-medium">
          시안 이미지
        </label>
        <p className="mt-1 text-xs text-chrome-muted">PNG 또는 JPG</p>
        <input
          id={fileId}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm file:mr-3 file:rounded-md file:border file:border-chrome-border file:bg-chrome-panel file:px-3 file:py-1.5 file:text-sm"
        />

        {prepared && previewUrl && (
          <div className="mt-3 flex gap-4">
            {/* 업로드한 이미지를 Blob URL로 표시하므로 next/image를 쓰지 않는다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="업로드한 시안 미리보기"
              className="h-40 w-auto border border-chrome-border"
            />
            <dl className="text-xs text-chrome-muted">
              <dt className="font-medium text-chrome-text">원본</dt>
              <dd>
                {prepared.originalWidth}×{prepared.originalHeight} ·{" "}
                {formatBytes(prepared.originalBytes)}
              </dd>
              <dt className="mt-2 font-medium text-chrome-text">저장본 (WebP)</dt>
              <dd>
                {prepared.width}×{prepared.height} · {formatBytes(prepared.blob.size)}
              </dd>
              <dd className="mt-2 max-w-xs leading-relaxed">
                브라우저 저장 공간을 아끼기 위해 가로 1600px로 줄이고 WebP로 변환합니다. 시맨틱과
                레이아웃 판단에는 영향이 없습니다.
              </dd>
            </dl>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={titleId} className="block text-sm font-medium">
          제목
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="쇼핑몰 메인"
          className="mt-2 w-full rounded-md border border-chrome-border bg-chrome-panel px-3 py-2 text-sm"
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium">학습 모드</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "sectioned"}
              onChange={() => setMode("sectioned")}
              className="mt-1 accent-chrome-accent"
            />
            <span className="text-sm">
              구역별
              <span className="block text-xs text-chrome-muted">
                시안을 구역으로 나눠 하나씩 작성합니다. 구역을 확인·조정하는 단계를 거칩니다.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === "whole"}
              onChange={() => setMode("whole")}
              className="mt-1 accent-chrome-accent"
            />
            <span className="text-sm">
              통짜
              <span className="block text-xs text-chrome-muted">
                시안 전체를 한 번에 작성합니다.
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <label htmlFor={attemptsId} className="block text-sm font-medium">
          시도 횟수
        </label>
        <p className="mt-1 text-xs text-chrome-muted">
          횟수를 적게 두면 힌트 단계가 압축되어 더 빨리 구체적인 안내가 나옵니다.
        </p>
        <select
          id={attemptsId}
          value={maxAttempts}
          onChange={(event) => setMaxAttempts(Number(event.target.value))}
          className="mt-2 rounded-md border border-chrome-border bg-chrome-panel px-3 py-2 text-sm"
        >
          {[1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>
              {count}회
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-md border border-chrome-border bg-chrome-panel p-3">
        <label htmlFor={noticeId} className="flex items-start gap-2">
          <input
            id={noticeId}
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="mt-0.5 accent-chrome-accent"
          />
          <span className="text-xs leading-relaxed text-chrome-muted">
            업로드한 시안의 저작권 확인과 사용 권한은 등록한 사용자에게 책임이 있습니다. 타인의
            저작물을 권한 없이 등록하지 않았음을 확인합니다.
          </span>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-chrome-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-chrome-handle"
        >
          {saving ? "등록 중…" : "등록"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-md border border-chrome-border px-4 py-2 text-sm"
        >
          취소
        </button>
        {file && !prepared && !error && (
          <span className="text-sm text-chrome-muted">이미지 처리 중…</span>
        )}
      </div>
    </form>
  );
}
