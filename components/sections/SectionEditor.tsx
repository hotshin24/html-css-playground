"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { runConditionGeneration } from "@/lib/ai/runConditionGeneration";
import {
  isContiguous,
  mergeWithNext,
  moveBoundary,
  normalizeSections,
  renameSection,
  splitSection,
  type EditableSection,
} from "@/lib/sections/editOperations";
import { loadSource, saveSource, type StoredSource } from "@/lib/storage/sourceStore";

type LoadState =
  | { phase: "loading" }
  | { phase: "missing" }
  | { phase: "ready"; source: StoredSource };

/** 시안 위에 구역을 반투명 박스로 겹쳐 보여준다 (F-03-03). */
function Overlay({
  imageUrl,
  sections,
  selectedIndex,
  onSelect,
  onMoveBoundary,
}: {
  imageUrl: string;
  sections: EditableSection[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onMoveBoundary: (index: number, ratio: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  /** 포인터 위치를 이미지 세로 비율로 바꾼다. */
  const toRatio = (clientY: number): number => {
    const box = containerRef.current?.getBoundingClientRect();
    if (!box || box.height === 0) return 0;
    return (clientY - box.top) / box.height;
  };

  return (
    <div ref={containerRef} className="relative select-none">
      {/* 저장된 Blob을 표시하므로 next/image를 쓰지 않는다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="등록한 시안" className="block w-full" />

      {sections.map((section, index) => {
        const selected = index === selectedIndex;
        return (
          <button
            type="button"
            key={section.id}
            onClick={() => onSelect(index)}
            aria-pressed={selected}
            className={`absolute left-0 w-full border-y text-left transition-colors ${
              selected
                ? "border-chrome-accent bg-chrome-accent/20"
                : "border-chrome-border/70 bg-chrome-text/5 hover:bg-chrome-text/10"
            }`}
            style={{
              top: `${section.bounds.topRatio * 100}%`,
              height: `${section.bounds.heightRatio * 100}%`,
            }}
          >
            <span
              className={`m-1 inline-block rounded px-1.5 py-0.5 text-xs ${
                selected ? "bg-chrome-accent text-white" : "bg-chrome-panel text-chrome-muted"
              }`}
            >
              {index + 1}. {section.name}
            </span>
          </button>
        );
      })}

      {/* 구역 사이 경계선. 위아래로 끌어 범위를 조정한다 (F-03-06). */}
      {sections.slice(0, -1).map((section, index) => (
        <div
          key={`boundary-${section.id}`}
          role="separator"
          aria-orientation="horizontal"
          aria-label={`${section.name}과 ${sections[index + 1].name} 사이 경계`}
          tabIndex={0}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(index);
          }}
          onPointerMove={(event) => {
            if (dragging !== index) return;
            onMoveBoundary(index, toRatio(event.clientY));
          }}
          onPointerUp={(event) => {
            if (dragging !== index) return;
            event.currentTarget.releasePointerCapture(event.pointerId);
            setDragging(null);
          }}
          onKeyDown={(event) => {
            if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
            event.preventDefault();
            const current =
              section.bounds.topRatio + section.bounds.heightRatio;
            onMoveBoundary(index, current + (event.key === "ArrowUp" ? -0.01 : 0.01));
          }}
          className={`absolute left-0 h-2 w-full -translate-y-1 cursor-row-resize outline-none ${
            dragging === index ? "bg-chrome-accent" : "bg-chrome-accent/50 hover:bg-chrome-accent"
          }`}
          style={{ top: `${(section.bounds.topRatio + section.bounds.heightRatio) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** 구역 확인 및 조정 화면 (PRD 5.4). */
export default function SectionEditor({ sourceId }: { sourceId: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ phase: "loading" });
  const [sections, setSections] = useState<EditableSection[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  /** 조건 생성 진행 상황. 구역마다 따로 요청하므로 몇 개가 끝났는지 알 수 있다. */
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSource(sourceId).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setState({ phase: "missing" });
        return;
      }
      setState({ phase: "ready", source: loaded });
      setSections(normalizeSections(loaded.sections));
    });
    return () => {
      cancelled = true;
    };
  }, [sourceId]);

  const source = state.phase === "ready" ? state.source : null;

  const imageUrl = useMemo(
    () => (source ? URL.createObjectURL(source.source.file) : null),
    [source],
  );
  useEffect(() => {
    if (!imageUrl) return;
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  if (state.phase === "loading") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-chrome-muted">불러오는 중…</p>
      </main>
    );
  }

  if (state.phase === "missing" || !source || !imageUrl) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-chrome-muted">등록된 시안을 찾을 수 없습니다.</p>
        <Link href="/" className="text-sm text-chrome-accent">
          목록으로
        </Link>
      </main>
    );
  }

  const selected = sections[selectedIndex];
  const canMergeUp = selectedIndex > 0;
  const canMergeDown = selectedIndex < sections.length - 1;

  const apply = (next: EditableSection[], nextIndex = selectedIndex) => {
    setSections(next);
    setSelectedIndex(Math.min(Math.max(nextIndex, 0), next.length - 1));
  };

  const handleConfirm = async () => {
    setSaving(true);
    setError(null);

    // 확정된 구역으로 저장한다. 조건과 예시 생성은 이 다음 단계다 (F-02-17).
    const confirmed = sections.map((section, index) => ({
      ...source.sections.find((original) => original.id === section.id),
      id: section.id,
      name: section.name,
      order: index + 1,
      bounds: section.bounds,
      sameStructureAs: section.sameStructureAs,
      structure: section.structure,
      required: [],
      recommended: [],
      example: { html: "", css: "" },
    }));

    // 최상위 제목 구역이 병합·분할로 사라졌으면 첫 구역으로 되돌린다.
    // 값이 비면 문서 전체 범위 조건을 적용할 지점이 사라진다 (F-08-10).
    const mainTitleSectionId = sections.some((section) => section.id === source.mainTitleSectionId)
      ? source.mainTitleSectionId
      : (confirmed[0]?.id ?? null);

    const confirmedSource = { ...source, sections: confirmed, mainTitleSectionId };
    const saved = await saveSource(confirmedSource);
    if (!saved) {
      setSaving(false);
      setError("구역을 저장하지 못했습니다.");
      return;
    }

    // 확정된 구역으로 조건과 예시를 만든다 (F-02-17).
    const outcome = await runConditionGeneration(confirmedSource, (done, total) =>
      setProgress({ done, total }),
    );
    setSaving(false);
    setProgress(null);

    if (!outcome.ok) {
      const rejected = outcome.issues.filter((issue) => issue.rejected);
      setError(
        rejected.length > 0
          ? `${outcome.error} (거부된 조건 ${rejected.length}건: ${rejected.map((issue) => issue.message).join(" / ")})`
          : outcome.error,
      );
      return;
    }

    router.push("/");
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-chrome-border bg-chrome-panel px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm text-chrome-muted hover:text-chrome-text">
            ← 목록
          </Link>
          <h1 className="text-sm font-medium">구역 확인 · {source.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-chrome-muted">{sections.length}개 구역</span>
          {saving && (
            <span className="text-xs text-chrome-muted">
              {progress
                ? `판정 조건과 모범 예시를 만드는 중 — ${progress.done}/${progress.total} 구역`
                : "확정한 구역으로 판정 조건과 모범 예시를 만듭니다."}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving}
            className="rounded-md bg-chrome-accent px-4 py-1.5 text-sm font-medium text-white disabled:bg-chrome-handle"
          >
            {saving
              ? progress
                ? `조건 만드는 중 ${progress.done}/${progress.total}`
                : "조건 만드는 중…"
              : "구역 확정"}
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px]">
        <div className="min-h-0 overflow-y-auto border-r border-chrome-border p-6">
          <Overlay
            imageUrl={imageUrl}
            sections={sections}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onMoveBoundary={(index, ratio) =>
              setSections(moveBoundary(sections, index, ratio, source.source.height))
            }
          />
        </div>

        <aside className="min-h-0 overflow-y-auto bg-chrome-panel p-4">
          <p className="text-xs text-chrome-muted">
            AI가 나눈 결과입니다. 그대로 진행해도 되고, 조정할 수도 있습니다.
          </p>

          {/* 구조 분석이 남긴 주의 사항. 조용히 알리고 진행을 막지는 않는다. */}
          {source.analysisWarning && (
            <p className="mt-2 text-xs leading-relaxed text-chrome-warning">
              {source.analysisWarning} 구역이 많으면 하나씩 작성하는 데 시간이 오래 걸립니다.
              비슷한 구역을 병합해 수를 줄이거나, 시안을 나눠 등록하는 편이 낫습니다.
            </p>
          )}

          <ol className="mt-3 space-y-1">
            {sections.map((section, index) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`w-full truncate rounded-md px-2 py-1.5 text-left text-sm ${
                    index === selectedIndex ? "bg-chrome-accent text-white" : "hover:bg-chrome-bg"
                  }`}
                >
                  {index + 1}. {section.name}
                </button>
              </li>
            ))}
          </ol>

          {selected && (
            <div className="mt-5 border-t border-chrome-border pt-4">
              <h2 className="text-xs font-medium text-chrome-muted">선택 구역</h2>

              <label className="mt-2 block">
                <span className="text-xs text-chrome-muted">이름</span>
                <input
                  type="text"
                  value={selected.name}
                  onChange={(event) =>
                    setSections(renameSection(sections, selectedIndex, event.target.value))
                  }
                  className="mt-1 w-full rounded-md border border-chrome-border px-2 py-1.5 text-sm"
                />
              </label>

              <p className="mt-2 text-xs text-chrome-muted">
                시안 세로의 {Math.round(selected.bounds.topRatio * 100)}% 지점부터{" "}
                {Math.round(selected.bounds.heightRatio * 100)}% 만큼
              </p>

              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  disabled={!canMergeUp}
                  onClick={() => apply(mergeWithNext(sections, selectedIndex - 1), selectedIndex - 1)}
                  className="w-full rounded-md border border-chrome-border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:text-chrome-handle"
                >
                  위 구역과 병합
                </button>
                <button
                  type="button"
                  disabled={!canMergeDown}
                  onClick={() => apply(mergeWithNext(sections, selectedIndex))}
                  className="w-full rounded-md border border-chrome-border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:text-chrome-handle"
                >
                  아래 구역과 병합
                </button>
                <button
                  type="button"
                  onClick={() => apply(splitSection(sections, selectedIndex, source.source.height))}
                  className="w-full rounded-md border border-chrome-border px-3 py-1.5 text-sm"
                >
                  가운데서 나누기
                </button>
              </div>
            </div>
          )}

          {!isContiguous(sections) && (
            <p className="mt-4 text-xs text-red-600">
              구역이 시안을 빈틈없이 덮지 못하고 있습니다.
            </p>
          )}
          {error && <p className="mt-4 text-xs text-red-600">{error}</p>}
        </aside>
      </div>
    </main>
  );
}
