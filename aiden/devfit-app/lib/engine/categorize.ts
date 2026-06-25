import type { Category } from "./types";

/**
 * 커밋 메시지 → 카테고리 결정론 분류 (정규식, 한/영, LLM 0회).
 *
 * 핵심 thesis(poc-aiming-engine §0): "싼 추출"은 좋은 프롬프트가 아니라 *방법론*이다.
 * 카테고리 분류를 LLM을 한 번도 부르지 않고 메시지 정규식만으로 한다 — 초저가·설명가능.
 * 진짜 해자는 이 결정론 위에 B2B 라벨을 교차시키는 양면 구조에 있다(frequency.ts).
 *
 * 우선순위가 중요: 'fix race condition'은 troubleshooting보다 concurrency로,
 * 'perf: revert slow query'는 perf로 잡고 싶다. 위에서부터 먼저 매칭되는 것을 채택.
 */

interface Rule {
  category: Category;
  re: RegExp;
}

// 순서 = 우선순위(위가 강함). 한국어/영어 키워드 혼합.
const RULES: Rule[] = [
  {
    category: "concurrency",
    re: /\b(race\s?condition|concurren\w*|deadlock|mutex|semaphore|goroutine|async\s?bug|thread[-\s]?safe)\b|동시성|경합|데드락|교착|락\s?경합/i,
  },
  {
    category: "perf",
    re: /\b(perf(ormance)?|optimi[sz]\w*|latency|throughput|slow|speed[\s-]?up|memo(ry)?\s?leak|n\+1|bottleneck|cache\s?hit)\b|성능|최적화|느림|느려|병목|메모리\s?누수|지연/i,
  },
  {
    category: "data",
    re: /\b(migrat\w*|schema|index(es|ing)?|\bquery\b|\bsql\b|\bdb\b|database|n\+1|transaction|deadlock\s?on)\b|쿼리|스키마|인덱스|마이그레이션|데이터베이스|트랜잭션/i,
  },
  {
    category: "troubleshooting",
    re: /\b(fix(es|ed)?|bug|hotfix|patch|crash|except\w*|error|fail(ing|ed|ure)?|broken|regression|resolve[ds]?)\b|버그|에러|오류|고장|수정|장애|예외|깨짐|터짐/i,
  },
  {
    category: "refactor",
    re: /\b(refactor\w*|restructure|cleanup|clean[\s-]?up|simplif\w*|rename|extract|dedup\w*|tidy)\b|리팩|리팩토링|정리|구조\s?개선|단순화|중복\s?제거/i,
  },
  {
    category: "structure",
    re: /\b(architect\w*|module|modulari[sz]\w*|layer(ing)?|boundary|monorepo|package\s?split|directory\s?structure)\b|구조|아키텍처|모듈화|계층|패키지\s?분리/i,
  },
  {
    category: "revert",
    re: /\b(revert\w*|rollback|roll[\s-]?back|undo)\b|되돌|롤백|복구\s?커밋/i,
  },
  {
    category: "test",
    re: /\b(test(s|ing)?|spec|coverage|e2e|unit\s?test|integration\s?test)\b|테스트|커버리지/i,
  },
  {
    category: "feature",
    re: /\b(feat(ure)?|add(s|ed)?|implement\w*|introduce[ds]?|support\s?for|new\b)\b|기능|추가|구현|도입/i,
  },
];

// 저신호(노력 빈약) 메시지: wip/update/typo 남발 등.
const LOW_EFFORT_RE =
  /^\s*(wip|tmp|temp|asdf|update|updates?|minor|misc|stuff|fix\s?typo|typo|\.+|chore|nit)\s*\.?\s*$/i;

/** 메시지가 "wip/update" 류로 빈약한가. */
export function isLowEffortMessage(message: string): boolean {
  const firstLine = message.split("\n")[0].trim();
  if (!firstLine) return true;
  if (LOW_EFFORT_RE.test(firstLine)) return true;
  const words = firstLine.split(/\s+/).filter(Boolean);
  return words.length <= 1 && firstLine.length <= 6;
}

/** 커밋 메시지를 단일 카테고리로 분류(첫 매칭 우선). 미매칭은 chore. */
export function categorize(message: string): Category {
  const subject = message.split("\n")[0]; // 제목 줄 우선 매칭
  for (const rule of RULES) {
    if (rule.re.test(subject)) return rule.category;
  }
  for (const rule of RULES) {
    if (rule.re.test(message)) return rule.category;
  }
  return "chore";
}

/**
 * 파일/모듈 경로 → 카테고리 추론(코드베이스 가중치). 매칭 없으면 null.
 * 코드 영역의 "성격"을 경로에서 결정론으로 읽는다(예: db/ → data, api/ → structure).
 */
const PATH_RULES: Rule[] = [
  { category: "test", re: /(^|\/)(tests?|spec|specs|__tests__|e2e|cypress)(\/|$)|\.(test|spec)\./i },
  { category: "data", re: /(^|\/)(db|database|models?|schema|migrations?|repositor\w*|dao|entit\w*|prisma|sql|store|stores)(\/|$)/i },
  { category: "concurrency", re: /(^|\/)(worker|workers|queue|jobs?|scheduler|cron|stream|streams|consumer|producer)(\/|$)|concurren\w*|async/i },
  { category: "perf", re: /(^|\/)(cache|caching|benchmark\w*|perf)(\/|$)|optimiz/i },
  { category: "structure", re: /(^|\/)(api|routes?|router|controllers?|server|core|config|infra|gateway|middlewares?|providers?|adapters?)(\/|$)/i },
  { category: "feature", re: /(^|\/)(components?|pages?|features?|views?|screens?|handlers?|services?|ui|hooks?|widgets?|domain)(\/|$)/i },
];

export function categorizeByPath(path: string): Category | null {
  for (const rule of PATH_RULES) {
    if (rule.re.test(path)) return rule.category;
  }
  return null;
}

/** revert 커밋 여부. */
export function isRevert(message: string): boolean {
  const subject = message.split("\n")[0];
  return /^\s*revert\b|되돌|롤백/i.test(subject) || /\brevert\w*\b/i.test(subject);
}
