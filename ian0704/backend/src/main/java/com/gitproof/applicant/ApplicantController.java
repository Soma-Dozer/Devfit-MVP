package com.gitproof.applicant;

import com.gitproof.bedrock.BedrockService;
import com.gitproof.bedrock.LlmException;
import com.gitproof.github.GithubService;
import com.gitproof.portfolio.PortfolioService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 지원자용 엔드포인트: GitHub 포트폴리오 + 본인 코드 기반 면접 대비.
 */
@RestController
@RequestMapping("/api")
public class ApplicantController {

    private final GithubService github;
    private final BedrockService bedrock;
    private final PortfolioService portfolio;

    public ApplicantController(GithubService github, BedrockService bedrock, PortfolioService portfolio) {
        this.github = github;
        this.bedrock = bedrock;
        this.portfolio = portfolio;
    }

    // ── 포트폴리오 ──────────────────────────────────────────────
    @GetMapping("/portfolio")
    public ResponseEntity<?> getPortfolio(@RequestParam String username) {
        try {
            return ResponseEntity.ok(portfolio.build(username));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "포트폴리오 분석 실패: " + e.getMessage()));
        }
    }

    // ── 면접 대비 ──────────────────────────────────────────────
    public record PrepRequest(String repoUrl, Integer maxSnippets) {}

    public record PrepSnippetResult(
            String commitSha, String shortSha, String commitMessage, String fileName,
            String patch, int additions, int deletions, String htmlUrl,
            String title, String explanation, String question, String answerGuide) {}

    public record PrepResponse(
            String repo,
            GithubService.RepoInfo repoInfo,
            List<BedrockService.PrepTopic> topics,
            int snippetCount,
            List<PrepSnippetResult> snippets,
            String warning) {}

    @PostMapping("/prep")
    public ResponseEntity<?> prep(@RequestBody PrepRequest req) {
        try {
            GithubService.Repo repo = github.parse(req.repoUrl());
            int max = req.maxSnippets() == null ? 5 : Math.max(1, Math.min(8, req.maxSnippets()));
            // 캐시하지 않는다: 매번 중요한 후보군에서 랜덤 샘플링해 새 조각·질문을 생성.

            GithubService.RepoInfo repoInfo = github.fetchRepoInfo(repo);
            List<GithubService.Snippet> pool = github.extractSnippets(repo, max);

            List<BedrockService.SnippetInput> inputs = pool.stream()
                    .map(s -> new BedrockService.SnippetInput(s.commitMessage(), s.fileName(), s.patch()))
                    .toList();
            BedrockService.RepoContext ctx = new BedrockService.RepoContext(
                    repoInfo.fullName(), repoInfo.description(), repoInfo.language(), repoInfo.readmeExcerpt());

            BedrockService.PrepResult prep = null;
            String warning = null;
            try {
                prep = bedrock.generatePrep(ctx, inputs, max);
            } catch (LlmException e) {
                warning = e.getMessage();
            }

            List<PrepSnippetResult> results = new ArrayList<>();
            List<BedrockService.PrepTopic> topics = prep != null ? prep.topics() : List.of();
            if (prep != null && !prep.snippets().isEmpty()) {
                for (BedrockService.PrepSnippet ps : prep.snippets()) {
                    if (ps.index() < 0 || ps.index() >= pool.size()) continue;
                    GithubService.Snippet s = pool.get(ps.index());
                    results.add(new PrepSnippetResult(
                            s.commitSha(), s.shortSha(), s.commitMessage(), s.fileName(),
                            s.patch(), s.additions(), s.deletions(), s.htmlUrl(),
                            ps.title(), ps.explanation(), ps.question(), ps.answerGuide()));
                }
            } else {
                // 폴백: LLM 실패 시 풀 상위 max개를 코드 조각만 제공
                for (int i = 0; i < Math.min(max, pool.size()); i++) {
                    GithubService.Snippet s = pool.get(i);
                    results.add(new PrepSnippetResult(
                            s.commitSha(), s.shortSha(), s.commitMessage(), s.fileName(),
                            s.patch(), s.additions(), s.deletions(), s.htmlUrl(), "", "", "", ""));
                }
            }

            PrepResponse resp = new PrepResponse(
                    repo.full(), repoInfo, topics, results.size(), results, warning);
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(429).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(502).body(Map.of("error", "면접 대비 생성 실패: " + e.getMessage()));
        }
    }
}
