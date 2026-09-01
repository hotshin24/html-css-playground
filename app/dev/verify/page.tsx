import Link from "next/link";
import AiVerificationRun from "@/components/dev/AiVerificationRun";
import CheckCases from "@/components/dev/CheckCases";
import CombinedCases from "@/components/dev/CombinedCases";
import FeedbackCases from "@/components/dev/FeedbackCases";
import FrameCases from "@/components/dev/FrameCases";
import ImagePathCases from "@/components/dev/ImagePathCases";
import OutcomeCases from "@/components/dev/OutcomeCases";
import SchemaCases from "@/components/dev/SchemaCases";
import SolutionPreviews from "@/components/dev/SolutionPreviews";
import SourceSelfCheck from "@/components/dev/SourceSelfCheck";
import VerificationRun from "@/components/dev/VerificationRun";
import { buildPromptConditionTypeTable } from "@/lib/judging/conditionTypes";

/**
 * 판정 엔진 검증 화면 (개발용).
 *
 * PRD 8.2 검증에는 실제 렌더 측정이 필요하다. jsdom 계열 테스트 러너는
 * getBoundingClientRect가 0을 반환해 `layout-result`를 검증할 수 없으므로
 * (F-05-04에서 확인된 것과 같은 실패), 브라우저에서 도는 화면을 검증
 * 도구로 삼는다. 단계가 진행되며 이 화면에 검사 항목을 붙여 나간다.
 */
export default function VerifyPage() {
  return (
    <main className="mx-auto max-w-6xl overflow-y-auto p-8">
      <Link href="/" className="text-sm text-chrome-muted hover:text-chrome-text">
        ← 목록으로
      </Link>
      <h1 className="mt-2 text-xl font-semibold">판정 엔진 검증</h1>
      <SchemaCases />
      <FrameCases />
      <CheckCases />
      <CombinedCases />
      <FeedbackCases />
      <OutcomeCases />
      <VerificationRun />
      <AiVerificationRun />
      <SolutionPreviews />
      <SourceSelfCheck />
      <ImagePathCases />

      <section className="mt-8">
        <h2 className="text-base font-medium">프롬프트 주입 텍스트</h2>
        <p className="mt-1 text-sm text-chrome-muted">
          스키마 검증 열거형과 같은 상수에서 파생됩니다 (F-02-15). 엔진 상시 유형과 보류 유형은
          제외되어 AI가 생성 대상으로 보지 않습니다.
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-chrome-panel p-3 text-xs">
          {buildPromptConditionTypeTable()}
        </pre>
      </section>
    </main>
  );
}
