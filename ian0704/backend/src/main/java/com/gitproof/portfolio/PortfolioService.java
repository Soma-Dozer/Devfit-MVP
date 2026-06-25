package com.gitproof.portfolio;

import com.gitproof.bedrock.BedrockService;
import com.gitproof.github.GithubService;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * GitHub username으로 지원자 포트폴리오를 구성한다.
 * 프로필 + 기술 스택(언어 집계) + 대표 프로젝트 + 활동 통계 + AI 한줄 소개.
 */
@Service
public class PortfolioService {

    private final GithubService github;
    private final BedrockService bedrock;
    private final Map<String, Portfolio> cache = new ConcurrentHashMap<>();
    private final Map<String, List<String>> langCache = new ConcurrentHashMap<>();

    public PortfolioService(GithubService github, BedrockService bedrock) {
        this.github = github;
        this.bedrock = bedrock;
    }

    public record LangStat(String name, int count) {}

    public record Project(String name, String description, String language,
                          int stars, int forks, String htmlUrl, List<String> topics) {}

    public record LangBytes(String name, long bytes) {}

    public record DeepProject(
            String name, String description, String htmlUrl, int stars, String language,
            List<LangBytes> languages, String summary, List<String> howBuilt, List<String> highlights) {}

    public record Portfolio(
            GithubService.GhUser user,
            int totalStars,
            String topLanguage,
            List<LangStat> languages,
            List<Project> topProjects,
            List<DeepProject> deepProjects,
            String aiIntro) {}

    /** 후보 목록 필터용 — 상위 기술 스택만 (LLM 호출 없음). 실패 시 빈 목록. */
    public List<String> techStack(String username) {
        String key = username.toLowerCase();
        Portfolio cached = cache.get(key);
        if (cached != null) return cached.languages().stream().map(LangStat::name).toList();
        List<String> hit = langCache.get(key);
        if (hit != null) return hit;
        try {
            Map<String, Integer> langCount = new LinkedHashMap<>();
            for (GithubService.GhRepo r : github.fetchUserRepos(username)) {
                if (r.fork() || r.language() == null || r.language().isBlank()) continue;
                langCount.merge(r.language(), 1, Integer::sum);
            }
            List<String> langs = langCount.entrySet().stream()
                    .sorted((a, b) -> b.getValue() - a.getValue())
                    .limit(6)
                    .map(Map.Entry::getKey)
                    .toList();
            langCache.put(key, langs);
            return langs;
        } catch (Exception e) {
            return List.of();
        }
    }

    public Portfolio build(String username) {
        String key = username.toLowerCase();
        Portfolio cached = cache.get(key);
        if (cached != null) return cached;

        GithubService.GhUser user = github.fetchUserProfile(username);
        List<GithubService.GhRepo> repos = github.fetchUserRepos(username);

        // 언어 집계 (fork 제외)
        Map<String, Integer> langCount = new LinkedHashMap<>();
        int totalStars = 0;
        for (GithubService.GhRepo r : repos) {
            if (r.fork()) continue;
            totalStars += r.stars();
            if (r.language() != null && !r.language().isBlank()) {
                langCount.merge(r.language(), 1, Integer::sum);
            }
        }
        List<LangStat> languages = langCount.entrySet().stream()
                .sorted((a, b) -> b.getValue() - a.getValue())
                .limit(8)
                .map(e -> new LangStat(e.getKey(), e.getValue()))
                .toList();
        String topLanguage = languages.isEmpty() ? "" : languages.get(0).name();

        // 대표 프로젝트: fork 아닌 것 우선, 스타 내림차순
        List<Project> topProjects = repos.stream()
                .filter(r -> !r.fork())
                .sorted((a, b) -> b.stars() - a.stars())
                .limit(6)
                .map(r -> new Project(r.name(), r.description(), r.language(),
                        r.stars(), r.forks(), r.htmlUrl(), r.topics()))
                .toList();

        String aiIntro = buildAiIntro(user, topLanguage, languages, topProjects);

        // 주 프로젝트 1~2개 심층 분석 (언어 바이트 차트 + 무엇을·어떻게 만들었는지)
        List<DeepProject> deepProjects = buildDeepProjects(user.login(), topProjects);

        Portfolio p = new Portfolio(user, totalStars, topLanguage, languages, topProjects, deepProjects, aiIntro);
        cache.put(key, p);
        return p;
    }

    private List<DeepProject> buildDeepProjects(String owner, List<Project> topProjects) {
        try {
            List<Project> picks = topProjects.stream().limit(2).toList();
            if (picks.isEmpty()) return List.of();

            // 각 프로젝트의 언어 바이트 구성 수집 (차트용)
            List<List<LangBytes>> langsList = new ArrayList<>();
            List<BedrockService.ProjectInput> inputs = new ArrayList<>();
            for (Project pr : picks) {
                Map<String, Long> langs = github.fetchRepoLanguages(owner, pr.name());
                List<LangBytes> lb = langs.entrySet().stream()
                        .map(e -> new LangBytes(e.getKey(), e.getValue())).toList();
                langsList.add(lb);
                String langsText = lb.stream().map(LangBytes::name).collect(Collectors.joining(", "));
                String readme = github.fetchReadmeExcerpt(owner, pr.name());
                inputs.add(new BedrockService.ProjectInput(
                        pr.name(), pr.description(), langsText, String.join(", ", pr.topics()), readme));
            }

            List<BedrockService.ProjectAnalysis> analyses = bedrock.analyzeProjects(inputs);

            List<DeepProject> out = new ArrayList<>();
            for (int i = 0; i < picks.size(); i++) {
                Project pr = picks.get(i);
                BedrockService.ProjectAnalysis a = i < analyses.size() ? analyses.get(i) : null;
                out.add(new DeepProject(
                        pr.name(), pr.description(), pr.htmlUrl(), pr.stars(), pr.language(),
                        langsList.get(i),
                        a != null ? a.summary() : "",
                        a != null ? a.howBuilt() : List.of(),
                        a != null ? a.highlights() : List.of()));
            }
            return out;
        } catch (Exception e) {
            // 심층 분석 실패는 포트폴리오 전체를 막지 않는다(기본 정보는 그대로).
            return List.of();
        }
    }

    private String buildAiIntro(GithubService.GhUser user, String topLanguage,
                                List<LangStat> languages, List<Project> projects) {
        try {
            String langs = languages.stream().map(LangStat::name).collect(Collectors.joining(", "));
            String projs = projects.stream()
                    .map(p -> "- " + p.name() + (p.description().isBlank() ? "" : ": " + p.description())
                            + " (" + p.language() + ", ★" + p.stars() + ")")
                    .collect(Collectors.joining("\n"));
            String prompt = """
                    아래 개발자의 GitHub 활동을 보고, 채용 담당자가 한눈에 파악할 수 있는 한국어 2~3문장 소개를 작성하세요.
                    과장 없이 사실 기반으로, 주력 기술과 대표 작업을 자연스럽게 녹여서. JSON이나 머리말 없이 소개 문장만 출력하세요.

                    이름: %s
                    bio: %s
                    주력 언어: %s
                    사용 언어: %s
                    대표 프로젝트:
                    %s
                    """.formatted(
                    user.name().isBlank() ? user.login() : user.name(),
                    user.bio(), topLanguage, langs, projs);
            return bedrock.complete(prompt, 512).trim();
        } catch (Exception e) {
            return null; // 실패해도 포트폴리오는 표시
        }
    }
}
