import { STORAGE_KEYS, type ColumnRatios, type EditorRowRatios } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/storage/localDriver";

export type StoredLayout = {
  columns: ColumnRatios;
  editorRows: EditorRowRatios;
};

/** 합이 1인 양수 비율 배열인지 확인한다. */
function isRatioTuple(value: unknown, length: number): boolean {
  if (!Array.isArray(value) || value.length !== length) return false;

  const numbers = value as unknown[];
  if (!numbers.every((n) => typeof n === "number" && Number.isFinite(n) && n > 0)) {
    return false;
  }

  const sum = (numbers as number[]).reduce((total, n) => total + n, 0);
  // 부동소수 오차를 감안한다.
  return Math.abs(sum - 1) < 0.01;
}

function parseLayout(raw: unknown): StoredLayout | null {
  if (typeof raw !== "object" || raw === null) return null;

  const value = raw as Record<string, unknown>;
  if (!isRatioTuple(value.columns, 3)) return null;
  if (!isRatioTuple(value.editorRows, 2)) return null;

  return {
    columns: value.columns as ColumnRatios,
    editorRows: value.editorRows as EditorRowRatios,
  };
}

/** 저장된 레이아웃 비율을 읽는다. 없거나 형태가 어긋나면 null. */
export async function loadLayout(): Promise<StoredLayout | null> {
  return parseLayout(await readJson(STORAGE_KEYS.layout));
}

export async function saveLayout(layout: StoredLayout): Promise<boolean> {
  return writeJson(STORAGE_KEYS.layout, layout);
}
