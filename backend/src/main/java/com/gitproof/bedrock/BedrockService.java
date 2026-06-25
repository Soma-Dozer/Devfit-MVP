package com.gitproof.bedrock;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * AWS Bedrock(Claude)으로 레포 요약·코드 설명·3계층 면접 질문을 생성한다.
 *
 * Bedrock API key(베어러 토큰)로 Converse REST 엔드포인트를 직접 호출한다
 * (SigV4 서명 불필요). 레포 요약 + 모든 스니펫의 설명/질문을 한 번의 호출로 배치 처리한다.
 */
@Service
public class BedrockService {

    private static final Logger log = LoggerFactory.getLogger(BedrockService.class);

    private final RestClient client = RestClient.create();
    private final String apiKey;
    private final String region;
    private final String modelId;
    private final boolean configured;
    private final ObjectMapper mapper = new ObjectMapper();

    public BedrockService(
            @Value("${bedrock.api-key:}") String apiKey,
            @Value("${bedrock.region:eu-north-1}") String region,
            @Value("${bedrock.model-id:eu.anthropic.claude-sonnet-4-6}") String modelId) {
        this.apiKey = apiKey;
        this.region = region;
        this.modelId = modelId;
        this.configured = apiKey != null && !apiKey.isBlank();
    }

    public record Question(String layer, String text, String rationale) {}

    public record SnippetInput(String commitMessage, String fileName, String patch) {}

    public record RepoContext(String fullName, String description, String language, String readmeExcerpt) {}

    /** LLM이 후보 풀에서 선별한 조각 — index는 입력 풀에서의 위치. */
    public record SelectedSnippet(int index, String title, String explanation, List<Question> questions) {}

    public record BatchResult(String repoSummary, List<SelectedSnippet> selected) {}

    /**
     * 후보 풀에서 면접에 가장 유용한(핵심 기술 포함) 조각을 LLM이 선별하고,
     * 선별된 조각마다 제목·설명·질문을 생성한다. (레포 요약 포함)
     *
     * @param pool 후보 스니펫 풀
     * @param targetCount 최종으로 고를 개수(최대)
     * @throws LlmException 호출 자체가 실패한 경우
     */
    public BatchResult generate(RepoContext repo, List<SnippetInput> pool, int targetCount) {
        if (!configured) {
            throw new LlmException(
                    "Bedrock API 키가 설정되지 않았습니다. backend/.env의 BEDROCK_API_KEY를 채우세요.");
        }
        if (pool.isEmpty()) return new BatchResult(null, List.of());

        String prompt = buildPrompt(repo, pool, targetCount);
        String text = invoke(prompt);

        if (text == null || text.isBlank()) {
            throw new LlmException("Bedrock이 빈 응답을 반환했습니다.");
        }
        return parse(text, pool.size(), targetCount);
    }

    // ── 지원자 면접 대비 (복습 주제 + 조각별 예상질문·답변 가이드) ──────────────

    public record PrepTopic(String topic, String why) {}
    public record PrepSnippet(int index, String title, String explanation, String question, String answerGuide) {}
    public record PrepResult(List<PrepTopic> topics, List<PrepSnippet> snippets) {}

    public PrepResult generatePrep(RepoContext repo, List<SnippetInput> pool, int targetCount) {
        if (!configured) throw new LlmException("Bedrock API 키가 설정되지 않았습니다.");
        if (pool.isEmpty()) return new PrepResult(List.of(), List.of());

        StringBuilder sb = new StringBuilder();
        sb.append("당신은 친절한 시니어 멘토입니다. 지원자가 '자신의' GitHub 코드를 바탕으로 기술 면접을 대비하도록 돕습니다.\n");
        sb.append("아래 ").append(pool.size()).append("개의 후보 코드 변경 중 면접에서 깊이 있게 다룰 만한 핵심 기술 조각만 고르세요.\n\n");
        sb.append("[레포] ").append(repo.fullName()).append(" / ").append(repo.language()).append("\n");
        if (repo.description() != null && !repo.description().isBlank()) sb.append("설명: ").append(repo.description()).append("\n");
        sb.append("""

                수행할 작업:
                1) topics: 면접 전에 복습하면 좋을 핵심 주제 4~6개. 각 topic과 why(왜 중요한지 1문장).
                2) selected: 후보 중 "면접 가치가 높은" 핵심 기술 조각만 최대 %d개 선택.
                   - 우선: 동시성/비동기, 성능, 알고리즘, 트랜잭션, 캐싱, 인증/보안, 에러 처리, 설계 결정 등.
                   - 제외: 단순 DTO/설정/import/CRUD·게터/스캐폴딩/마크업. 가치가 낮으면 개수를 채우지 말 것.
                   - 고른 조각마다:
                     · index: 후보 번호(정확히).
                     · title: 한 줄 한국어 제목(명사형, 30자 이내).
                     · explanation: 무엇을 하는지 한국어 2문장.
                     · question: 면접관이 이 코드로 물어볼 대표 질문 1개(본인이 답할 수 있어야 함).
                     · answerGuide: 답변 뼈대가 되는 모범답안 가이드 2~3문장.

                """.formatted(targetCount));
        for (int i = 0; i < pool.size(); i++) {
            SnippetInput s = pool.get(i);
            sb.append("[후보 ").append(i).append("] 커밋: ").append(s.commitMessage())
              .append(" / 파일: ").append(s.fileName())
              .append("\nDiff:\n```\n").append(s.patch()).append("\n```\n\n");
        }
        sb.append("""
                반드시 아래 JSON으로만 응답(마크다운/코드펜스 금지, index 정확히 매칭):
                {"topics":[{"topic":"...","why":"..."}],"selected":[{"index":0,"title":"한 줄 한글 제목","explanation":"...","question":"...","answerGuide":"..."}]}
                """);

        String text = invoke(sb.toString(), 8192);
        if (text == null || text.isBlank()) throw new LlmException("Bedrock이 빈 응답을 반환했습니다.");

        List<PrepTopic> topics = new ArrayList<>();
        List<PrepSnippet> out = new ArrayList<>();
        try {
            JsonNode root = mapper.readTree(extractJson(text));
            for (JsonNode t : root.path("topics")) {
                topics.add(new PrepTopic(t.path("topic").asText(""), t.path("why").asText("")));
            }
            JsonNode results = root.path("selected");
            if (!results.isArray()) results = root.path("results");
            Set<Integer> seen = new java.util.HashSet<>();
            for (JsonNode r : results) {
                if (out.size() >= targetCount) break;
                int idx = r.path("index").asInt(-1);
                if (idx < 0 || idx >= pool.size() || !seen.add(idx)) continue;
                out.add(new PrepSnippet(idx, r.path("title").asText(""), r.path("explanation").asText(""),
                        r.path("question").asText(""), r.path("answerGuide").asText("")));
            }
        } catch (Exception e) {
            log.warn("Prep JSON 파싱 실패: {}", e.getMessage());
            throw new LlmException("Bedrock 응답을 해석하지 못했습니다.");
        }
        return new PrepResult(topics, out);
    }

    // ── 주 프로젝트 심층 분석 (포트폴리오) ──────────────────────────────

    public record ProjectInput(String name, String description, String languagesText,
                               String topics, String readme) {}
    public record ProjectAnalysis(String summary, List<String> howBuilt, List<String> highlights) {}

    public List<ProjectAnalysis> analyzeProjects(List<ProjectInput> projects) {
        if (!configured) throw new LlmException("Bedrock API 키가 설정되지 않았습니다.");
        if (projects.isEmpty()) return List.of();

        StringBuilder sb = new StringBuilder();
        sb.append("""
                당신은 시니어 개발자입니다. 아래 개발자의 주요 GitHub 프로젝트를 분석해, 채용 담당자에게 매력적으로 보이도록 정리하세요.
                README·언어 구성·토픽에 근거해 사실 위주로 작성하되, 단순 나열이 아니라 "무엇을, 어떤 기술로, 어떻게" 만들었는지가 드러나게 하세요.

                각 프로젝트마다:
                - summary: 이 프로젝트가 무엇을 하는지 한국어 2~3문장.
                - howBuilt: "구체적으로 어떤 기술/프레임워크/라이브러리/아키텍처로 개발했는지" 4~6개 항목(각 항목 한 줄). 언어 이름만 말고 실제 사용 기술·접근(예: "Express 미들웨어 체인으로 라우팅 구성", "Redis로 캐싱", "JWT 인증").
                - highlights: 기술적으로 인상적인 포인트 2~3개(간결한 명사구).

                """);
        for (int i = 0; i < projects.size(); i++) {
            ProjectInput p = projects.get(i);
            sb.append("[프로젝트 ").append(i).append("] ").append(p.name()).append("\n")
              .append("설명: ").append(p.description() == null || p.description().isBlank() ? "(없음)" : p.description()).append("\n")
              .append("언어 구성: ").append(p.languagesText()).append("\n")
              .append("토픽: ").append(p.topics() == null ? "" : p.topics()).append("\n");
            if (p.readme() != null && !p.readme().isBlank()) {
                sb.append("README 발췌:\n```\n").append(p.readme()).append("\n```\n");
            }
            sb.append("\n");
        }
        sb.append("""
                반드시 아래 JSON으로만 응답(마크다운/코드펜스 금지, index 정확히 매칭):
                {"results":[{"index":0,"summary":"...","howBuilt":["...","..."],"highlights":["...","..."]}]}
                """);

        String text = invoke(sb.toString(), 6144);
        if (text == null || text.isBlank()) throw new LlmException("Bedrock이 빈 응답을 반환했습니다.");

        String[] summary = new String[projects.size()];
        @SuppressWarnings("unchecked")
        List<String>[] howBuilt = new List[projects.size()];
        @SuppressWarnings("unchecked")
        List<String>[] highlights = new List[projects.size()];
        for (int i = 0; i < projects.size(); i++) { howBuilt[i] = new ArrayList<>(); highlights[i] = new ArrayList<>(); }
        try {
            JsonNode root = mapper.readTree(extractJson(text));
            for (JsonNode r : root.path("results")) {
                int idx = r.path("index").asInt(-1);
                if (idx < 0 || idx >= projects.size()) continue;
                summary[idx] = r.path("summary").asText("");
                for (JsonNode h : r.path("howBuilt")) howBuilt[idx].add(h.asText(""));
                for (JsonNode h : r.path("highlights")) highlights[idx].add(h.asText(""));
            }
        } catch (Exception e) {
            log.warn("프로젝트 분석 JSON 파싱 실패: {}", e.getMessage());
            throw new LlmException("Bedrock 응답을 해석하지 못했습니다.");
        }
        List<ProjectAnalysis> out = new ArrayList<>();
        for (int i = 0; i < projects.size(); i++) {
            out.add(new ProjectAnalysis(summary[i] == null ? "" : summary[i], howBuilt[i], highlights[i]));
        }
        return out;
    }

    /** 단발 텍스트 생성(JSON 아님). 포트폴리오 한줄소개 등에 사용. */
    public String complete(String prompt, int maxTokens) {
        if (!configured) {
            throw new LlmException("Bedrock API 키가 설정되지 않았습니다.");
        }
        return invoke(prompt, maxTokens);
    }

    private String invoke(String prompt) {
        return invoke(prompt, 8192);
    }

    private String invoke(String prompt, int maxTokens) {
        Map<String, Object> body = Map.of(
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(Map.of("text", prompt)))),
                "inferenceConfig", Map.of(
                        "maxTokens", maxTokens,
                        "temperature", 0.5)
        );

        String encoded = URLEncoder.encode(modelId, StandardCharsets.UTF_8);
        URI uri = URI.create("https://bedrock-runtime." + region
                + ".amazonaws.com/model/" + encoded + "/converse");

        try {
            JsonNode resp = client.post()
                    .uri(uri)
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (resp == null) throw new LlmException("Bedrock 응답이 비어 있습니다.");
            // 모델에 따라 content 배열에 reasoningContent 블록이 먼저 올 수 있어 text 블록을 찾는다.
            JsonNode content = resp.path("output").path("message").path("content");
            if (content.isArray()) {
                for (JsonNode block : content) {
                    if (block.has("text")) return block.path("text").asText("");
                }
            }
            return "";

        } catch (RestClientResponseException e) {
            int code = e.getStatusCode().value();
            String reason = extractMessage(e.getResponseBodyAsString());
            log.warn("Bedrock 호출 실패 (HTTP {}): {}", code, reason);
            if (code == 403 || code == 404) {
                throw new LlmException("Bedrock 모델 액세스 오류(" + modelId + "): " + reason);
            }
            if (code == 429) {
                throw new LlmException("Bedrock 요청이 제한(throttle)됐습니다. 잠시 후 다시 시도해 주세요.");
            }
            if (code == 401) {
                throw new LlmException("Bedrock 인증 실패 — API 키가 만료됐거나 올바르지 않습니다.");
            }
            throw new LlmException("Bedrock 호출 실패 (HTTP " + code + "): " + reason);
        } catch (LlmException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Bedrock 호출 예외: {}", e.getMessage());
            throw new LlmException("Bedrock 호출 중 오류: " + e.getMessage());
        }
    }

    private String extractMessage(String responseBody) {
        if (responseBody == null || responseBody.isBlank()) return "(응답 본문 없음)";
        try {
            JsonNode n = mapper.readTree(responseBody);
            String m = n.path("message").asText(null);
            return m != null ? m : responseBody.substring(0, Math.min(200, responseBody.length()));
        } catch (Exception ignore) {
            return responseBody.substring(0, Math.min(200, responseBody.length()));
        }
    }

    private String buildPrompt(RepoContext repo, List<SnippetInput> pool, int targetCount) {
        StringBuilder sb = new StringBuilder();
        sb.append("당신은 시니어 백엔드 면접관입니다. 아래 GitHub 레포와 ").append(pool.size())
          .append("개의 후보 코드 변경(Diff) 중에서, 면접에 가장 유용한 것만 골라 분석하세요.\n\n");
        sb.append("[레포 정보]\n")
          .append("이름: ").append(repo.fullName()).append("\n")
          .append("설명: ").append(repo.description() == null || repo.description().isBlank() ? "(없음)" : repo.description()).append("\n")
          .append("주요 언어: ").append(repo.language()).append("\n");
        if (repo.readmeExcerpt() != null && !repo.readmeExcerpt().isBlank()) {
            sb.append("README 발췌:\n```\n").append(repo.readmeExcerpt()).append("\n```\n");
        }
        sb.append("""

                수행할 작업:
                1) repoSummary: 이 레포가 "무엇을 하는 프로젝트인지" 한국어 2~3문장 요약.
                2) selected: 후보 중 "면접에서 깊이 있는 대화가 가능한 핵심 기술 조각"만 최대 %d개 고르세요.
                   - 우선: 동시성/비동기, 성능 최적화, 알고리즘·자료구조, 트랜잭션/일관성, 캐싱, 인증/보안, 에러 처리, 아키텍처·설계 결정, 비자명한 로직.
                   - 제외: 단순 보일러플레이트 — 구조체·타입·클래스 정의, 변수/필드 선언, 설정/상수, import, 단순 CRUD·게터/세터, 스캐폴딩, 마크업/스타일. (선언만 있고 실제 동작 로직이 없는 조각은 절대 고르지 마세요.) 면접 가치가 낮으면 개수를 채우지 말고 적게 고르세요.
                   - 고른 조각마다:
                     · index: 후보 번호(반드시 정확히).
                     · title: 그 변경 핵심을 한 줄로 요약한 한국어 제목(명사형, 30자 이내).
                     · explanation: 그 코드가 무엇을 왜 하는지 실제 코드에 근거해 한국어 2~3문장.
                     · questions: 그 조각의 실제 코드 라인/결정에 근거한 핵심 면접 질문 2~3개(최대 3개). 가장 변별력 있는 것만. 각 질문에 rationale(면접관 확인 포인트 1문장).

                """.formatted(targetCount));
        for (int i = 0; i < pool.size(); i++) {
            SnippetInput s = pool.get(i);
            sb.append("[후보 ").append(i).append("]\n")
              .append("커밋 메시지: ").append(s.commitMessage()).append("\n")
              .append("파일: ").append(s.fileName()).append("\n")
              .append("Diff:\n```\n").append(s.patch()).append("\n```\n\n");
        }
        sb.append("""
                반드시 아래 JSON 스키마로만 응답하세요. JSON 외 설명/마크다운 코드펜스 금지(index는 후보 번호와 정확히 매칭):
                {"repoSummary":"...","selected":[{"index":0,"title":"한 줄 한글 제목","explanation":"코드 설명","questions":[{"text":"질문","rationale":"면접관 확인 포인트"}]}]}
                """);
        return sb.toString();
    }

    private BatchResult parse(String text, int poolSize, int targetCount) {
        List<SelectedSnippet> out = new ArrayList<>();
        String repoSummary = null;
        try {
            JsonNode root = mapper.readTree(extractJson(text));
            repoSummary = root.path("repoSummary").asText(null);
            JsonNode results = root.path("selected");
            if (!results.isArray()) results = root.path("results"); // 관용
            Set<Integer> seen = new java.util.HashSet<>();
            if (results.isArray()) {
                for (JsonNode r : results) {
                    if (out.size() >= targetCount) break;
                    int idx = r.path("index").asInt(-1);
                    if (idx < 0 || idx >= poolSize || !seen.add(idx)) continue;
                    List<Question> qs = new ArrayList<>();
                    for (JsonNode q : r.path("questions")) {
                        qs.add(new Question(
                                q.path("layer").asText("L1"),
                                q.path("text").asText(""),
                                q.path("rationale").asText("")
                        ));
                    }
                    out.add(new SelectedSnippet(idx, r.path("title").asText(""),
                            r.path("explanation").asText(""), qs));
                }
            }
        } catch (Exception e) {
            log.warn("Bedrock 응답 JSON 파싱 실패: {} / raw='{}'", e.getMessage(),
                    text.length() > 200 ? text.substring(0, 200) : text);
            throw new LlmException("Bedrock 응답을 해석하지 못했습니다.");
        }
        return new BatchResult(repoSummary, out);
    }

    /** 모델이 코드펜스나 잡설을 덧붙여도 첫 '{' ~ 마지막 '}' 구간을 JSON으로 추출한다. */
    private String extractJson(String text) {
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return text.substring(start, end + 1);
        }
        return text;
    }
}
