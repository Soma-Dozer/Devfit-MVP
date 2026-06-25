/** B2C(취준생) 푸터 — Airbnb 톤(따뜻한 옅은 표면). */
export function B2CFooter() {
  return (
    <footer className="border-t border-warmline-soft bg-warmsoft">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-12 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-base font-bold text-warmink">
devel<span className="text-rausch">fit</span>
        </span>
        <p className="text-sm text-warmmuted">
          내 코드로 준비하는 기술 면접 · SW마에스트로 17기
        </p>
      </div>
    </footer>
  );
}
