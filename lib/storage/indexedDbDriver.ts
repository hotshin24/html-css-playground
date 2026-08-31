/**
 * IndexedDB 저수준 접근 계층.
 *
 * localStorage 드라이버와 같은 규약을 따른다. 예외를 밖으로 던지지 않고
 * 반환값으로만 실패를 알리며, 같은 원인의 경고는 한 번만 남긴다.
 * 저장에 실패해도 학습은 계속되어야 한다.
 */

const DATABASE_NAME = "hcp";
const DATABASE_VERSION = 1;

/** 등록된 소스와 그 분석 결과·진행 상태. */
export const SOURCE_STORE = "sources";

const warnedScopes = new Set<string>();

function warnOnce(scope: string, error: unknown) {
  if (warnedScopes.has(scope)) return;
  warnedScopes.add(scope);
  console.warn(`[storage] ${scope}에 실패했습니다. 저장 없이 계속 진행합니다.`, error);
}

let databasePromise: Promise<IDBDatabase | null> | null = null;

function openDatabase(): Promise<IDBDatabase | null> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    } catch (error) {
      // 프라이빗 모드 등 접근 자체가 막힌 환경.
      warnOnce("저장소 열기", error);
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SOURCE_STORE)) {
        database.createObjectStore(SOURCE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      warnOnce("저장소 열기", request.error);
      resolve(null);
    };
  });

  return databasePromise;
}

/** 트랜잭션 하나를 열어 요청 하나를 수행한다. */
function runRequest<T>(
  store: string,
  mode: IDBTransactionMode,
  scope: string,
  build: (objectStore: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  return openDatabase().then(
    (database) =>
      new Promise<T | null>((resolve) => {
        if (!database) {
          resolve(null);
          return;
        }

        try {
          const transaction = database.transaction(store, mode);
          const request = build(transaction.objectStore(store));
          request.onsuccess = () => resolve(request.result as T);
          request.onerror = () => {
            warnOnce(scope, request.error);
            resolve(null);
          };
        } catch (error) {
          warnOnce(scope, error);
          resolve(null);
        }
      }),
  );
}

export async function readRecord<T>(store: string, key: string): Promise<T | null> {
  return runRequest<T>(store, "readonly", `읽기(${store})`, (objectStore) =>
    objectStore.get(key),
  );
}

export async function readAllRecords<T>(store: string): Promise<T[]> {
  const records = await runRequest<T[]>(store, "readonly", `목록 읽기(${store})`, (objectStore) =>
    objectStore.getAll(),
  );
  return records ?? [];
}

/** 성공 여부를 반환한다. 용량 초과 등으로 실패해도 예외를 던지지 않는다. */
export async function writeRecord(store: string, value: unknown): Promise<boolean> {
  const result = await runRequest<IDBValidKey>(store, "readwrite", `쓰기(${store})`, (objectStore) =>
    objectStore.put(value),
  );
  return result !== null;
}

export async function deleteRecord(store: string, key: string): Promise<boolean> {
  const database = await openDatabase();
  if (!database) return false;

  return new Promise((resolve) => {
    try {
      const transaction = database.transaction(store, "readwrite");
      const request = transaction.objectStore(store).delete(key);
      // delete는 성공 시 undefined를 돌려주므로 완료 이벤트로 판단한다.
      request.onsuccess = () => resolve(true);
      request.onerror = () => {
        warnOnce(`삭제(${store})`, request.error);
        resolve(false);
      };
    } catch (error) {
      warnOnce(`삭제(${store})`, error);
      resolve(false);
    }
  });
}
