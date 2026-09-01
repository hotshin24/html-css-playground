/**
 * 분석 응답 캐시 (서버 전용).
 *
 * 같은 이미지에 같은 프롬프트 판본이면 저장된 응답을 그대로 쓴다.
 * 비용도 비용이지만, 판정 로직을 고칠 때마다 조건이 달라지면 수치 변화가
 * 판정 변경 때문인지 조건 변경 때문인지 구분할 수 없다.
 *
 * 쓰기 가능한 디스크가 있는 배포(가비아 클라우드 등)에서는 그대로 동작해
 * 재분석 시 호출이 발생하지 않는다. 실측으로 확인했다. 읽기 전용 파일시스템
 * (Vercel 등)에서는 쓰기가 조용히 실패하고 매번 새로 부른다. 어느 쪽이든
 * 동작이 깨지지 않도록 읽기와 쓰기 모두 오류를 삼킨다.
 *
 * 인스턴스가 여럿이면 각자 다른 디스크를 보므로 적중률이 고르지 않다.
 * 정확성 문제는 아니다. 같은 키는 같은 응답을 가리킨다.
 */

import "server-only";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const CACHE_DIR = join(process.cwd(), ".analysis-cache");

export function cacheKey(stage: string, promptVersion: string, payload: string): string {
  const digest = createHash("sha256").update(payload).digest("hex").slice(0, 16);
  return `${stage}-${promptVersion}-${digest}`;
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await readFile(join(CACHE_DIR, `${key}.json`), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    // 캐시가 없거나 읽을 수 없으면 그냥 새로 호출한다.
    return null;
  }
}

export async function writeCache(key: string, value: unknown): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(join(CACHE_DIR, `${key}.json`), JSON.stringify(value, null, 2), "utf8");
  } catch (error) {
    console.warn("[ai] 분석 응답 캐시 쓰기에 실패했습니다.", error);
  }
}
