import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import BrandMark from "@/components/BrandMark";

export default function Home() {
  return (
    <div className="flex flex-col">
      <SiteNav />

      {/* HERO */}
      <section className="bg-aurora relative overflow-hidden border-b border-slate-200">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1.5 text-[12.5px] font-semibold text-indigo-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              GitHub 기반 개발자 검증 SaaS
            </span>
            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.1] tracking-tight sm:text-[56px]">
              AI로 짰는가가
              <br />
              아니라, <span className="gradient-text">알고 짰는가.</span>
            </h1>
            <p className="mt-6 max-w-md text-[17px] leading-relaxed text-slate-600">
              GitHub를 분석해 <b className="text-slate-900">지원자</b>에겐 포트폴리오와 면접 대비를,{" "}
              <b className="text-slate-900">면접관</b>에겐 코드 근거 면접 질문을 제공하는 개발자 채용 플랫폼.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
              >
                무료로 시작하기 →
              </Link>
              <a
                href="#how"
                className="rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-slate-400"
              >
                작동 방식 보기
              </a>
            </div>
            <div className="mt-7 flex flex-wrap gap-5 text-[13px] text-slate-500">
              <span className="inline-flex items-center gap-1.5"><Check /> 퍼블릭 레포 기반</span>
              <span className="inline-flex items-center gap-1.5"><Check /> 실제 코드 근거</span>
              <span className="inline-flex items-center gap-1.5"><Check /> 3계층 검증 질문</span>
            </div>
          </div>

          {/* preview card */}
          <div className="rounded-2xl border border-slate-800/10 bg-[#0c1018] p-1 shadow-2xl shadow-slate-900/20">
            <div className="flex h-10 items-center gap-2 rounded-t-xl border-b border-white/10 px-4">
              <Dot c="#ff5f57" /><Dot c="#febc2e" /><Dot c="#28c840" />
              <span className="ml-2 font-mono text-[11.5px] text-slate-500">
                gitproof — analyze
              </span>
            </div>
            <div className="space-y-3 p-4 font-mono text-[12.5px] leading-relaxed text-slate-300">
              <div>
                <span className="text-emerald-400">$</span> gitproof analyze{" "}
                <span className="text-sky-400">github.com/owner/payments-api</span>
              </div>
              <div className="text-slate-500">↳ 커밋 1,284 · PR 96 · Diff 수집 완료</div>
              <div><span className="text-emerald-400">✓</span> 의미 있는 스니펫 <b className="text-emerald-400">3개</b> 추출</div>
              <div><span className="text-emerald-400">✓</span> 검증 질문 <b className="text-emerald-400">9개</b> 생성 <span className="text-slate-500">(3계층)</span></div>

              <div className="overflow-hidden rounded-lg border border-white/10 bg-black/30">
                <div className="border-b border-white/10 px-3 py-1.5 text-[11px] text-slate-500">
                  src/payment/retry.ts
                </div>
                <pre className="px-0 py-1.5 text-[11.5px]">
                  <span className="diff-line diff-del">- await sleep(1000)</span>
                  <span className="diff-line diff-add">+ await backoff(attempt, {"{ jitter: true }"})</span>
                </pre>
              </div>

              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-sans text-[11.5px] font-bold text-amber-400">
                    AI 검증 질문 · Layer 2
                  </span>
                  <span className="rounded-md border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10.5px] font-bold text-amber-400">
                    🔒 지원자 미노출
                  </span>
                </div>
                <p className="font-sans text-[13px] leading-snug text-slate-200">
                  왜 고정 딜레이 대신 <b className="text-white">지수 백오프 + 지터</b>를 택했나요?
                  재시도 폭주(thundering herd)는 어떻게 막았죠?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* strip */}
        <div className="border-t border-slate-200 bg-white/50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6 py-5 text-[13.5px] text-slate-500">
            <s className="text-slate-400">합성 코딩테스트</s>
            <span className="text-slate-300">/</span>
            <s className="text-slate-400">라이브 AI 면접</s>도 아닌
            <span className="text-slate-300">/</span>
            지원자의 <b className="text-slate-800">실제 과거 코드</b> 기반 검증
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section id="audience" className="border-b border-slate-200 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Eyebrow>// FOR BOTH SIDES</Eyebrow>
          <SecHead>지원자에게도, 면접관에게도</SecHead>
          <SecLead>같은 GitHub 분석 엔진이 두 역할에 맞는 결과를 만들어 줍니다.</SecLead>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="inline-flex rounded-lg bg-indigo-50 px-3 py-1 text-[12px] font-bold text-indigo-600">지원자</div>
              <h3 className="mt-3 text-[20px] font-bold tracking-tight">내 코드로 만드는 포트폴리오 + 면접 대비</h3>
              <ul className="mt-4 space-y-2.5 text-[14px] text-slate-600">
                <li className="flex gap-2"><Check /> GitHub 등록 → 기술 스택·대표 프로젝트 자동 포트폴리오</li>
                <li className="flex gap-2"><Check /> 내 코드 기반 <b className="text-slate-800">복습 주제</b> 정리</li>
                <li className="flex gap-2"><Check /> 코드 조각별 <b className="text-slate-800">예상 질문 + 모범답안 가이드</b></li>
              </ul>
              <Link href="/login" className="mt-5 inline-block text-[14px] font-semibold text-indigo-600 hover:underline">지원자로 시작 →</Link>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="inline-flex rounded-lg bg-violet-50 px-3 py-1 text-[12px] font-bold text-violet-600">면접관</div>
              <h3 className="mt-3 text-[20px] font-bold tracking-tight">지원자 코드에서 바로 질문 추천</h3>
              <ul className="mt-4 space-y-2.5 text-[14px] text-slate-600">
                <li className="flex gap-2"><Check /> 레포에서 의미 있는 <b className="text-slate-800">코드 조각</b> 자동 추출</li>
                <li className="flex gap-2"><Check /> 조각별 <b className="text-slate-800">간단 설명 + 핵심 질문</b> 추천</li>
                <li className="flex gap-2"><Check /> 실제 코드 라인에 근거(grounding)해 암기 무력화</li>
              </ul>
              <Link href="/login" className="mt-5 inline-block text-[14px] font-semibold text-indigo-600 hover:underline">면접관으로 시작 →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section id="problem" className="border-b border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>// THE PROBLEM</Eyebrow>
          <SecHead>
            포트폴리오는 더 이상
            <br />
            증거가 아니다.
          </SecHead>
          <SecLead>
            생성형 AI(바이브 코딩)의 확산으로 코드·README·기술 블로그를 누구나 만든다. 면접관 입장에서는{" "}
            <b className="text-slate-800">“사람을 뽑는지, AI가 만든 클론을 뽑는지”</b>가 모호해졌다.
          </SecLead>
          <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-3">
            <Stat n="71%" d={<>채용 리더가 “AI 때문에 기술 역량 평가가 <b>더 어려워졌다</b>”고 응답</>} />
            <Stat n="5배" d={<>기술 면접의 AI 부정행위가 2년간 증가. 한 조사에선 <b>48%</b>에서 발생</>} />
            <Stat n="3배" d={<>뛰어난 엔지니어의 가치(총보상 대비) → <b>잘못 뽑는 비용</b>에 매우 민감</>} />
          </div>
          <div className="mx-auto mt-10 flex w-max max-w-full items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-6 py-3 text-[14.5px]">
            <s className="text-slate-400">누가 짰는가</s>
            <span className="font-bold text-indigo-600">→</span>
            <b className="text-slate-800">알고 짰는가 · 책임질 수 있는가</b>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-b border-slate-200 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <Eyebrow>// HOW IT WORKS</Eyebrow>
          <SecHead>레포 하나로, 면접 질문까지</SecHead>
          <SecLead>
            분석 → 추출 → 매핑 → 질문 생성. 면접관이 코드 베이스를 직접 읽지 않아도 됩니다.
          </SecLead>
          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
            <Feat no="01" icon="◧" title="GitHub Repository 분석"
              body={<>OAuth/주소로 연동해 기술 스택·Commit·PR·Diff 흐름을 한 번에 수집. 핵심 변경만 골라냅니다.</>} />
            <Feat no="02" icon="⌥" title="의미 있는 스니펫 자동 추출"
              body={<>코드 전체가 아닌 핵심만. 트러블슈팅·성능 개선·구조 변경 Diff를 선별. <b>추출 품질이 곧 경쟁력.</b></>} />
            <Feat no="03" icon="⇄" title="이력서 ↔ 실제 코드 매핑"
              body={<>“DB 최적화를 X% 했다”는 주장과 그 근거 코드를 한 화면에서 대조합니다.</>} />
            <Feat no="04" icon="✦" title="이해 깊이 검증 질문 생성" highlight
              body={<>실제 코드·커밋에 <b>근거(grounding)한</b> 면접 질문을 생성. 위조 불가능한 3계층 모델.</>} />
          </div>
        </div>
      </section>

      {/* LAYERS */}
      <section id="layers" className="border-b border-slate-200 bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Eyebrow>// THE MOAT</Eyebrow>
          <SecHead>위조 불가능한 3계층 질문</SecHead>
          <SecLead>“예상 질문을 외워오면?” — 모든 질문이 지원자 본인의 코드 라인에 묶여 있어 암기가 무력화됩니다.</SecLead>
          <div className="grid gap-5 md:grid-cols-3">
            <Layer tag="L1" color="emerald" title="공유 가능" body="주제·개념 질문. 지원자에게 노출돼도 무방한 워밍업." />
            <Layer tag="L2" color="amber" title="면접관 전용" body="트레이드오프·엣지케이스·대안 비교. 외워와도 위조하기 어려운 심화 추궁." locked />
            <Layer tag="L3" color="violet" title="라이브 전용" body="본인 코드를 면접 현장에서 즉석 수정·확장. 사전 텍스트화 불가." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="bg-aurora relative overflow-hidden rounded-3xl border border-indigo-200 bg-white px-8 py-16 text-center shadow-xl shadow-indigo-600/5">
            <h2 className="text-[32px] font-extrabold leading-tight tracking-tight sm:text-[36px]">
              레포 주소 하나면, 5분 안에
              <br />
              물어볼 거리가 생깁니다.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              지원자 GitHub를 붙여 넣고, 검증 리포트와 면접 질문을 받아보세요.
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
              >
                면접관으로 시작하기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-7">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-extrabold">
              <BrandMark size={26} /> GitProof
            </span>
            <small className="text-slate-400">AI 시대 개발자 검증 · 면접 보조</small>
          </div>
          <div className="font-mono text-[11.5px] text-slate-400">
            © 2026 GitProof · AI·SW마에스트로 제17기 프로젝트
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Check() {
  return <span className="font-bold text-emerald-500">✓</span>;
}
function Dot({ c }: { c: string }) {
  return <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3.5 text-center font-mono text-[12.5px] font-semibold tracking-[0.15em] text-indigo-600">
      {children}
    </div>
  );
}
function SecHead({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mx-auto mb-4 max-w-2xl text-center text-[32px] font-extrabold leading-tight tracking-tight sm:text-[38px]">
      {children}
    </h2>
  );
}
function SecLead({ children }: { children: React.ReactNode }) {
  return (
    <p className="mx-auto mb-12 max-w-2xl text-center text-[15.5px] text-slate-600">
      {children}
    </p>
  );
}
function Stat({ n, d }: { n: string; d: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <div className="text-[42px] font-extrabold leading-none tracking-tight gradient-text">
        {n}
      </div>
      <div className="mt-3 text-[13.5px] leading-relaxed text-slate-600 [&_b]:text-slate-800">
        {d}
      </div>
    </div>
  );
}
function Feat({
  no, icon, title, body, highlight,
}: {
  no: string; icon: string; title: string; body: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 transition hover:-translate-y-0.5 ${
        highlight
          ? "border-indigo-200 bg-gradient-to-b from-indigo-50/70 to-white"
          : "border-slate-200 bg-white"
      }`}
    >
      <span className="absolute right-6 top-5 font-mono text-[13px] font-bold text-slate-300">{no}</span>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 text-[18px] text-indigo-600">
        {icon}
      </div>
      <h3 className="mb-2 mt-4 text-[18px] font-bold tracking-tight">{title}</h3>
      <p className="text-[14px] leading-relaxed text-slate-600 [&_b]:text-slate-800">{body}</p>
    </div>
  );
}
function Layer({
  tag, color, title, body, locked,
}: {
  tag: string; color: "emerald" | "amber" | "violet"; title: string; body: string; locked?: boolean;
}) {
  const map = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  } as const;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className={`rounded-md border px-2 py-0.5 font-mono text-[12px] font-bold ${map[color]}`}>
          {tag}
        </span>
        <span className="font-bold">{title}</span>
        {locked && <span className="ml-auto text-[11px] text-amber-600">🔒 지원자 미노출</span>}
      </div>
      <p className="text-[14px] leading-relaxed text-slate-600">{body}</p>
    </div>
  );
}
