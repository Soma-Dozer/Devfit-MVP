import { Logo } from "./Logo";

/** 푸터 — HP 다크 네이비 슬랩으로 페이지 리듬을 마감. */
export function SiteFooter() {
  return (
    <footer className="slab mt-0">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-14 sm:flex-row sm:items-center sm:justify-between">
        <Logo onDark />
        <p className="text-sm text-white/70">
          코드로 증명하는 개발자 검증 · SW마에스트로 17기
        </p>
      </div>
    </footer>
  );
}
