"use client";

import { useCallback, useState } from "react";

/**
 * 자리표시 이미지 경로를 골라 복사한다 (F-05-07).
 *
 * 시안 열 아래에 둔다. 시안을 보면서 필요한 비율을 바로 고를 수 있고,
 * 상단 바를 늘리지 않는다.
 */

const SIZES: { label: string; width: number; height: number }[] = [
  { label: "정사각", width: 400, height: 400 },
  { label: "4:3", width: 400, height: 300 },
  { label: "16:9", width: 480, height: 270 },
  { label: "세로", width: 300, height: 400 },
  { label: "배너", width: 1200, height: 300 },
  { label: "아이콘", width: 64, height: 64 },
];

const pathOf = (width: number, height: number) => `/placeholder/${width}x${height}.svg`;

export default function PlaceholderPicker() {
  const [copied, setCopied] = useState<string | null>(null);
  /** 복사에 실패했을 때 직접 읽어 쓸 수 있도록 남기는 경로. */
  const [fallback, setFallback] = useState<string | null>(null);

  const copy = useCallback(async (path: string) => {
    setFallback(null);
    try {
      await navigator.clipboard.writeText(path);
      setCopied(path);
      window.setTimeout(() => setCopied((current) => (current === path ? null : current)), 1600);
    } catch {
      // 창에 포커스가 없거나 권한이 없으면 실패한다. 누른 경로를 그대로 보여
      // 직접 옮겨 적을 수 있게 한다.
      setFallback(path);
    }
  }, []);

  return (
    <div className="shrink-0 border-t border-chrome-border px-3 py-2">
      <p className="text-xs text-chrome-muted">
        자리표시 이미지 — 눌러서 경로 복사
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {SIZES.map(({ label, width, height }) => {
          const path = pathOf(width, height);
          return (
            <button
              key={path}
              type="button"
              onClick={() => void copy(path)}
              title={path}
              className="rounded border border-chrome-border px-2 py-1 text-xs text-chrome-muted hover:border-chrome-accent hover:text-chrome-text"
            >
              {copied === path ? "복사됨" : `${label} ${width}×${height}`}
            </button>
          );
        })}
      </div>
      {fallback && (
        <p className="mt-1.5 text-xs text-chrome-warning">
          복사하지 못했습니다. 아래 경로를 직접 적어 주세요.
          <br />
          <code className="mt-1 inline-block select-all rounded bg-chrome-bg px-1.5 py-0.5 text-chrome-text">
            {fallback}
          </code>
        </p>
      )}
    </div>
  );
}
