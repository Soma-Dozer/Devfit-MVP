package com.gitproof.github;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * 퍼블릭 GitHub 레포에서 "의미 있는" 커밋의 Diff 스니펫을 추출한다.
 * 토큰 없이도 동작하나(시간당 60회 제한), GITHUB_TOKEN이 있으면 헤더에 실어 한도를 높인다.
 */
@Service
public class GithubService {

    private final RestClient client;

    public GithubService(@Value("${github.token:}") String token) {
        RestClient.Builder b = RestClient.builder()
                .baseUrl("https://api.github.com")
                .defaultHeader("Accept", "application/vnd.github+json")
                .defaultHeader("X-GitHub-Api-Version", "2022-11-28")
                .defaultHeader("User-Agent", "GitProof");
        if (token != null && !token.isBlank()) {
            b.defaultHeader("Authorization", "Bearer " + token);
        }
        this.client = b.build();
    }

    public record Repo(String owner, String name) {
        public String full() { return owner + "/" + name; }
    }

    /** 다양한 형태의 GitHub URL/슬러그를 owner/name 으로 정규화한다. */
    public Repo parse(String url) {
        if (url == null || url.isBlank()) {
            throw new IllegalArgumentException("레포 주소를 입력해 주세요.");
        }
        String s = url.trim()
                .replaceFirst("^https?://", "")
                .replaceFirst("^www\\.", "")
                .replaceFirst("^github\\.com/", "")
                .replaceFirst("\\.git$", "")
                .replaceFirst("/+$", "");
        String[] parts = s.split("/");
        if (parts.length < 2 || parts[0].isBlank() || parts[1].isBlank()) {
            throw new IllegalArgumentException("올바른 GitHub 레포 주소가 아닙니다 (예: github.com/owner/repo): " + url);
        }
        return new Repo(parts[0], parts[1]);
    }

    public record GhUser(
            String login, String name, String bio, String avatarUrl, String htmlUrl,
            int followers, int publicRepos, String company, String location) {}

    public record GhRepo(
            String name, String fullName, String description, String language,
            int stars, int forks, String htmlUrl, String pushedAt, List<String> topics, boolean fork) {}

    /** GitHub 사용자 프로필 (포트폴리오 헤더용). */
    public GhUser fetchUserProfile(String username) {
        String u = normalizeUsername(username);
        JsonNode r = getJson("/users/{u}", u);
        if (r == null || r.path("login").isMissingNode()) {
            throw new IllegalArgumentException("GitHub 사용자를 찾을 수 없습니다: " + u);
        }
        return new GhUser(
                r.path("login").asText(u),
                r.path("name").asText(""),
                r.path("bio").asText(""),
                r.path("avatar_url").asText(""),
                r.path("html_url").asText(""),
                r.path("followers").asInt(),
                r.path("public_repos").asInt(),
                r.path("company").asText(""),
                r.path("location").asText("")
        );
    }

    /** 사용자의 퍼블릭 레포 목록 (최근 푸시 순). */
    public List<GhRepo> fetchUserRepos(String username) {
        String u = normalizeUsername(username);
        JsonNode arr = getJson("/users/{u}/repos?sort=pushed&per_page=100", u);
        List<GhRepo> out = new ArrayList<>();
        if (arr != null && arr.isArray()) {
            for (JsonNode r : arr) {
                List<String> topics = new ArrayList<>();
                if (r.path("topics").isArray()) r.path("topics").forEach(t -> topics.add(t.asText()));
                out.add(new GhRepo(
                        r.path("name").asText(""),
                        r.path("full_name").asText(""),
                        r.path("description").asText(""),
                        r.path("language").asText(""),
                        r.path("stargazers_count").asInt(),
                        r.path("forks_count").asInt(),
                        r.path("html_url").asText(""),
                        r.path("pushed_at").asText(""),
                        topics,
                        r.path("fork").asBoolean(false)
                ));
            }
        }
        return out;
    }

    private String normalizeUsername(String username) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException("GitHub username을 입력해 주세요.");
        }
        return username.trim()
                .replaceFirst("^https?://", "")
                .replaceFirst("^github\\.com/", "")
                .replaceFirst("/.*$", "")
                .replaceFirst("/+$", "");
    }

    public record RepoInfo(
            String fullName,
            String description,
            String language,
            int stars,
            int forks,
            List<String> topics,
            String htmlUrl,
            String readmeExcerpt
    ) {}

    /** 레포가 "뭐하는 앱인지" 파악할 메타데이터 + README 발췌(LLM 없이 항상 동작). */
    public RepoInfo fetchRepoInfo(Repo repo) {
        JsonNode r = getJson("/repos/{o}/{r}", repo.owner(), repo.name());
        if (r == null) {
            throw new IllegalStateException("레포 정보를 가져오지 못했습니다.");
        }

        List<String> topics = new ArrayList<>();
        if (r.path("topics").isArray()) {
            r.path("topics").forEach(t -> topics.add(t.asText()));
        }

        return new RepoInfo(
                r.path("full_name").asText(repo.full()),
                r.path("description").asText(""),
                r.path("language").asText(""),
                r.path("stargazers_count").asInt(),
                r.path("forks_count").asInt(),
                topics,
                r.path("html_url").asText(""),
                fetchReadmeExcerpt(repo)
        );
    }

    /** GitHub GET 호출. 403/429(레이트 리밋)는 사용자 친화적 메시지로 변환한다. */
    private JsonNode getJson(String uri, Object... vars) {
        try {
            return client.get().uri(uri, vars).retrieve().body(JsonNode.class);
        } catch (RestClientResponseException e) {
            int code = e.getStatusCode().value();
            if (code == 403 || code == 429) {
                throw new IllegalStateException(rateLimitMessage(e));
            }
            throw e;
        }
    }

    private String rateLimitMessage(RestClientResponseException e) {
        String when = "";
        try {
            String reset = e.getResponseHeaders() != null
                    ? e.getResponseHeaders().getFirst("x-ratelimit-reset") : null;
            if (reset != null) {
                long sec = Long.parseLong(reset) - (System.currentTimeMillis() / 1000);
                if (sec > 0) when = " 약 " + ((sec / 60) + 1) + "분 후 한도가 리셋됩니다.";
            }
        } catch (Exception ignore) { /* 헤더 없으면 생략 */ }
        return "GitHub API 호출 한도를 초과했습니다(미인증 시간당 60회)." + when
                + " backend/.env에 GITHUB_TOKEN(개인 액세스 토큰)을 설정하면 시간당 5000회로 늘어납니다.";
    }

    public String fetchReadmeExcerpt(String owner, String repo) {
        return fetchReadmeExcerpt(new Repo(owner, repo));
    }

    /** 특정 레포의 언어별 바이트 수 (차트용). 바이트 내림차순. 실패 시 빈 맵. */
    public java.util.Map<String, Long> fetchRepoLanguages(String owner, String repo) {
        try {
            JsonNode n = getJson("/repos/{o}/{r}/languages", owner, repo);
            java.util.List<java.util.Map.Entry<String, Long>> entries = new ArrayList<>();
            if (n != null) n.fields().forEachRemaining(e -> entries.add(java.util.Map.entry(e.getKey(), e.getValue().asLong())));
            entries.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));
            java.util.LinkedHashMap<String, Long> out = new java.util.LinkedHashMap<>();
            entries.forEach(e -> out.put(e.getKey(), e.getValue()));
            return out;
        } catch (Exception e) {
            return java.util.Map.of();
        }
    }

    private String fetchReadmeExcerpt(Repo repo) {
        try {
            JsonNode readme = client.get()
                    .uri("/repos/{o}/{r}/readme", repo.owner(), repo.name())
                    .retrieve()
                    .body(JsonNode.class);
            if (readme == null || !readme.has("content")) return "";
            String b64 = readme.path("content").asText("").replaceAll("\\s", "");
            String decoded = new String(Base64.getDecoder().decode(b64));
            return decoded.length() > 1500 ? decoded.substring(0, 1500) : decoded;
        } catch (Exception e) {
            return "";
        }
    }

    public record Snippet(
            String commitSha,
            String shortSha,
            String commitMessage,
            String fileName,
            String patch,
            int additions,
            int deletions,
            String htmlUrl,
            String authorName,
            String date
    ) {}

    private record Cand(JsonNode commit, JsonNode file, int score) {}

    /**
     * "의미 있는" Diff만 선별한다.
     * - 잡음 커밋(merge/bump/docs/lint/format/version 등) 제외
     * - 테스트·설정·문서 파일 제외, 실제 코드 파일만
     * - 사소한 변경 제외(주석·공백만, 너무 작은 변경)
     * - 변경 품질 점수(키워드 + 실질 변경 라인 수)로 상위 선별, 파일 중복 제거
     */
    public List<Snippet> extractSnippets(Repo repo, int maxSnippets) {
        JsonNode commits = getJson("/repos/{o}/{r}/commits?per_page=60", repo.owner(), repo.name());

        if (commits == null || !commits.isArray() || commits.isEmpty()) {
            throw new IllegalStateException("커밋을 찾을 수 없습니다. 레포가 비공개이거나 비어 있을 수 있습니다.");
        }

        // 당사자(레포 주인)가 직접 작성한 커밋만 — 다른 기여자/봇 커밋 제외.
        // 주인이 작성한 커밋이 하나도 없으면(연결 안 된 계정 등) 전체로 폴백.
        String owner = repo.owner();
        List<JsonNode> mine = new ArrayList<>();
        List<JsonNode> all = new ArrayList<>();
        for (JsonNode c : commits) {
            String msg = message(c);
            if (msg.startsWith("Merge ") || isJunkMessage(msg)) continue; // 잡음 커밋 제외
            all.add(c);
            if (isAuthoredBy(c, owner)) mine.add(c);
        }
        List<JsonNode> ordered = mine.isEmpty() ? all : mine;
        ordered.sort((a, b) -> Integer.compare(score(message(b)), score(message(a))));

        // 상위 후보 커밋을 일정 개수만 상세 조회(레이트 리밋 보호)하여 후보 수집.
        // 풀보다 넉넉히 모아 "중요한 후보군"을 크게 만든 뒤, 그 안에서 매번 랜덤 샘플링한다.
        int budget = Math.min(ordered.size(), Math.max(18, maxSnippets + 12));
        List<Cand> cands = new ArrayList<>();
        int examined = 0;
        for (JsonNode c : ordered) {
            if (examined >= budget) break;
            String sha = c.path("sha").asText();
            JsonNode detail;
            try {
                detail = client.get()
                        .uri("/repos/{o}/{r}/commits/{sha}", repo.owner(), repo.name(), sha)
                        .retrieve()
                        .body(JsonNode.class);
            } catch (Exception e) {
                continue;
            }
            examined++;
            if (detail == null) continue;
            JsonNode best = pickBestFile(detail.path("files"));
            if (best == null) continue;
            String patch = best.path("patch").asText("");
            // 선언 라인 수가 아니라 "로직 밀도 + 기술 키워드"를 핵심 점수로.
            int quality = score(message(c)) * 2 + logicLines(patch) * 3 + codeInterest(patch) * 2;
            cands.add(new Cand(c, best, quality));
        }

        cands.sort((a, b) -> Integer.compare(b.score(), a.score()));

        // 파일 중복 없이 "중요한 후보 슈퍼셋"을 만든다(파일별 최고 품질 1개).
        List<Cand> important = new ArrayList<>();
        Set<String> seenFiles = new HashSet<>();
        for (Cand cd : cands) {
            String fn = cd.file().path("filename").asText();
            if (seenFiles.add(fn)) important.add(cd);
        }

        if (important.isEmpty()) {
            throw new IllegalStateException("분석할 만한 의미 있는 코드 변경을 찾지 못했습니다. (핵심 기능/버그픽스/리팩토링 커밋이 있는 레포로 시도해 주세요)");
        }

        // 중요한 후보군 안에서 "매번 다르게" 품질 가중 랜덤 샘플링하여 풀을 구성한다.
        // 품질이 높을수록 뽑힐 확률이 크지만 고정되지 않아, 호출마다 코드 조각이 달라진다.
        int poolSize = Math.min(important.size(), Math.max(6, maxSnippets * 2));
        List<Cand> sampled = weightedSample(important, poolSize);

        List<Snippet> out = new ArrayList<>();
        for (Cand cd : sampled) {
            out.add(toSnippet(cd.commit(), cd.file()));
        }
        return out;
    }

    /**
     * 품질(quality)을 가중치로 한 비복원 랜덤 샘플링.
     * 중요한 조각일수록 자주 뽑히되, 호출마다 결과가 달라져 매번 다른 코드 조각/질문이 나오게 한다.
     */
    private List<Cand> weightedSample(List<Cand> pool, int n) {
        List<Cand> src = new ArrayList<>(pool);
        List<Cand> picked = new ArrayList<>();
        ThreadLocalRandom rnd = ThreadLocalRandom.current();
        while (!src.isEmpty() && picked.size() < n) {
            long total = 0;
            for (Cand c : src) total += Math.max(1, c.score());
            long r = (long) (rnd.nextDouble() * total);
            int idx = src.size() - 1;
            for (int i = 0; i < src.size(); i++) {
                r -= Math.max(1, src.get(i).score());
                if (r < 0) { idx = i; break; }
            }
            picked.add(src.remove(idx));
        }
        return picked;
    }

    /** 커밋이 레포 주인(당사자) 작성인지 — GitHub 연결 계정(author.login) 기준. */
    private boolean isAuthoredBy(JsonNode commit, String owner) {
        String login = commit.path("author").path("login").asText("");
        return !login.isBlank() && login.equalsIgnoreCase(owner);
    }

    private Snippet toSnippet(JsonNode c, JsonNode file) {
        String sha = c.path("sha").asText();
        String firstLine = message(c).split("\n", 2)[0];
        String core = coreSnippet(file.path("patch").asText(""));
        // 잘라낸 핵심 조각 기준으로 +/- 라인 재계산(표시와 일치).
        int add = 0, del = 0;
        for (String l : core.split("\n")) {
            if (l.startsWith("+") && !l.startsWith("+++")) add++;
            else if (l.startsWith("-") && !l.startsWith("---")) del++;
        }
        return new Snippet(
                sha,
                sha.length() >= 7 ? sha.substring(0, 7) : sha,
                firstLine,
                file.path("filename").asText(),
                core,
                add,
                del,
                c.path("html_url").asText(),
                c.path("commit").path("author").path("name").asText(""),
                c.path("commit").path("author").path("date").asText("")
        );
    }

    /**
     * patch에서 "핵심" 부분만 잘라낸다.
     * 여러 hunk(@@) 중 실질 변경이 가장 많은 hunk 하나를 골라 최대 ~28줄로 제한.
     */
    private String coreSnippet(String patch) {
        if (patch == null || patch.isBlank()) return "";
        String[] lines = patch.split("\n");

        List<List<String>> hunks = new ArrayList<>();
        List<String> cur = null;
        for (String line : lines) {
            if (line.startsWith("@@")) {
                cur = new ArrayList<>();
                cur.add(line);
                hunks.add(cur);
            } else if (cur != null) {
                cur.add(line);
            }
        }

        List<String> chosen;
        if (hunks.isEmpty()) {
            int n = Math.min(lines.length, 24);
            chosen = new ArrayList<>();
            for (int i = 0; i < n; i++) chosen.add(lines[i]);
        } else {
            // 라인 수가 많은 hunk가 아니라 "로직 밀도 + 기술 키워드"가 높은 hunk를 고른다.
            chosen = hunks.get(0);
            int bestQ = -1;
            for (List<String> h : hunks) {
                String hp = String.join("\n", h);
                int q = logicLines(hp) * 3 + codeInterest(hp);
                if (q > bestQ) { bestQ = q; chosen = h; }
            }
        }

        final int CAP = 20;
        boolean capped = chosen.size() > CAP;
        if (capped) {
            // 앞 N줄이 아니라 "로직이 가장 밀집된" N줄 윈도우를 보여준다(@@ 헤더는 유지).
            boolean hasHeader = chosen.get(0).startsWith("@@");
            List<String> header = hasHeader ? chosen.subList(0, 1) : List.of();
            List<String> body = hasHeader ? chosen.subList(1, chosen.size()) : chosen;
            int win = Math.min(CAP - header.size(), body.size());
            int bestStart = 0, bestDensity = -1;
            for (int start = 0; start + win <= body.size(); start++) {
                int density = 0;
                for (int i = start; i < start + win; i++) {
                    String l = body.get(i);
                    if (!l.isEmpty() && looksLikeLogic(l.substring(Math.min(1, l.length())))) density++;
                }
                if (density > bestDensity) { bestDensity = density; bestStart = start; }
            }
            List<String> shown = new ArrayList<>(header);
            if (bestStart > 0) shown.add("…");
            shown.addAll(body.subList(bestStart, bestStart + win));
            chosen = shown;
        }
        String out = String.join("\n", chosen);
        if (capped) out += "\n…";
        if (hunks.size() > 1) out += "\n… (이 파일의 다른 변경 부분은 생략)";
        return out;
    }

    /** 코드 파일 중 "로직이 풍부한" 파일을 고른다(선언만 있는 파일보다 우선). 없으면 null. */
    private JsonNode pickBestFile(JsonNode files) {
        if (files == null || !files.isArray()) return null;
        JsonNode best = null;
        int bestScore = -1;
        JsonNode fallback = null;
        int fbQ = 0;
        for (JsonNode f : files) {
            if (!f.has("patch")) continue;
            String fn = f.path("filename").asText();
            if (!isCodeFile(fn) || isTestOrConfig(fn)) continue;
            String patch = f.path("patch").asText("");
            int dq = diffQuality(patch);
            if (dq < 2) continue; // 사소한 변경 제외
            int logic = logicLines(patch);
            int s = logic * 2 + codeInterest(patch);
            if (logic >= 1 && s > bestScore) { best = f; bestScore = s; } // 로직 있는 파일 우선
            if (dq > fbQ) { fallback = f; fbQ = dq; }                     // 폴백(선언만 있는 변경뿐일 때)
        }
        return best != null ? best : fallback;
    }

    private String message(JsonNode commit) {
        return commit.path("commit").path("message").asText("");
    }

    private int score(String msg) {
        String s = msg.toLowerCase();
        int sc = 0;
        String[] keywords = {
                "fix", "perf", "performance", "optim", "refactor", "cache", "concurren",
                "lock", "n+1", "memory", "leak", "bug", "improve", "resolve", "index",
                "query", "race", "deadlock", "latency", "throughput", "retry", "batch",
                "feat", "feature", "implement", "support", "add ", "async", "pool", "stream",
                "validation", "security", "auth", "migrat", "algorithm", "thread"
        };
        for (String k : keywords) if (s.contains(k)) sc += 10;
        return sc;
    }

    /** 문서·의존성·버전·포맷팅 등 분석 가치가 낮은 잡음 커밋 판별. */
    private boolean isJunkMessage(String msg) {
        String s = msg.toLowerCase().strip();
        String[] junk = {
                "bump", "dependabot", "update dependency", "update deps", "upgrade deps",
                "typo", "gofmt", "rustfmt", "prettier", "eslint", "lint", "format",
                "whitespace", "changelog", "version bump", "release v", "bump version",
                "update readme", "readme", "docs:", "doc:", "style:", "chore:", "ci:",
                "build:", "translation", "i18n", "rename", "comment"
        };
        for (String j : junk) if (s.startsWith(j) || s.contains(" " + j)) return true;
        // "release"/"v1.2.3" 류
        return s.matches("^(release|v?\\d+\\.\\d+).*");
    }

    /** 테스트·설정·문서·잠금 파일 판별. */
    private boolean isTestOrConfig(String filename) {
        String f = filename.toLowerCase();
        // 경로 세그먼트 기반 테스트 디렉터리 판별 (예: "tests/sincos.c")
        for (String seg : f.split("/")) {
            if (seg.equals("test") || seg.equals("tests") || seg.equals("spec") || seg.equals("specs")
                    || seg.equals("__tests__") || seg.equals("testing") || seg.equals("e2e")) return true;
        }
        String base = f.contains("/") ? f.substring(f.lastIndexOf('/') + 1) : f;
        if (base.contains("_test.") || base.contains(".test.") || base.contains(".spec.")
                || base.contains("_spec.") || base.startsWith("test_") || base.startsWith("spec_")) return true;
        String[] cfgExt = {
                ".json", ".yaml", ".yml", ".toml", ".xml", ".gradle", ".lock", ".sum",
                ".mod", ".cfg", ".ini", ".properties", ".md", ".txt", ".gitignore"
        };
        for (String e : cfgExt) if (base.endsWith(e)) return true;
        return base.equals("dockerfile") || base.equals("makefile")
                || base.equals("package.json") || base.equals("go.mod") || base.equals("go.sum");
    }

    /** patch 안에 면접에서 다룰 만한 "기술적" 신호가 있으면 가산점(동시성·성능·알고리즘·인프라 등). */
    private int codeInterest(String patch) {
        if (patch == null || patch.isBlank()) return 0;
        String s = patch.toLowerCase();
        String[] toks = {
                "async", "await", "goroutine", "sync.", "mutex", "lock", "channel", "promise",
                "thread", "concurren", "atomic", "transaction", "rollback", "cache", "redis",
                "queue", "celery", "kafka", "stream", "buffer", "pool", "retry", "backoff",
                "debounce", "throttle", "algorithm", "recursion", "index(", "query", "join ",
                "aggregate", "regex", "hash", "encrypt", "jwt", "oauth", "token", "middleware",
                "interceptor", "decorator", "generic", "reflect", "websocket", "grpc", "batch",
                "worker", "scheduler", "optimi", "memo", "lazy", "pagination", "validate", "migrat"
        };
        int n = 0;
        for (String t : toks) if (s.contains(t)) n += 3;
        return Math.min(n, 30);
    }

    /**
     * "로직 밀도" — 단순 선언이 아니라 실제 동작(제어문·함수호출·연산·대입)이 있는 변경 라인 수.
     * 구조체/변수 선언만 잔뜩 있는 조각을 걸러내기 위함.
     */
    private static final String[] LOGIC_CONTROLS = {
            "if(", "if (", "for(", "for (", "while(", "while (", "switch(", "switch (",
            "return ", "return;", "case ", "break", "continue", "throw ", "catch",
            "await ", "async ", "yield ", "=>", "->", "go ", "defer "
    };
    private static final String[] LOGIC_OPS = {
            "==", "!=", "<=", ">=", "&&", "||", "+=", "-=", "*=", "/=", "%=", "<<", ">>", "?."
    };

    /** 코드 내용(diff 마커 제외)이 단순 선언이 아니라 실제 동작 로직인지. */
    private boolean looksLikeLogic(String content) {
        String c = content.strip();
        if (c.isEmpty() || c.startsWith("//") || c.startsWith("*") || c.startsWith("/*")
                || c.startsWith("#") || c.startsWith("<!--")) return false;
        if (c.contains("(")) return true; // 함수 호출/정의/조건
        for (String k : LOGIC_CONTROLS) if (c.contains(k)) return true;
        for (String op : LOGIC_OPS) if (c.contains(op)) return true;
        return c.contains("=") && !c.contains("=="); // 대입
    }

    private int logicLines(String patch) {
        if (patch == null || patch.isBlank()) return 0;
        int n = 0;
        for (String line : patch.split("\n")) {
            boolean add = line.startsWith("+") && !line.startsWith("+++");
            boolean del = line.startsWith("-") && !line.startsWith("---");
            if (!add && !del) continue;
            if (looksLikeLogic(line.substring(1))) n++;
        }
        return Math.min(n, 40);
    }

    /** patch에서 주석·공백을 제외한 실질 변경(추가/삭제) 라인 수. */
    private int diffQuality(String patch) {
        if (patch == null || patch.isBlank()) return 0;
        int n = 0;
        for (String line : patch.split("\n")) {
            boolean add = line.startsWith("+") && !line.startsWith("+++");
            boolean del = line.startsWith("-") && !line.startsWith("---");
            if (!add && !del) continue;
            String content = line.substring(1).strip();
            if (content.isEmpty()) continue;
            if (content.startsWith("//") || content.startsWith("*") || content.startsWith("/*")
                    || content.startsWith("#") || content.startsWith("<!--")) continue; // 주석
            n++;
        }
        return Math.min(n, 40);
    }

    private boolean isCodeFile(String filename) {
        String f = filename.toLowerCase();
        String[] ext = {
                ".java", ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rb", ".kt",
                ".c", ".cpp", ".cc", ".h", ".hpp", ".cs", ".rs", ".php", ".scala",
                ".swift", ".sql", ".m", ".mm"
        };
        for (String e : ext) if (f.endsWith(e)) return true;
        return false;
    }

    /** LLM 비용/토큰 절감을 위해 patch를 적당히 자른다. */
    private String truncatePatch(String patch) {
        if (patch == null) return "";
        String[] lines = patch.split("\n");
        if (lines.length <= 120) return patch;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 120; i++) sb.append(lines[i]).append("\n");
        sb.append("... (이하 생략, 총 ").append(lines.length).append("줄)");
        return sb.toString();
    }
}
