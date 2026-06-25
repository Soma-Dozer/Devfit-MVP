# GitProof

GitHub 기반 **양면 개발자 채용 플랫폼** (SW마에스트로 제17기 프로젝트).
지원자에겐 포트폴리오·면접 대비를, 면접관에겐 코드 근거 면접 질문을 제공합니다.

## 스택

- **frontend/** — Next.js 16 (App Router, React 19, TypeScript, Tailwind v4)
- **backend/** — Spring Boot 3.4 (Java 21, Gradle) · **Spring Data JPA + H2 파일 DB**(→ Postgres 교체는 datasource 설정만)
- **AI** — AWS Bedrock (OpenAI gpt-oss, Converse API) · GitHub REST API (퍼블릭 레포)
- **인증** — 이메일/비밀번호 회원가입(BCrypt) + 인메모리 토큰

## 구현 범위 (현재)

- 랜딩 (`/`) — 양면 플랫폼 소개(지원자/면접관)
- 인증 (`/login`) — **회원가입/로그인**, 역할(지원자·면접관) 선택. 로그인 후 역할별 홈으로 이동
- **지원자**
  - 내 포트폴리오 (`/profile`) — GitHub username 등록 → 프로필·기술 스택(언어 집계)·대표 프로젝트·활동 통계 + AI 한줄 소개
  - 면접 대비 (`/prep`) — 내 레포 기반 **복습 주제** + 코드 조각별 **예상 질문 + 모범답안 가이드**
- **면접관**
  - 검증 대시보드 (`/dashboard`) — 지원자 레포 → 레포 개요 → 코드 조각(Diff) → 간단 설명 → 핵심 질문(L1/L2)
- 공통: 레포 개요는 LLM 없이 항상 동작, LLM 호출은 **1회 배치**(Bedrock Converse), 실패 시에도 코드 조각은 표시. 레포별 결과 캐시.

## 실행

### 1) 사전 요구

- Node 20+ / JDK 21 / (Gradle 래퍼 포함)
- `backend/.env`에 AWS Bedrock 설정 (Bedrock API 키 = 베어러 토큰 방식):
  ```
  BEDROCK_API_KEY=bedrock-api-key-...          # 필수 (단기 키는 ~12h 후 만료)
  BEDROCK_REGION=eu-north-1
  BEDROCK_MODEL_ID=openai.gpt-oss-120b-1:0     # 해당 리전에서 액세스 켜진 모델로
  # GITHUB_TOKEN=...                            # 선택(퍼블릭 레포는 없어도 동작, 시간당 60회 제한)
  ```
  > 모델 ID는 리전·계정에 따라 다릅니다. ON_DEMAND 모델(예: `openai.gpt-oss-120b-1:0`)은 바로 호출되고, INFERENCE_PROFILE 전용 모델(Claude 등)은 `eu.anthropic.*` 같은 프로파일 ID가 필요합니다. Anthropic 모델은 추가로 콘솔에서 use-case 양식 제출이 필요할 수 있습니다.

### 2) 백엔드 (포트 8080)

```bash
cd backend
./gradlew bootRun
```

### 3) 프론트엔드 (포트 3000)

```bash
cd frontend
npm install      # 최초 1회
npm run dev
```

브라우저에서 http://localhost:3000 접속 → "면접관으로 시작" → 데모 로그인 → 레포 분석.

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/auth/signup` | `{email, password, name, role, githubUsername?}` — 가입 + 토큰 |
| POST | `/api/auth/login` | `{email, password}` — 토큰 + user |
| GET | `/api/auth/me` | (Bearer) 현재 사용자 |
| POST | `/api/auth/github` | (Bearer) `{githubUsername}` 등록/변경 |
| GET | `/api/portfolio?username=` | 지원자 포트폴리오(프로필·스택·프로젝트·AI 소개) |
| POST | `/api/prep` | `{repoUrl, maxSnippets}` — 복습 주제 + 조각별 예상질문·모범답안 |
| POST | `/api/analyze` | `{repoUrl, maxSnippets}` — (면접관) 코드 조각 + 설명 + L1/L2 질문 |

## 참고

- `frontend/.env.local`의 `NEXT_PUBLIC_API_BASE`로 백엔드 주소를 바꿀 수 있습니다(기본 `http://localhost:8080`).
- LLM 호출은 AWS SDK 없이 **RestClient로 Bedrock Converse REST**를 직접 호출합니다(`Authorization: Bearer <BEDROCK_API_KEY>`, SigV4 불필요). gpt-oss 응답은 `reasoningContent` 블록이 먼저 오므로 `text` 블록을 찾아 사용합니다.
- 백엔드 CORS는 `http://localhost:*`를 허용합니다(프론트가 3000이 아닌 포트로 떠도 동작).
