import Link from "next/link";

export function FinalCta() {
  return (
    <section id="cta" className="slab border-t border-hairline">
      <div className="mx-auto max-w-6xl px-5 py-24 text-center">
        <h2 className="animate-fade-up mx-auto max-w-3xl text-[clamp(28px,4vw,40px)] font-bold leading-tight tracking-tight text-white">
          지원자의 코드가, 스스로를 증명하게 하세요.
        </h2>
        <div className="mt-8 flex justify-center">
          <Link href="/dashboard" className="btn-primary">
            면접 콘솔 시작
          </Link>
        </div>
        <p className="mt-5 text-xs text-white/70">공개 레포 기반 분석.</p>
      </div>
    </section>
  );
}
