/**
 * 확인 한 번의 결과가 구역 상태와 화면 표시를 어떻게 바꾸는지 (F-08-02, F-07-02).
 *
 * `submit` 안에 두면 화면 없이는 확인할 수 없어, 예시 공개 같은 조건이 조용히
 * 어긋나도 드러나지 않는다. 순수 함수로 떼어 표로 검증한다.
 */

import type { SectionStatus } from "@/lib/judging/combined";
import type { SectionResult } from "@/lib/storage/sourceStore";

export type OutcomeInput = {
  /** 확인 직전의 구역 상태. */
  status: SectionStatus;
  attemptsUsed: number;
  maxAttempts: number;
  /** 이번 판정이 모든 필수 조건을 만족했는지. */
  passed: boolean;
};

export type Outcome = {
  /** 이미 끝난 구역을 다시 본 것인지. 시도를 차감하지 않는다 (F-08-11). */
  isRecheck: boolean;
  /** 저장할 시도 횟수. 재확인이면 그대로 둔다. */
  attempt: number;
  /** 판정이 낸 결과. 구역 상태와 별개다 (6.4). */
  phase: SectionResult["phase"];
  /** 저장할 구역 상태. 재확인이면 되돌리지 않는다 (F-08-06). */
  nextStatus: SectionStatus;
  /** 남은 시도. 재확인이거나 실패가 아니면 null. */
  attemptsLeft: number | null;
  /** 다음 잠긴 구역을 열어야 하는지 (F-08-02). */
  opensNext: boolean;
};

export function resolveOutcome({
  status,
  attemptsUsed,
  maxAttempts,
  passed,
}: OutcomeInput): Outcome {
  const isRecheck = status === "passed" || status === "revealed";
  const attempt = isRecheck ? attemptsUsed : attemptsUsed + 1;

  /** 이번 확인으로 시도를 다 쓴 경우. */
  const exhausted = !isRecheck && !passed && attempt >= maxAttempts;

  /**
   * 이미 예시가 공개된 구역을 다시 확인해 여전히 실패한 경우.
   *
   * 이 갈래가 없으면 재확인 순간 결과가 `failed`로 떨어져 공개된 예시가
   * 화면에서 사라진다. 소진은 이미 일어난 사실이라 되돌아가지 않는다.
   * 판단 기준은 시도 횟수가 아니라 구역 상태여야 한다. 마지막 회차에 통과한
   * 구역은 시도 수가 상한과 같아도 예시를 받은 적이 없기 때문이다.
   */
  const stillRevealed = isRecheck && status === "revealed" && !passed;

  return {
    isRecheck,
    attempt,
    phase: passed ? "passed" : exhausted || stillRevealed ? "revealed" : "failed",
    nextStatus: isRecheck
      ? status
      : passed
        ? "passed"
        : exhausted
          ? "revealed"
          : "in_progress",
    attemptsLeft: !isRecheck && !passed && !exhausted ? maxAttempts - attempt : null,
    opensNext: !isRecheck && (passed || exhausted),
  };
}
