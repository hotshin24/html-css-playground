"use client";

import { useEffect, useState } from "react";
import { AI_RUNS, type AiRun } from "@/fixtures/aiRuns";
import { AI_RUNS_IMPROVED } from "@/fixtures/aiRunsImproved";
import { SOLUTIONS } from "@/fixtures/solutions";
import { VIOLATIONS } from "@/fixtures/violations";
import type { SectionInput } from "@/lib/judging/combined";
import { judgeSection, type JudgeResult } from "@/lib/judging/judge";
import { validateAnalysis } from "@/lib/judging/schema";

const SECTION_ID = "sec-01";

type RunReport = {
  id: string;
  /** 정규화한 (type, 파라미터) 집합. 회차 비교에 쓴다. */
  signature: string[];
  schemaIssues: string[];
  /** 시안만 보고 작성한 정답 코드의 판정. */
  solutionVerdicts: { id: string; passed: boolean; failed: string[] }[];
  /** 이 회차가 만든 모범 예시의 판정. */
  exampleVerdict: { passed: boolean; failed: string[] };
  violationVerdicts: { id: string; caught: boolean; failed: string[] }[];
};

function singleSection(html: string, css: string): SectionInput[] {
  return [
    {
      id: SECTION_ID,
      order: 1,
      status: "in_progress",
      code: { html, css },
      example: { html: "", css: "" },
    },
  ];
}

function failedTypes(result: JudgeResult): string[] {
  return result.outcomes.filter((outcome) => !outcome.passed).map((outcome) => outcome.type);
}

async function runOne(run: AiRun): Promise<RunReport | null> {
  const validated = validateAnalysis({
    mainTitleSectionId: SECTION_ID,
    sections: [{ id: SECTION_ID, order: 1, rubric: run.rubric }],
  });

  if (!validated.ok) {
    return {
      id: run.id,
      signature: [],
      schemaIssues: validated.issues.map((issue) => `${issue.code}: ${issue.message}`),
      solutionVerdicts: [],
      exampleVerdict: { passed: false, failed: [] },
      violationVerdicts: [],
    };
  }

  const section = validated.sections[0];
  const signature = section.required
    .map((condition) => `${condition.type} ${JSON.stringify(condition.accept)}`)
    .sort();

  const judge = (html: string, css: string) =>
    judgeSection({
      sections: singleSection(html, css),
      currentSectionId: SECTION_ID,
      mainTitleSectionId: SECTION_ID,
      required: section.required,
      recommended: section.recommended,
    });

  const solutionVerdicts = [];
  for (const solution of SOLUTIONS) {
    const result = await judge(solution.html, solution.css);
    solutionVerdicts.push({
      id: solution.id,
      passed: result.passed,
      failed: failedTypes(result),
    });
  }

  const exampleResult = await judge(run.example.html, run.example.css);

  const violationVerdicts = [];
  for (const violation of VIOLATIONS) {
    const result = await judge(violation.html, violation.css);
    const failed = failedTypes(result);
    violationVerdicts.push({
      id: violation.id,
      caught: violation.expectedTypes.every((type) => failed.includes(type)),
      failed,
    });
  }

  return {
    id: run.id,
    signature,
    schemaIssues: validated.issues.map((issue) => `${issue.code}: ${issue.message}`),
    solutionVerdicts,
    exampleVerdict: { passed: exampleResult.passed, failed: failedTypes(exampleResult) },
    violationVerdicts,
  };
}

function Report({
  title,
  note,
  runs,
}: {
  title: string;
  note: string;
  runs: AiRun[];
}) {
  const [reports, setReports] = useState<RunReport[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const collected: RunReport[] = [];
      for (const run of runs) {
        const report = await runOne(run);
        if (report) collected.push(report);
      }
      if (!cancelled) setReports(collected);
    })();
    return () => {
      cancelled = true;
    };
  }, [runs]);

  if (!reports) {
    return (
      <section className="mt-8">
        <h2 className="text-base font-medium">{title}</h2>
        <p className="mt-1 text-sm text-chrome-muted">판정 중…</p>
      </section>
    );
  }

  const signatures = reports.map((report) => report.signature.join(" | "));
  const identical = signatures.every((entry) => entry === signatures[0]);

  const falsePositives = reports.reduce(
    (total, report) => total + report.solutionVerdicts.filter((entry) => !entry.passed).length,
    0,
  );
  const solutionCount = reports.reduce((total, report) => total + report.solutionVerdicts.length, 0);
  const falseNegatives = reports.reduce(
    (total, report) => total + report.violationVerdicts.filter((entry) => !entry.caught).length,
    0,
  );
  const violationCount = reports.reduce(
    (total, report) => total + report.violationVerdicts.length,
    0,
  );
  const examplePassed = reports.filter((report) => report.exampleVerdict.passed).length;

  /** 같은 정답 코드가 회차에 따라 판정이 갈리는지 (재현성 문제의 실질적 영향). */
  const flipped = SOLUTIONS.filter((solution) => {
    const verdicts = reports.map(
      (report) => report.solutionVerdicts.find((entry) => entry.id === solution.id)?.passed,
    );
    return new Set(verdicts).size > 1;
  }).map((solution) => solution.id);

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-1 text-sm text-chrome-muted">{note}</p>

      <ul className="mt-3 space-y-1 text-sm">
        <li>
          오탐 {falsePositives}/{solutionCount} (시안만 보고 작성한 정답 코드)
        </li>
        <li>
          예시 자기 조건 충족 {examplePassed}/{reports.length} (조건을 보고 만든 코드이므로 별도 집계)
        </li>
        <li>
          미탐 {falseNegatives}/{violationCount}
        </li>
        <li className={identical ? "" : "text-chrome-warning"}>
          회차 간 (type, 파라미터) 집합 {identical ? "일치" : "불일치"}
        </li>
        <li className={flipped.length > 0 ? "text-chrome-danger" : ""}>
          회차에 따라 판정이 갈린 정답 코드: {flipped.length > 0 ? flipped.join(", ") : "없음"}
        </li>
      </ul>

      <table className="mt-4 w-full text-left text-xs">
        <thead>
          <tr className="text-chrome-muted">
            <th className="py-1 pr-3 font-medium">회차</th>
            <th className="py-1 pr-3 font-medium">조건 (type · accept)</th>
            <th className="py-1 pr-3 font-medium">정답 4벌</th>
            <th className="py-1 pr-3 font-medium">예시</th>
            <th className="py-1 font-medium">위반 8건</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id} className="border-t border-chrome-border align-top">
              <td className="py-1.5 pr-3">{report.id}</td>
              <td className="py-1.5 pr-3">
                {report.signature.map((entry) => (
                  <span key={entry} className="block">
                    {entry}
                  </span>
                ))}
              </td>
              <td className="py-1.5 pr-3">
                {report.solutionVerdicts.map((entry) => (
                  <span
                    key={entry.id}
                    className={`block ${entry.passed ? "text-chrome-success" : "text-chrome-danger"}`}
                  >
                    {entry.id} {entry.passed ? "통과" : `실패(${entry.failed.join(", ")})`}
                  </span>
                ))}
              </td>
              <td
                className={`py-1.5 pr-3 ${
                  report.exampleVerdict.passed ? "text-chrome-success" : "text-chrome-danger"
                }`}
              >
                {report.exampleVerdict.passed
                  ? "통과"
                  : `실패(${report.exampleVerdict.failed.join(", ")})`}
              </td>
              <td className="py-1.5">
                {report.violationVerdicts.map((entry) => (
                  <span
                    key={entry.id}
                    className={`block ${entry.caught ? "text-chrome-success" : "text-chrome-danger"}`}
                  >
                    {entry.id} {entry.caught ? "잡힘" : "놓침"}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default function AiVerificationRun() {
  return (
    <>
      <Report
        title="AI 조건으로 재측정 — 개선 전 (PRD 8.2)"
        note="layout-result 대상 단위 지시를 넣기 전. 정답 4벌 · 예시 1벌 · 위반 8건을 회차마다 판정합니다."
        runs={AI_RUNS}
      />
      <Report
        title="AI 조건으로 재측정 — 개선 후"
        note="반복 항목이 있으면 그 항목을 layout-result 대상으로 삼도록 지시를 추가한 뒤."
        runs={AI_RUNS_IMPROVED}
      />
    </>
  );
}
