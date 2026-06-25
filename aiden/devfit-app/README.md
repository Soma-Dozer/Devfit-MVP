# DevFit — 코드로 증명하는 개발자 검증 (MLP)

지원자의 GitHub 커밋·Diff를 증거 삼아, 면접관이 "알고 짰는지"를 검증하도록 돕는 HR 플랫폼.

## 플랫폼 플로우

```
면접관 → /dashboard 에서 "면접 링크 생성" → 공유 링크를 후보에게 전달
후보   → /submit/{linkId} 에서 폼 작성(이름·이메일·포지션·경력주장·GitHub URL) → 제출
시스템 → 제출 즉시 저장 + GitHub URL을 백그라운드로 분석(runAnalysis)
면접관 → /dashboard 에서 상태 확인 → /dashboard/{linkId} 에서 후보 정보 + 3계층 면접 질문 확인
```

## 라우트

| 경로 | 설명 |
|---|---|
| `/` | 랜딩(마케팅) |
| `/app` | 가입 없이 URL 한 개로 즉석 분석(체험용) |
| `/dashboard` | 면접관 콘솔 — 링크 생성·목록 |
| `/dashboard/[linkId]` | 후보 상세 + 분석 결과(Exhibit 질문) |
| `/submit/[linkId]` | 후보용 제출 폼 |
| `/api/analyze` | 단발 분석 API |
| `/api/links` | 링크 생성(POST)·목록(GET, owner 쿠키 설정) |
| `/api/submit/[linkId]` | 후보 제출 저장 |
| `/api/submit/[linkId]/analyze` | 분석 트리거(멱등, 비동기) |

## 실행

```bash
npm install
npm run dev    # http://localhost:3000
```

## 환경변수 (`.env.local`)

| 변수 | 필수 | 설명 |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | GPT 질문 생성. **공유된 키는 테스트 후 반드시 폐기(rotate)하세요.** |
| `GITHUB_TOKEN` | 선택 | GitHub API 한도 60/h → 5000/h. |

## 데이터 저장 (중요)

- **현재: 로컬 파일 스토어** `.data/db.json` (gitignore됨). **클라우드 과금 0.**
- AWS를 쓰지 않는 이유: 작업 시점 AWS CLI 자격이 지정된 `aidengoldkr`가 아니라 `kunwoo_kim` 계정이라, 엉뚱한 계정 과금을 피하려 로컬로 결정.
- **교체 가능한 어댑터** 설계: `lib/db/index.ts`의 `getDb()`가 유일한 분기점. AWS 계정 확정 시 동일한 `Db` 인터페이스(`lib/db/types.ts`)를 구현하는 DynamoDB 어댑터(온디맨드 = 저volume 사실상 무료)로 교체하면 됩니다.

## 면접관 신원

- 비로그인 **ownerToken 쿠키**(httpOnly). 대시보드는 그 토큰이 소유한 링크만 노출. 링크 ID는 추측 불가능.
- MVP 한계: 쿠키 분실 시 대시보드 접근 불가. (추후 이메일 매직링크 등으로 확장.)

## 구조

| 파일 | 역할 |
|---|---|
| `lib/types.ts` | 분석 결과 타입 계약 |
| `lib/github.ts` / `lib/openai.ts` | GitHub 수집(병렬) / GPT 질문 생성(배치 병렬) |
| `lib/analyze.ts` | `runAnalysis(url)` — 분석 오케스트레이션 |
| `lib/db/*` | 영속화 계약 + 로컬 어댑터 + 팩토리 |
| `lib/owner.ts` | 면접관 쿠키 식별 |
| `design.md` | "The Dossier" 디자인 시스템 |
| `components/ui/*` | 공유 시그니처 컴포넌트(Seal·DiffHunk 등) |
| `components/QuestionCard.tsx` | Exhibit 질문 카드 |

## 한계 (MLP)

- 로컬 파일 DB는 dev/단일 인스턴스용(쓰기는 직렬 큐로 보호). 멀티 인스턴스/서버리스 배포 시 DynamoDB 어댑터 + 분석 큐/워커 필요.
- 분석은 `next start` 단일 프로세스에서 응답 후 백그라운드 실행.
