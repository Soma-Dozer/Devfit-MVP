import Link from "next/link";
import { B2CHeader } from "@/components/b2c/B2CHeader";
import { B2CFooter } from "@/components/b2c/B2CFooter";

/**
 * B2C(취준생) 랜딩 — Airbnb 톤(따뜻한 소비자 마켓플레이스, 흰 캔버스, rausch 포인트).
 * 서버 컴포넌트. 데이터 fetch 없음(정적 마케팅 페이지). CTA → /b2c/app.
 */

const VALUES: { title: string; body: string; icon: React.ReactNode }[] = [
  {
    title: "내 GitHub 빈출 영역",
    body: "내 커밋과 코드에서 면접관이 자주 캐묻는 영역을 빈도순으로 정리해 드려요. 막연한 준비 대신, 진짜 물어볼 곳부터.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <rect x="7" y="11" width="3" height="7" rx="1" />
        <rect x="13" y="6" width="3" height="12" rx="1" />
      </svg>
    ),
  },
  {
    title: "스스로 답해보는 self-check",
    body: "정답집을 외우는 대신, 내 코드 영역을 두고 스스로 답해보는 프롬프트로 준비해요. 외운 사람과 해본 사람은 면접에서 갈립니다.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.9.4-1.5 1.1-1.5 2.2" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: "실제 면접 데이터 기반",
    body: "면접관이 실제로 캐묻는 패턴이 쌓일수록 빈출도는 더 정확해져요(federated calibration). 추측이 아니라 데이터로 준비합니다.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
        <path d="M14 4h6v6" opacity="0.4" />
      </svg>
    ),
  },
];

const STEPS: { step: string; title: string; body: string }[] = [
  {
    step: "01",
    title: "GitHub 주소 넣기",
    body: "내 GitHub 계정이나 대표 레포 주소를 붙여넣기만 하면 끝. 로그인도, 설정도 필요 없어요.",
  },
  {
    step: "02",
    title: "빈출 영역 받기",
    body: "내 커밋과 코드를 결정론으로 분석해 면접관이 캐물 빈출 영역을 빈도순으로 보여드려요.",
  },
  {
    step: "03",
    title: "self-check로 대비",
    body: "각 영역의 준비 주제와 스스로 답해보기 프롬프트로 면접 전까지 차근차근 다집니다.",
  },
];

export default function B2CLandingPage() {
  return (
    <>
      <B2CHeader />

      <main className="bg-white text-warmbody">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:pb-24 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="ab-eyebrow">취업 준비생을 위한 면접 코칭</p>
            <h1 className="mt-5 text-[32px] font-bold leading-tight tracking-tight text-warmink sm:text-5xl sm:leading-[1.1]">
              내 코드로 준비하는
              <br className="hidden sm:block" />{" "}
              <span className="text-rausch">기술 면접</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-warmmuted sm:text-lg">
              막연한 예상 질문 말고, 내 GitHub에서 면접관이 진짜 캐물을 영역만.
              빈출도 순으로 보고, 스스로 답해보며 차근차근 준비해요.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/b2c/app" className="ab-btn-primary w-full sm:w-auto">
                내 깃허브 분석하기
              </Link>
              <a href="#how" className="ab-btn-ghost w-full sm:w-auto">
                작동 방식 보기
              </a>
            </div>
            <p className="mt-5 text-sm text-warmmuted">
              로그인 불필요 · 공개 GitHub 정보만 사용 · 무료로 시작
            </p>
          </div>

          {/* 따뜻한 미리보기 카드 — 사진 대신 둥근 카드·여백·rausch 포인트 */}
          <div className="mt-14 sm:mt-16">
            <div className="ab-card mx-auto max-w-3xl p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <span className="ab-eyebrow">내 빈출 영역 미리보기</span>
                <span className="ab-pill bg-warmsoft text-warmmuted">예시</span>
              </div>
              <ul className="mt-5 space-y-4">
                {[
                  { rank: "#1", label: "동시성 처리", pct: 82 },
                  { rank: "#2", label: "데이터 모델링", pct: 64 },
                  { rank: "#3", label: "성능 최적화", pct: 47 },
                ].map((row) => (
                  <li key={row.rank}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5">
                        <span className="font-mono text-sm font-bold text-warmmuted">
                          {row.rank}
                        </span>
                        <span className="text-base font-semibold text-warmink">
                          {row.label}
                        </span>
                      </span>
                      <span className="font-mono text-sm font-bold text-rausch">
                        {row.pct}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-warmsoft">
                      <div
                        className="h-full rounded-full bg-rausch"
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm leading-relaxed text-warmmuted">
                정답을 떠먹여 주지 않아요. 직접 설명해보며 약한 곳을 스스로 찾기
                때문에, 외워서가 아니라 진짜 이해로 준비됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* ── Value 섹션 ───────────────────────────────────────── */}
        <section className="border-t border-warmline-soft bg-warmsoft">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
            <div className="max-w-2xl">
              <p className="ab-eyebrow">왜 develfit인가요</p>
              <h2 className="mt-4 text-[26px] font-semibold leading-tight tracking-tight text-warmink sm:text-3xl">
                내 코드만큼 솔직한 면접 준비는 없어요
              </h2>
              <p className="mt-4 text-base leading-relaxed text-warmmuted">
                남이 만든 예상 질문집 대신, 내가 직접 쓴 커밋과 코드에서 출발합니다.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-3">
              {VALUES.map((v) => (
                <div key={v.title} className="ab-card flex h-full flex-col p-7">
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 place-items-center rounded-full bg-rausch/10 text-rausch"
                  >
                    {v.icon}
                  </span>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-warmink">
                    {v.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-warmbody">
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 작동 방식 (3 steps) ──────────────────────────────── */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="ab-eyebrow">작동 방식</p>
            <h2 className="mt-4 text-[26px] font-semibold leading-tight tracking-tight text-warmink sm:text-3xl">
              세 단계면 충분해요
            </h2>
            <p className="mt-4 text-base leading-relaxed text-warmmuted">
              복잡한 설정 없이, 주소 하나로 면접 준비를 시작하세요.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="ab-card-outline flex h-full flex-col p-7">
                <span className="font-mono text-3xl font-bold text-rausch">
                  {s.step}
                </span>
                <h3 className="mt-4 text-lg font-bold tracking-tight text-warmink">
                  {s.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-warmbody">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 마지막 CTA ───────────────────────────────────────── */}
        <section className="px-5 pb-20 sm:pb-28">
          <div className="ab-card mx-auto max-w-4xl overflow-hidden">
            <div className="px-7 py-12 text-center sm:px-12 sm:py-16">
              <p className="ab-eyebrow">지금 시작하기</p>
              <h2 className="mx-auto mt-4 max-w-2xl text-[26px] font-semibold leading-tight tracking-tight text-warmink sm:text-[34px]">
                내 GitHub가 준비됐다면,
                <br className="hidden sm:block" /> 면접도 준비될 수 있어요
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-warmmuted">
                주소만 넣으면 1분 안에 내 빈출 영역과 self-check를 받아볼 수 있어요.
              </p>
              <div className="mt-8 flex justify-center">
                <Link href="/b2c/app" className="ab-btn-primary w-full sm:w-auto">
                  무료로 내 깃허브 분석하기
                </Link>
              </div>
              <p className="mt-6 text-sm text-warmmuted">
                면접관이신가요?{" "}
                <Link
                  href="/"
                  className="font-semibold text-warmink underline-offset-2 hover:underline"
                >
                  면접관용 페이지로 가기 →
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>

      <B2CFooter />
    </>
  );
}
