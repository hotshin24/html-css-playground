import Link from "next/link";
import SourceForm from "@/components/sources/SourceForm";

export default function NewSourcePage() {
  return (
    <main className="mx-auto w-full max-w-2xl overflow-y-auto p-8">
      <Link href="/" className="text-sm text-chrome-muted hover:text-chrome-text">
        ← 목록으로
      </Link>
      <h1 className="mt-4 text-xl font-semibold">시안 등록</h1>
      <p className="mt-1 text-sm text-chrome-muted">
        등록하면 AI가 시안의 구조를 분석합니다. 분석은 한 번만 수행하고 결과를 저장합니다.
      </p>

      <div className="mt-8">
        <SourceForm />
      </div>
    </main>
  );
}
