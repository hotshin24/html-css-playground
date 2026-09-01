"use client";

import { resolveOutcome, type OutcomeInput } from "@/lib/learning/outcome";

/**
 * 확인 결과가 구역 상태와 화면 표시를 어떻게 바꾸는지 (F-07-02, F-08-02, F-08-11).
 *
 * 예시 공개는 화면을 끝까지 몰아 봐야 드러나므로 회귀를 놓치기 쉽다. 실제로
 * 재확인 갈래를 넣으면서 소진 판정이 어긋나 공개된 예시가 사라진 적이 있다.
 * 전이표를 고정해 둔다.
 */

type Case = OutcomeInput & {
  이름: string;
  기대: {
    phase: string;
    nextStatus: string;
    attempt: number;
    attemptsLeft: number | null;
    opensNext: boolean;
  };
};

const MAX = 3;

const CASES: Case[] = [
  {
    이름: "1회차 실패",
    status: "in_progress",
    attemptsUsed: 0,
    maxAttempts: MAX,
    passed: false,
    기대: { phase: "failed", nextStatus: "in_progress", attempt: 1, attemptsLeft: 2, opensNext: false },
  },
  {
    이름: "2회차 실패",
    status: "in_progress",
    attemptsUsed: 1,
    maxAttempts: MAX,
    passed: false,
    기대: { phase: "failed", nextStatus: "in_progress", attempt: 2, attemptsLeft: 1, opensNext: false },
  },
  {
    이름: "3회차 실패 — 예시 공개",
    status: "in_progress",
    attemptsUsed: 2,
    maxAttempts: MAX,
    passed: false,
    기대: { phase: "revealed", nextStatus: "revealed", attempt: 3, attemptsLeft: null, opensNext: true },
  },
  {
    이름: "1회차 통과",
    status: "in_progress",
    attemptsUsed: 0,
    maxAttempts: MAX,
    passed: true,
    기대: { phase: "passed", nextStatus: "passed", attempt: 1, attemptsLeft: null, opensNext: true },
  },
  {
    이름: "마지막 회차에 통과 — 예시 없음",
    status: "in_progress",
    attemptsUsed: 2,
    maxAttempts: MAX,
    passed: true,
    기대: { phase: "passed", nextStatus: "passed", attempt: 3, attemptsLeft: null, opensNext: true },
  },
  {
    이름: "공개된 구역 재확인 · 여전히 실패 — 예시 유지",
    status: "revealed",
    attemptsUsed: 3,
    maxAttempts: MAX,
    passed: false,
    기대: { phase: "revealed", nextStatus: "revealed", attempt: 3, attemptsLeft: null, opensNext: false },
  },
  {
    이름: "공개된 구역 재확인 · 고쳐서 통과 — 상태 유지",
    status: "revealed",
    attemptsUsed: 3,
    maxAttempts: MAX,
    passed: true,
    기대: { phase: "passed", nextStatus: "revealed", attempt: 3, attemptsLeft: null, opensNext: false },
  },
  {
    이름: "통과 구역 재확인 · 여전히 통과",
    status: "passed",
    attemptsUsed: 1,
    maxAttempts: MAX,
    passed: true,
    기대: { phase: "passed", nextStatus: "passed", attempt: 1, attemptsLeft: null, opensNext: false },
  },
  {
    이름: "통과 구역 재확인 · 코드가 깨짐 — 예시 아님, 상태 유지",
    status: "passed",
    attemptsUsed: 1,
    maxAttempts: MAX,
    passed: false,
    기대: { phase: "failed", nextStatus: "passed", attempt: 1, attemptsLeft: null, opensNext: false },
  },
  {
    이름: "마지막 회차에 통과한 구역 재확인 · 깨짐 — 예시 아님",
    status: "passed",
    attemptsUsed: 3,
    maxAttempts: MAX,
    passed: false,
    기대: { phase: "failed", nextStatus: "passed", attempt: 3, attemptsLeft: null, opensNext: false },
  },
  {
    이름: "시도 1회 설정 · 첫 실패에 바로 공개",
    status: "in_progress",
    attemptsUsed: 0,
    maxAttempts: 1,
    passed: false,
    기대: { phase: "revealed", nextStatus: "revealed", attempt: 1, attemptsLeft: null, opensNext: true },
  },
];

export default function OutcomeCases() {
  const rows = CASES.map((item) => {
    const actual = resolveOutcome(item);
    const ok =
      actual.phase === item.기대.phase &&
      actual.nextStatus === item.기대.nextStatus &&
      actual.attempt === item.기대.attempt &&
      actual.attemptsLeft === item.기대.attemptsLeft &&
      actual.opensNext === item.기대.opensNext;
    return { item, actual, ok };
  });
  const passed = rows.filter((row) => row.ok).length;

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">확인 결과 전이</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        {CASES.length}건 중 {passed}건 통과
      </p>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="text-left text-chrome-muted">
            <th className="py-1 font-medium">경우</th>
            <th className="py-1 font-medium">결과</th>
            <th className="py-1 font-medium">상태</th>
            <th className="py-1 font-medium">시도</th>
            <th className="py-1 font-medium">남은</th>
            <th className="py-1 font-medium">다음 개방</th>
            <th className="py-1 font-medium">판정</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ item, actual, ok }) => (
            <tr key={item.이름} className="border-t border-chrome-border align-top">
              <td className="py-1 pr-3">{item.이름}</td>
              <td className="py-1 pr-3">{actual.phase}</td>
              <td className="py-1 pr-3">{actual.nextStatus}</td>
              <td className="py-1 pr-3">{actual.attempt}</td>
              <td className="py-1 pr-3">{actual.attemptsLeft ?? "—"}</td>
              <td className="py-1 pr-3">{actual.opensNext ? "예" : "아니오"}</td>
              <td className="py-1">
                <span className={ok ? "text-chrome-success" : "text-chrome-danger"}>
                  {ok ? "통과" : `기대 ${JSON.stringify(item.기대)}`}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
