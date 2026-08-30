import { DEFAULT_EDITOR_SETTINGS, STORAGE_KEYS, type EditorSettings } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/storage/localDriver";

/**
 * 저장된 값의 형태를 확인한다.
 * 이전 버전이 남긴 값이나 손상된 값이 그대로 상태에 들어가지 않도록 막는다.
 */
function parseEditorSettings(raw: unknown): EditorSettings | null {
  if (typeof raw !== "object" || raw === null) return null;

  const value = raw as Record<string, unknown>;
  if (typeof value.nameSuggestions !== "boolean") return null;
  if (typeof value.lineWrap !== "boolean") return null;

  return {
    nameSuggestions: value.nameSuggestions,
    lineWrap: value.lineWrap,
  };
}

/** 저장된 설정을 읽는다. 없거나 형태가 어긋나면 기본값. */
export async function loadEditorSettings(): Promise<EditorSettings> {
  const stored = parseEditorSettings(await readJson(STORAGE_KEYS.editorSettings));
  return stored ?? DEFAULT_EDITOR_SETTINGS;
}

export async function saveEditorSettings(settings: EditorSettings): Promise<boolean> {
  return writeJson(STORAGE_KEYS.editorSettings, settings);
}
