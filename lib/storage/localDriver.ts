/**
 * 저장소 저수준 접근 계층.
 *
 * 1단계 저장소는 localStorage지만 향후 IndexedDB, 이후 Supabase로 교체한다.
 * 둘 다 비동기이므로 호출부를 나중에 고치지 않도록 지금부터 Promise를 반환한다.
 *
 * 이 계층은 예외를 밖으로 던지지 않는다. 용량 초과나 사파리 프라이빗 모드처럼
 * 저장이 불가능한 환경에서도 학습은 계속되어야 하므로, 실패는 반환값으로만 알린다.
 */

// 같은 원인의 경고가 매 입력마다 쌓이지 않도록 한 번씩만 남긴다.
const warnedScopes = new Set<string>();

function warnOnce(scope: string, error: unknown) {
  if (warnedScopes.has(scope)) return;
  warnedScopes.add(scope);
  console.warn(
    `[storage] ${scope}에 실패했습니다. 저장 없이 계속 진행합니다.`,
    error,
  );
}

/**
 * localStorage 핸들을 얻는다.
 * 서버 렌더링 중이거나 접근 자체가 차단된 환경에서는 null을 돌려준다.
 */
function getStore(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch (error) {
    // 브라우저 설정에 따라 프로퍼티 접근만으로 예외가 나는 경우가 있다.
    warnOnce("저장소 접근", error);
    return null;
  }
}

/** 저장된 JSON을 읽는다. 없거나 깨져 있으면 null. */
export async function readJson<T>(key: string): Promise<T | null> {
  const store = getStore();
  if (!store) return null;

  try {
    const raw = store.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    warnOnce(`읽기(${key})`, error);
    return null;
  }
}

/** JSON으로 저장한다. 성공 여부를 반환하며 예외는 던지지 않는다. */
export async function writeJson(key: string, value: unknown): Promise<boolean> {
  const store = getStore();
  if (!store) return false;

  try {
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    // 용량 초과(QuotaExceededError), 프라이빗 모드 등.
    warnOnce(`쓰기(${key})`, error);
    return false;
  }
}
