import type { Config } from "tailwindcss";

/**
 * DevFit — HP-inspired design system (see DESIGN.md).
 * 순백 캔버스 · HP 일렉트릭 블루(#024ad8) 단일 시그널 · 근검정 잉크 ·
 * 16px 카드 / 4px 버튼 · 블루 셰브론 · 다크 네이비 슬랩.
 *
 * 레거시 토큰명(pine/paper/panel/clay)을 HP 값으로 remap해, 기존 마크업도
 * 즉시 새 팔레트를 채택하도록 한다(점진 마이그레이션). 신규 마크업은 의미 토큰
 * (primary/canvas/cloud/fog/ink ...)을 직접 쓴다.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── HP 의미 토큰 (신규 권장) ──
        primary: {
          DEFAULT: "#024ad8", // HP Electric Blue — 단일 CTA/링크/셰브론
          bright: "#296ef9", // 다크 슬랩 위 블루
          deep: "#0e3191", // pressed / visited
          soft: "#c9e0fc", // 옅은 블루 표면/칩
        },
        canvas: "#ffffff", // 보편 페이지 배경
        cloud: "#f7f7f7", // 가장 옅은 회색 밴드
        fog: "#e8e8e8", // 조금 진한 회색 표면
        steel: "#c2c2c2", // 강조 외곽선
        graphite: "#636363", // 잔글씨/타임스탬프
        charcoal: "#3d3d3d", // 보조 본문
        coral: "#ff5050", // 세일/강조 태그
        error: "#b3262b",
        ink: {
          DEFAULT: "#1a1a1a", // 본문/헤드라인 잉크
          deep: "#000000", // 워드마크/1px 선
          soft: "#525252", // 보조 텍스트(흰 배경)
        },

        // ── 레거시 별칭 → HP 값 remap ──
        paper: "#ffffff", // 앱 배경(크림 → 화이트 캔버스)
        panel: "#ffffff", // 카드 표면(화이트)
        pine: { DEFAULT: "#024ad8", deep: "#0e3191" }, // 프루프그린 → HP 블루(단일 시그널)
        clay: "#b3262b", // 파괴/위조의심 → 에러 레드
        hairline: { DEFAULT: "#e8e8e8", strong: "#c2c2c2" },

        // ── Airbnb(B2C) 토큰 — 따뜻한 소비자 마켓플레이스(HP와 충돌 없이 공존) ──
        rausch: { DEFAULT: "#ff385c", active: "#e00b41", soft: "#ffd1da" }, // 단일 브랜드 보라레드
        warmink: "#222222", // B2C 헤드라인/본문 잉크
        warmbody: "#3f3f3f", // B2C 본문
        warmmuted: "#6a6a6a", // B2C 보조 텍스트
        warmline: { DEFAULT: "#dddddd", soft: "#ebebeb" }, // B2C 경계선
        warmsoft: "#f7f7f7", // B2C 옅은 표면
      },
      fontFamily: {
        // HP 단일 패밀리 원칙 — Pretendard(한/영) 우선, Inter는 HP 권장 대체.
        display: [
          "Pretendard Variable",
          "Pretendard",
          "var(--font-display)",
          "var(--font-body)",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "var(--font-body)",
          "system-ui",
          "sans-serif",
        ],
        // 코드/증거(SHA·diff) 정렬을 위해 mono는 도메인 예외로 유지.
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        none: "0px",
        sm: "3px",
        DEFAULT: "4px", // 버튼/입력 — 샤프
        md: "4px",
        lg: "8px", // 배지/칩/FAQ
        xl: "16px", // 카드/사진 프레임 — 소프트
        "2xl": "24px",
        full: "9999px",
      },
      letterSpacing: {
        label: "0.08em",
        button: "0.05em", // 버튼 대문자 트래킹(HP 0.7px)
      },
      boxShadow: {
        // HP elevation — 색 대비 위주, 그림자는 카드 한정.
        lift: "0 2px 8px rgba(26, 26, 26, 0.08)",
        float: "0 8px 24px rgba(26, 26, 26, 0.12)",
      },
      maxWidth: {
        content: "1366px", // HP 데스크톱 콘텐츠 컨테이너
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        stamp: {
          "0%": { opacity: "0", transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        stamp: "stamp 0.45s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
