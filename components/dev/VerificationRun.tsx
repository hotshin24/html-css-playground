"use client";

import { useEffect, useState } from "react";
import { FORM_ANALYSIS, FORM_SOLUTION, SAMPLE_ANALYSIS } from "@/fixtures/rubric";
import { SOLUTIONS } from "@/fixtures/solutions";
import { FORM_VIOLATION, VIOLATIONS } from "@/fixtures/violations";
import type { SectionInput } from "@/lib/judging/combined";
import { judgeSection, type JudgeResult } from "@/lib/judging/judge";
import { validateAnalysis } from "@/lib/judging/schema";

type Row = {
  kind: "정답" | "위반";
  id: string;
  note: string;
  ok: boolean;
  detail: string;
};

type Report = {
  schemaIssues: string[];
  rows: Row[];
  falsePositives: number;
  falseNegatives: number;
  solutionCount: number;
  violationCount: number;
};

function singleSection(id: string, html: string, css: string): SectionInput[] {
  return [
    {
      id,
      order: 1,
      status: "in_progress",
      code: { html, css },
      example: { html: "", css: "" },
    },
  ];
}

function failedIds(result: JudgeResult): string[] {
  return result.outcomes.filter((outcome) => !outcome.passed).map((outcome) => outcome.id);
}

async function run(): Promise<Report> {
  const rows: Row[] = [];
  const schemaIssues: string[] = [];

  const validated = validateAnalysis(SAMPLE_ANALYSIS);
  if (!validated.ok) {
    return {
      schemaIssues: validated.issues.map((issue) => `${issue.code}: ${issue.message}`),
      rows,
      falsePositives: 0,
      falseNegatives: 0,
      solutionCount: 0,
      violationCount: 0,
    };
  }
  for (const issue of validated.issues) {
    schemaIssues.push(`${issue.code}: ${issue.message}`);
  }

  const section = validated.sections[0];
  const judgeWith = (html: string, css: string) =>
    judgeSection({
      sections: singleSection(section.id, html, css),
      currentSectionId: section.id,
      mainTitleSectionId: validated.mainTitleSectionId,
      required: section.required,
      recommended: section.recommended,
    });

  // 오탐 — 정답 코드가 실패하면 안 된다.
  let falsePositives = 0;
  for (const solution of SOLUTIONS) {
    const result = await judgeWith(solution.html, solution.css);
    const failures = failedIds(result);
    if (failures.length > 0) falsePositives += 1;
    rows.push({
      kind: "정답",
      id: solution.id,
      note: solution.approach,
      ok: result.passed,
      detail: result.passed ? "통과" : `실패한 조건: ${failures.join(", ")}`,
    });
  }

  const formValidated = validateAnalysis(FORM_ANALYSIS);
  if (formValidated.ok) {
    const formSection = formValidated.sections[0];
    const formResult = await judgeSection({
      sections: singleSection(formSection.id, FORM_SOLUTION.html, FORM_SOLUTION.css),
      currentSectionId: formSection.id,
      mainTitleSectionId: formValidated.mainTitleSectionId,
      required: formSection.required,
      recommended: formSection.recommended,
    });
    const failures = failedIds(formResult);
    if (failures.length > 0) falsePositives += 1;
    rows.push({
      kind: "정답",
      id: "폼",
      note: "레이블을 연결한 검색 폼",
      ok: formResult.passed,
      detail: formResult.passed ? "통과" : `실패한 조건: ${failures.join(", ")}`,
    });

    // 미탐 — 레이블 없는 입력창
    const formViolationResult = await judgeSection({
      sections: singleSection(formSection.id, FORM_VIOLATION.html, FORM_VIOLATION.css),
      currentSectionId: formSection.id,
      mainTitleSectionId: formValidated.mainTitleSectionId,
      required: formSection.required,
      recommended: formSection.recommended,
    });
    const formViolationFailures = failedIds(formViolationResult);
    const caught = FORM_VIOLATION.expectedFailures.every((id) =>
      formViolationFailures.includes(id),
    );
    rows.push({
      kind: "위반",
      id: "폼",
      note: FORM_VIOLATION.intent,
      ok: caught,
      detail: caught
        ? `잡힘: ${formViolationFailures.join(", ")}`
        : `놓침 — 실패한 조건: ${formViolationFailures.join(", ") || "없음"}`,
    });
  }

  // 미탐 — 위반 코드는 반드시 잡혀야 한다.
  let falseNegatives = 0;
  for (const violation of VIOLATIONS) {
    const result = await judgeWith(violation.html, violation.css);
    const failures = failedIds(result);
    const caught = violation.expectedFailures.every((id) => failures.includes(id));
    if (!caught) falseNegatives += 1;

    const extra = failures.filter((id) => !violation.expectedFailures.includes(id));
    rows.push({
      kind: "위반",
      id: violation.id,
      note: violation.intent,
      ok: caught,
      detail: caught
        ? `잡힘: ${violation.expectedFailures.join(", ")}${extra.length > 0 ? ` (부가 실패: ${extra.join(", ")})` : ""}`
        : `놓침 — 실패한 조건: ${failures.join(", ") || "없음"}`,
    });
  }

  return {
    schemaIssues,
    rows,
    falsePositives,
    falseNegatives,
    solutionCount: rows.filter((row) => row.kind === "정답").length,
    violationCount: rows.filter((row) => row.kind === "위반").length,
  };
}

export default function VerificationRun() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    run()
      .then((next) => {
        if (!cancelled) setReport(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : String(caught));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="mt-3 text-sm text-chrome-danger">실행 실패: {error}</p>;
  if (!report) return <p className="mt-3 text-sm text-chrome-muted">검증 실행 중…</p>;

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">PRD 8.2 판정 정확도 검증</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        오탐 {report.falsePositives}/{report.solutionCount} · 미탐 {report.falseNegatives}/
        {report.violationCount}
      </p>

      {report.schemaIssues.length > 0 && (
        <p className="mt-2 text-xs text-chrome-warning">
          스키마 경고: {report.schemaIssues.join(" / ")}
        </p>
      )}

      <table className="mt-3 w-full text-left text-sm">
        <thead>
          <tr className="text-xs text-chrome-muted">
            <th className="py-1 pr-3 font-medium">구분</th>
            <th className="py-1 pr-3 font-medium">코드</th>
            <th className="py-1 pr-3 font-medium">내용</th>
            <th className="py-1 font-medium">결과</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((row) => (
            <tr key={`${row.kind}-${row.id}`} className="border-t border-chrome-border align-top">
              <td className="py-1.5 pr-3 text-chrome-muted">{row.kind}</td>
              <td className="py-1.5 pr-3">{row.id}</td>
              <td className="py-1.5 pr-3 text-chrome-muted">{row.note}</td>
              <td className={`py-1.5 ${row.ok ? "text-chrome-success" : "text-chrome-danger"}`}>
                {row.detail}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
