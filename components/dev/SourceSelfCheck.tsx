"use client";

import { useCallback, useState } from "react";
import type { SectionInput } from "@/lib/judging/combined";
import { judgeSection } from "@/lib/judging/judge";
import { validateAnalysis } from "@/lib/judging/schema";
import { listSources, type StoredSource } from "@/lib/storage/sourceStore";

/**
 * 등록된 소스의 모범 예시가 자기 조건을 통과하는지 확인한다 (PRD 8.3).
 *
 * 더미 시안에서는 고정 픽스처로 확인했지만, 실제 시안은 브라우저에 등록해야만
 * 존재하므로 저장소를 직접 읽는 검사가 따로 필요하다. 타사 시안은 커밋하지
 * 않으므로 픽스처로 옮길 수 없다는 점도 이 화면이 필요한 이유다.
 */

type SectionReport = {
  order: number;
  name: string;
  /** 조건이 없으면 판정할 것도 없다. 구분해서 표시한다. */
  conditionCount: number;
  failed: string[];
  error: string | null;
};

type SourceReport = {
  id: string;
  title: string;
  stage: string;
  schemaIssues: string[];
  sections: SectionReport[];
};

/** 각 구역이 자기 예시를 답안으로 제출한 상태를 만든다. */
function sectionsWithExamplesAsAnswers(source: StoredSource): SectionInput[] {
  return source.sections.map((section) => ({
    id: section.id,
    order: section.order,
    // 결합 문서가 모든 구역의 예시를 담도록 통과 상태로 둔다.
    status: "passed" as const,
    code: section.example,
    example: section.example,
  }));
}

async function checkSource(source: StoredSource): Promise<SourceReport> {
  const validated = validateAnalysis({
    mainTitleSectionId: source.mainTitleSectionId,
    sections: source.sections.map((section) => ({
      id: section.id,
      order: section.order,
      rubric: [...section.required, ...section.recommended],
    })),
  });

  const schemaIssues = validated.ok
    ? []
    : validated.issues
        .filter((issue) => issue.rejected)
        .map((issue) => `${issue.code}: ${issue.message}`);

  const inputs = sectionsWithExamplesAsAnswers(source);
  const sections: SectionReport[] = [];
  // mainTitleSectionId가 없으면 결합 문서 판정 대상이 정해지지 않는다.
  const mainTitleSectionId = source.mainTitleSectionId ?? source.sections[0].id;

  for (const section of source.sections) {
    try {
      const result = await judgeSection({
        sections: inputs,
        currentSectionId: section.id,
        mainTitleSectionId,
        required: section.required,
        recommended: section.recommended,
      });
      sections.push({
        order: section.order,
        name: section.name,
        conditionCount: result.outcomes.length,
        failed: result.outcomes
          .filter((outcome) => !outcome.passed)
          .map((outcome) => `${outcome.type}(기대 ${outcome.expected} / 실제 ${outcome.actual})`),
        error: null,
      });
    } catch (error) {
      sections.push({
        order: section.order,
        name: section.name,
        conditionCount: 0,
        failed: [],
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    id: source.id,
    title: source.title,
    stage: source.stage,
    schemaIssues,
    sections,
  };
}

export default function SourceSelfCheck() {
  const [reports, setReports] = useState<SourceReport[] | null>(null);
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true);
    const sources = await listSources();
    const ready = sources.filter((source) => source.stage === "ready");
    const next: SourceReport[] = [];
    for (const source of ready) {
      next.push(await checkSource(source));
    }
    setReports(next);
    setRunning(false);
  }, []);

  return (
    <section className="mt-8">
      <h2 className="text-base font-medium">저장된 소스 자체 검사</h2>
      <p className="mt-1 text-sm text-chrome-muted">
        조건 생성까지 끝난 소스마다, 각 구역의 모범 예시를 그 구역의 답안으로 제출해 판정합니다.
        예시가 자기 조건을 통과하지 못하면 조건과 예시 중 하나가 틀린 것입니다.
      </p>
      <button
        type="button"
        onClick={run}
        disabled={running}
        className="mt-2 rounded border border-chrome-line px-3 py-1 text-sm disabled:opacity-50"
      >
        {running ? "판정 중…" : "실행"}
      </button>

      {reports !== null && reports.length === 0 ? (
        <p className="mt-2 text-sm text-chrome-muted">조건 생성까지 끝난 소스가 없습니다.</p>
      ) : null}

      {reports?.map((report) => {
        const failedCount = report.sections.filter(
          (section) => section.failed.length > 0 || section.error !== null,
        ).length;
        return (
          <div key={report.id} className="mt-3 rounded border border-chrome-line p-3">
            <p className="text-sm font-medium">
              {report.title} — 구역 {report.sections.length}개 중 {failedCount}개 불합격
            </p>
            {report.schemaIssues.length > 0 ? (
              <pre className="mt-1 text-xs text-chrome-danger">{report.schemaIssues.join("\n")}</pre>
            ) : null}
            <table className="mt-2 w-full text-xs">
              <tbody>
                {report.sections.map((section) => (
                  <tr key={section.order} className="border-t border-chrome-line">
                    <td className="w-8 py-1 align-top">{section.order}</td>
                    <td className="py-1 align-top">{section.name}</td>
                    <td className="w-12 py-1 text-right align-top">{section.conditionCount}개</td>
                    <td className="py-1 pl-3 align-top">
                      {section.error !== null ? (
                        <span className="text-chrome-danger">오류: {section.error}</span>
                      ) : section.failed.length === 0 ? (
                        <span className="text-chrome-muted">통과</span>
                      ) : (
                        <span className="text-chrome-danger">{section.failed.join(", ")}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </section>
  );
}
