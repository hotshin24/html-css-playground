import Link from "next/link";
import SourceList from "@/components/sources/SourceList";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl overflow-y-auto p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">등록한 시안</h1>
          <p className="mt-1 text-sm text-chrome-muted">
            시안을 보고 HTML/CSS를 직접 작성하며 시맨틱 마크업과 레이아웃을 연습합니다.
          </p>
        </div>
        <Link
          href="/sources/new"
          className="shrink-0 rounded-md bg-chrome-accent px-4 py-2 text-sm font-medium text-chrome-on-accent"
        >
          시안 등록
        </Link>
      </div>

      <SourceList />
    </main>
  );
}
