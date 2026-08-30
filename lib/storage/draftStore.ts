import { STORAGE_KEYS } from "@/lib/constants";
import { readJson, writeJson } from "@/lib/storage/localDriver";

/** 사용자가 작성 중인 코드. */
export type CodeDraft = {
  html: string;
  css: string;
};

/** 구역마다 따로 보관한다. */
function draftKey(sectionId: string): string {
  return `${STORAGE_KEYS.draft}:${sectionId}`;
}

function parseDraft(raw: unknown): CodeDraft | null {
  if (typeof raw !== "object" || raw === null) return null;

  const value = raw as Record<string, unknown>;
  if (typeof value.html !== "string") return null;
  if (typeof value.css !== "string") return null;

  return { html: value.html, css: value.css };
}

/** 저장된 작성 코드를 읽는다. 없거나 형태가 어긋나면 null. */
export async function loadDraft(sectionId: string): Promise<CodeDraft | null> {
  return parseDraft(await readJson(draftKey(sectionId)));
}

export async function saveDraft(sectionId: string, draft: CodeDraft): Promise<boolean> {
  return writeJson(draftKey(sectionId), draft);
}
