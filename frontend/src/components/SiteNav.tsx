import Link from "next/link";
import BrandMark from "./BrandMark";

export default function SiteNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[18px] tracking-tight">
          <BrandMark /> GitProof
        </Link>
        <nav className="flex items-center gap-7 text-sm text-slate-600">
          <a href="#audience" className="hidden hover:text-slate-900 sm:block">누구를 위한가</a>
          <a href="#how" className="hidden hover:text-slate-900 sm:block">핵심 기능</a>
          <a href="#problem" className="hidden hover:text-slate-900 md:block">왜 필요한가</a>
          <Link href="/login" className="font-semibold text-slate-900 hover:text-indigo-600">
            로그인
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-indigo-500"
          >
            무료로 시작
          </Link>
        </nav>
      </div>
    </header>
  );
}
