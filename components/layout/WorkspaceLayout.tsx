"use client";

import { useEffect, useRef, useState } from "react";
import EditorPane from "@/components/editor/EditorPane";
import ColumnResizer from "@/components/layout/ColumnResizer";
import DesignPane from "@/components/layout/DesignPane";
import FeedbackPanel from "@/components/layout/FeedbackPanel";
import PaneHeader from "@/components/layout/PaneHeader";
import RowResizer from "@/components/layout/RowResizer";
import TopBar from "@/components/layout/TopBar";
import PreviewFrame from "@/components/preview/PreviewFrame";
import type { LearningSession } from "@/lib/learning/useLearningSession";
import { loadLayout, saveLayout } from "@/lib/storage/layoutStore";
import {
  loadEditorSettings,
  saveEditorSettings,
} from "@/lib/storage/settingsStore";
import {
  DEFAULT_COLUMN_RATIOS,
  DEFAULT_EDITOR_ROW_RATIOS,
  DEFAULT_EDITOR_SETTINGS,
  MIN_COLUMN_PX,
  MIN_EDITOR_ROW_PX,
  RESIZER_PX,
  SAVE_DEBOUNCE_MS,
  type ColumnRatios,
  type EditorRowRatios,
  type EditorSettings,
} from "@/lib/constants";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

type WorkspaceLayoutProps = {
  /** 1열에 표시할 시안 이미지. 등록된 소스의 Blob URL이다. */
  designImageSrc: string;
  session: LearningSession;
};

/**
 * 학습 화면 전체 골격.
 *
 * 열 너비와 에디터 높이는 px가 아니라 비율로 들고 있다.
 * 창 크기가 달라져도 배분이 유지되고, 5단계에서 저장·복원할 때도 그대로 쓸 수 있다.
 */
export default function WorkspaceLayout({
  designImageSrc,
  session,
}: WorkspaceLayoutProps) {
  const [columns, setColumns] = useState<ColumnRatios>(DEFAULT_COLUMN_RATIOS);
  const [editorRows, setEditorRows] = useState<EditorRowRatios>(
    DEFAULT_EDITOR_ROW_RATIOS,
  );
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);

  // 에디터 설정. 5단계에서 저장 계층으로 연결한다.
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(
    DEFAULT_EDITOR_SETTINGS,
  );
  const [dragging, setDragging] = useState<"column" | "row" | null>(null);

  // 통짜 모드는 구역 강조가 없다 (PRD 5.4). 구역별 모드에서만 경계를 넘긴다.
  const currentBounds =
    session.source?.settings.mode === "sectioned"
      ? (session.source.sections.find(
          (section) => section.id === session.sectionId,
        )?.bounds ?? null)
      : null;

  // 저장값 복원이 끝나기 전에는 화면을 보여주지 않는다.
  // 저장 계층이 비동기라 복원은 첫 페인트 이후에 끝나고,
  // 그대로 두면 기본 비율로 한 번 그렸다가 저장값으로 튀는 것이 보인다.
  const [hydrated, setHydrated] = useState(false);

  // 가장 최근 저장의 성공 여부. 세 대상이 같은 저장소를 쓰므로 하나로 묶어 본다.
  const [saveFailed, setSaveFailed] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  const editorColumnRef = useRef<HTMLDivElement>(null);

  // 드래그를 시작한 시점의 비율. 이동량은 이 값을 기준으로 계산한다.
  const columnSnapshot = useRef<ColumnRatios>(DEFAULT_COLUMN_RATIOS);
  const rowSnapshot = useRef<EditorRowRatios>(DEFAULT_EDITOR_ROW_RATIOS);

  // 마운트 후에 저장값을 읽는다. 서버 렌더링 결과는 항상 기본값이므로
  // 여기서 상태를 바꿔도 하이드레이션 불일치가 생기지 않는다.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      const [layout, settings] = await Promise.all([
        loadLayout(),
        loadEditorSettings(),
      ]);
      if (cancelled) return;

      if (layout) {
        setColumns(layout.columns);
        setEditorRows(layout.editorRows);
      }
      setEditorSettings(settings);
      setHydrated(true);
    };

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  // 레이아웃 비율 저장. 드래그 중에는 디바운스로 묶여 한 번만 기록된다.
  useEffect(() => {
    if (!hydrated) return;

    const timer = setTimeout(() => {
      void saveLayout({ columns, editorRows }).then((ok) => setSaveFailed(!ok));
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [hydrated, columns, editorRows]);

  // 설정은 토글 시점에 바로 저장한다.
  useEffect(() => {
    if (!hydrated) return;
    void saveEditorSettings(editorSettings).then((ok) => setSaveFailed(!ok));
  }, [hydrated, editorSettings]);

  /** 확인 버튼. 판정 결과는 하단 패널에 표시한다. */
  const handleSubmit = () => {
    setFeedbackExpanded(true);
    void session.submit();
  };

  const endDrag = () => setDragging(null);

  const startColumnDrag = () => {
    columnSnapshot.current = columns;
    setDragging("column");
  };

  /** boundary 0은 시안·에디터 사이, 1은 에디터·결과 화면 사이 경계다. */
  const dragColumn = (boundary: 0 | 1, deltaPx: number) => {
    // 리사이저 두 개는 고정 폭이므로 비율 계산에서 제외한다.
    const areaWidth = (bodyRef.current?.clientWidth ?? 0) - RESIZER_PX * 2;
    if (areaWidth <= 0) return;

    const start = columnSnapshot.current;
    const left = boundary;
    const right = boundary + 1;

    // 양쪽 열이 최소 너비를 지키는 범위 안으로 이동량을 제한한다.
    const delta = clamp(
      deltaPx / areaWidth,
      MIN_COLUMN_PX[left] / areaWidth - start[left],
      start[right] - MIN_COLUMN_PX[right] / areaWidth,
    );

    const next = [...start] as ColumnRatios;
    next[left] = start[left] + delta;
    next[right] = start[right] - delta;
    setColumns(next);
  };

  const startRowDrag = () => {
    rowSnapshot.current = editorRows;
    setDragging("row");
  };

  const dragRow = (deltaPx: number) => {
    const areaHeight =
      (editorColumnRef.current?.clientHeight ?? 0) - RESIZER_PX;
    if (areaHeight <= 0) return;

    const start = rowSnapshot.current;
    const minRatio = MIN_EDITOR_ROW_PX / areaHeight;
    const delta = clamp(
      deltaPx / areaHeight,
      minRatio - start[0],
      start[1] - minRatio,
    );

    setEditorRows([start[0] + delta, start[1] - delta]);
  };

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col ${hydrated ? "" : "invisible"}`}
    >
      <TopBar
        settings={editorSettings}
        onSettingsChange={setEditorSettings}
        saveFailed={saveFailed || session.saveFailed}
        session={session}
        onSubmit={handleSubmit}
      />

      <div
        ref={bodyRef}
        className={`grid min-h-0 flex-1 ${
          dragging === "column"
            ? "cursor-col-resize select-none"
            : dragging === "row"
              ? "cursor-row-resize select-none"
              : ""
        }`}
        style={{
          gridTemplateColumns: `${columns[0]}fr ${RESIZER_PX}px ${columns[1]}fr ${RESIZER_PX}px ${columns[2]}fr`,
        }}
      >
        {/* 1열 — 시안 */}
        <section className="flex min-h-0 min-w-0 flex-col bg-chrome-panel">
          <PaneHeader>시안</PaneHeader>
          <DesignPane
            imageSrc={designImageSrc}
            bounds={currentBounds}
            sectionId={session.sectionId}
          />
        </section>

        <ColumnResizer
          label="시안과 에디터 사이 경계"
          onDragStart={startColumnDrag}
          onDrag={(deltaPx) => dragColumn(0, deltaPx)}
          onDragEnd={endDrag}
        />

        {/* 2열 — HTML/CSS 에디터 */}
        <div
          ref={editorColumnRef}
          className="grid min-h-0 min-w-0"
          style={{
            gridTemplateRows: `${editorRows[0]}fr ${RESIZER_PX}px ${editorRows[1]}fr`,
          }}
        >
          <EditorPane
            label="HTML"
            language="html"
            value={session.html}
            onChange={session.setHtml}
            settings={editorSettings}
          />

          <RowResizer
            label="HTML과 CSS 에디터 사이 경계"
            onDragStart={startRowDrag}
            onDrag={dragRow}
            onDragEnd={endDrag}
          />

          <EditorPane
            label="CSS"
            language="css"
            value={session.css}
            onChange={session.setCss}
            settings={editorSettings}
          />
        </div>

        <ColumnResizer
          label="에디터와 결과 화면 사이 경계"
          onDragStart={startColumnDrag}
          onDrag={(deltaPx) => dragColumn(1, deltaPx)}
          onDragEnd={endDrag}
        />

        {/* 3열 — 실시간 결과 화면 */}
        <section className="flex min-h-0 min-w-0 flex-col bg-chrome-panel">
          <PaneHeader>결과 화면</PaneHeader>
          {/* 미리보기는 학습자 CSS만 적용된 상태여야 하므로 내부에 아무것도 주입하지
              않는다. 대신 바깥에 어두운 프레임을 둘러 흰 배경이 창 안의 페이지로
              읽히게 한다. 1열 시안도 같은 프레임을 써서 두 열이 참조 대상임을 보인다. */}
          <div className="min-h-0 flex-1 p-3">
            <div className="h-full overflow-hidden rounded-lg border border-chrome-border bg-chrome-bg p-2">
              <div className="h-full overflow-hidden rounded-md">
                <PreviewFrame html={session.html} css={session.css} />
              </div>
            </div>
          </div>
        </section>
      </div>

      <FeedbackPanel
        expanded={feedbackExpanded}
        onToggle={() => setFeedbackExpanded((previous) => !previous)}
        state={session.feedbackState}
      />
    </div>
  );
}
