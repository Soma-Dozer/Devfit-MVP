package com.gitproof.analysis;

import com.gitproof.bedrock.BedrockService;
import com.gitproof.bedrock.LlmException;
import com.gitproof.github.GithubService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.IntConsumer;

/**
 * 면접관용 분석 엔드포인트.
 * 레포 주소 -> 레포 개요 -> 의미 있는 Diff 추출 -> Bedrock(Claude)로 설명·질문 생성 -> 반환.
 * 진행 단계를 실시간으로 보려면 SSE 엔드포인트(/analyze/stream)를 사용한다.
 */
@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final GithubService github;
    private final BedrockService bedrock;

    // 동일 레포의 완전 성공한 분석 결과를 캐시 → 재분석 시 GitHub/LLM 재호출 없이 즉시 반환.
    private final Map<String, AnalyzeResponse> cache = new ConcurrentHashMap<>();
    private final ExecutorService executor = Executors.newCachedThreadPool();

    public AnalysisController(GithubService github, BedrockService bedrock) {
        this.github = github;
        this.bedrock = bedrock;
    }

    public record AnalyzeRequest(String repoUrl, Integer maxSnippets) {}

    public record SnippetResult(
            String commitSha,
            String shortSha,
            String commitMessage,
            String fileName,
            String patch,
            int additions,
            int deletions,
            String htmlUrl,
            String authorName,
            String date,
            String title,
            String explanation,
            List<BedrockService.Question> questions
    ) {}

    public record AnalyzeResponse(
            String repo,
            GithubService.RepoInfo repoInfo,
            String repoSummary,
            int snippetCount,
            List<SnippetResult> snippets,
            String warning) {}

    @PostMapping("/analyze")
    public ResponseEntity<?> analyze(@RequestBody AnalyzeRequest req) {
        try {
            AnalyzeResponse response = doAnalyze(req.repoUrl(), req.maxSnippets(), i -> {});
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "분석 중 오류가 발생했습니다: " + e.getMessage()));
        }
    }

    /**
     * 실시간 진행 단계 SSE. 각 단계가 "실제로" 끝날 때 progress 이벤트를 보낸다.
     * 단계: 0=레포 정보 수집, 1=의미 있는 Diff 추출, 2=코드 설명·질문 생성.
     */
    @GetMapping("/analyze/stream")
    public SseEmitter analyzeStream(@RequestParam String repoUrl,
                                    @RequestParam(required = false) Integer maxSnippets) {
        SseEmitter emitter = new SseEmitter(180_000L);
        executor.submit(() -> {
            try {
                AnalyzeResponse response = doAnalyze(repoUrl, maxSnippets, stage -> {
                    try {
                        emitter.send(SseEmitter.event().name("progress").data(Map.of("done", stage)));
                    } catch (Exception ignore) { /* 클라 연결 종료 시 무시 */ }
                });
                emitter.send(SseEmitter.event().name("result").data(response));
                emitter.complete();
            } catch (IllegalArgumentException e) {
                sendFailed(emitter, 400, e.getMessage());
            } catch (IllegalStateException e) {
                sendFailed(emitter, 429, e.getMessage());
            } catch (Exception e) {
                sendFailed(emitter, 502, "분석 중 오류가 발생했습니다: " + e.getMessage());
            }
        });
        return emitter;
    }

    private void sendFailed(SseEmitter emitter, int status, String message) {
        try {
            emitter.send(SseEmitter.event().name("failed").data(Map.of("status", status, "error", message)));
            emitter.complete();
        } catch (Exception ignore) {
            emitter.completeWithError(new RuntimeException(message));
        }
    }

    /** 핵심 분석 로직. 각 단계가 끝날 때 onStageDone.accept(stageIndex)를 호출한다. */
    private AnalyzeResponse doAnalyze(String repoUrl, Integer maxSnippets, IntConsumer onStageDone) {
        GithubService.Repo repo = github.parse(repoUrl);
        int max = maxSnippets == null ? 5 : Math.max(1, Math.min(8, maxSnippets));

        String cacheKey = repo.full() + "#" + max;
        AnalyzeResponse hit = cache.get(cacheKey);
        if (hit != null) {
            onStageDone.accept(0);
            onStageDone.accept(1);
            onStageDone.accept(2);
            return hit;
        }

        // 1) 레포 정보 수집 (LLM 없이 항상 동작)
        GithubService.RepoInfo repoInfo = github.fetchRepoInfo(repo);
        onStageDone.accept(0);

        // 2) 의미 있는 Diff "후보 풀" 추출 (당사자 커밋 · 핵심 기술 가중치)
        List<GithubService.Snippet> pool = github.extractSnippets(repo, max);
        onStageDone.accept(1);

        // 3) 후보 풀에서 면접에 유용한 핵심 조각만 선별 + 설명·질문 생성 (Bedrock)
        List<BedrockService.SnippetInput> inputs = pool.stream()
                .map(s -> new BedrockService.SnippetInput(s.commitMessage(), s.fileName(), s.patch()))
                .toList();
        BedrockService.RepoContext ctx = new BedrockService.RepoContext(
                repoInfo.fullName(), repoInfo.description(), repoInfo.language(), repoInfo.readmeExcerpt());

        BedrockService.BatchResult batch = null;
        String warning = null;
        try {
            batch = bedrock.generate(ctx, inputs, max);
        } catch (LlmException e) {
            warning = e.getMessage();
        }
        onStageDone.accept(2);

        List<SnippetResult> results = new ArrayList<>();
        if (batch != null && !batch.selected().isEmpty()) {
            for (BedrockService.SelectedSnippet sel : batch.selected()) {
                if (sel.index() < 0 || sel.index() >= pool.size()) continue;
                GithubService.Snippet s = pool.get(sel.index());
                results.add(new SnippetResult(
                        s.commitSha(), s.shortSha(), s.commitMessage(), s.fileName(),
                        s.patch(), s.additions(), s.deletions(), s.htmlUrl(),
                        s.authorName(), s.date(), sel.title(), sel.explanation(), sel.questions()
                ));
            }
        } else {
            // 폴백: LLM 실패 시 풀 상위 max개를 질문 없이 코드 조각만 제공
            for (int i = 0; i < Math.min(max, pool.size()); i++) {
                GithubService.Snippet s = pool.get(i);
                results.add(new SnippetResult(
                        s.commitSha(), s.shortSha(), s.commitMessage(), s.fileName(),
                        s.patch(), s.additions(), s.deletions(), s.htmlUrl(),
                        s.authorName(), s.date(), "", "", List.of()
                ));
            }
        }

        String repoSummary = batch != null ? batch.repoSummary() : null;
        AnalyzeResponse response = new AnalyzeResponse(
                repo.full(), repoInfo, repoSummary, results.size(), results, warning);

        if (warning == null) {
            cache.put(cacheKey, response);
        }
        return response;
    }
}
