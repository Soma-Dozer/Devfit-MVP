"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandMark from "./BrandMark";
import { clearSession, type AppUser } from "@/lib/api";

export default function AppNav({ user }: { user: AppUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const links =
    user.role === "INTERVIEWER"
      ? [
          { href: "/dashboard", label: "검증 대시보드" },
          { href: "/candidates", label: "지원자 둘러보기" },
        ]
      : [
          { href: "/profile", label: "내 포트폴리오" },
          { href: "/prep", label: "면접 대비" },
        ];

  const roleLabel = user.role === "INTERVIEWER" ? "면접관" : "지원자";

  function logout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <div className="flex items-center gap-5">
          <Link href={links[0].href} className="flex items-center gap-2.5 font-extrabold">
            <BrandMark /> GitProof
            <span className="ml-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-600">
              {roleLabel}
            </span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-[13.5px] font-semibold transition ${
                  pathname === l.href
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-[13.5px]">
          <span className="text-slate-600">{user.name}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-[13px] font-bold text-indigo-600">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <button
            onClick={logout}
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold text-slate-600 transition hover:border-slate-400"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
