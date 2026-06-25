package com.gitproof.applicant;

import com.gitproof.portfolio.PortfolioService;
import com.gitproof.user.Role;
import com.gitproof.user.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 누구나(면접관 포함) 볼 수 있는 지원자 생태계 — GitHub를 등록한 지원자 목록.
 * 기술 스택 필터를 위해 각 후보의 상위 언어를 함께 제공한다.
 */
@RestController
@RequestMapping("/api")
public class CandidatesController {

    private final UserRepository users;
    private final PortfolioService portfolio;

    public CandidatesController(UserRepository users, PortfolioService portfolio) {
        this.users = users;
        this.portfolio = portfolio;
    }

    public record Candidate(Long id, String name, String githubUsername, List<String> languages) {}

    @GetMapping("/applicants")
    public List<Candidate> applicants() {
        return users.findByRoleAndGithubUsernameIsNotNullOrderByCreatedAtDesc(Role.APPLICANT)
                .stream()
                .map(u -> new Candidate(
                        u.getId(), u.getName(), u.getGithubUsername(),
                        portfolio.techStack(u.getGithubUsername())))
                .toList();
    }
}
