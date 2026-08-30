"use client";

import { useRef, useState, type ReactNode } from "react";
import EditorPane from "@/components/editor/EditorPane";
import ColumnResizer from "@/components/layout/ColumnResizer";
import FeedbackPanel from "@/components/layout/FeedbackPanel";
import PaneHeader from "@/components/layout/PaneHeader";
import RowResizer from "@/components/layout/RowResizer";
import TopBar from "@/components/layout/TopBar";
import {
  DEFAULT_COLUMN_RATIOS,
  DEFAULT_EDITOR_ROW_RATIOS,
  DEFAULT_EDITOR_SETTINGS,
  DUMMY_SESSION,
  MIN_COLUMN_PX,
  MIN_EDITOR_ROW_PX,
  RESIZER_PX,
  type ColumnRatios,
  type EditorRowRatios,
  type EditorSettings,
} from "@/lib/constants";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/** 내용이 아직 없는 영역의 자리 표시. */
function PanePlaceholder({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center">
      <p className="text-sm text-chrome-muted">{children}</p>
    </div>
  );
}

/**
 * 학습 화면 전체 골격.
 *
 * 열 너비와 에디터 높이는 px가 아니라 비율로 들고 있다.
 * 창 크기가 달라져도 배분이 유지되고, 5단계에서 저장·복원할 때도 그대로 쓸 수 있다.
 */
export default function WorkspaceLayout() {
  const [columns, setColumns] = useState<ColumnRatios>(DEFAULT_COLUMN_RATIOS);
  const [editorRows, setEditorRows] = useState<EditorRowRatios>(
    DEFAULT_EDITOR_ROW_RATIOS,
  );
  const [feedbackExpanded, setFeedbackExpanded] = useState(false);

  // 사용자가 작성한 코드. 4단계에서 미리보기로, 5단계에서 저장 계층으로 연결한다.
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");

  // 에디터 설정. 5단계에서 저장 계층으로 연결한다.
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(
    DEFAULT_EDITOR_SETTINGS,
  );
  const [dragging, setDragging] = useState<"column" | "row" | null>(null);

  const bodyRef = useRef<HTMLDivElement>(null);
  const editorColumnRef = useRef<HTMLDivElement>(null);

  // 드래그를 시작한 시점의 비율. 이동량은 이 값을 기준으로 계산한다.
  const columnSnapshot = useRef<ColumnRatios>(DEFAULT_COLUMN_RATIOS);
  const rowSnapshot = useRef<EditorRowRatios>(DEFAULT_EDITOR_ROW_RATIOS);

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
    const areaHeight = (editorColumnRef.current?.clientHeight ?? 0) - RESIZER_PX;
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
    <div className="flex min-h-0 flex-1 flex-col">
      <TopBar settings={editorSettings} onSettingsChange={setEditorSettings} />

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
        <section className="flex min-w-0 flex-col bg-chrome-panel">
          <PaneHeader>시안</PaneHeader>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {/* 향후 사용자가 업로드한 이미지를 Blob URL로 표시하므로 next/image를 쓰지 않는다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DUMMY_SESSION.designImageSrc}
              alt={`${DUMMY_SESSION.sectionName} 구역 시안`}
              className="w-full"
            />
          </div>
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
            value={htmlCode}
            onChange={setHtmlCode}
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
            value={cssCode}
            onChange={setCssCode}
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
        <section className="flex min-w-0 flex-col bg-chrome-panel">
          <PaneHeader>결과 화면</PaneHeader>
          <PanePlaceholder>미리보기 준비 중</PanePlaceholder>
        </section>
      </div>

      <FeedbackPanel
        expanded={feedbackExpanded}
        onToggle={() => setFeedbackExpanded((previous) => !previous)}
      />
    </div>
  );
}
