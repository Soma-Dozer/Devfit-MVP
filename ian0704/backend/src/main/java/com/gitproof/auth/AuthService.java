package com.gitproof.auth;

import com.gitproof.user.Role;
import com.gitproof.user.User;
import com.gitproof.user.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository users;
    private final TokenStore tokens;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository users, TokenStore tokens) {
        this.users = users;
        this.tokens = tokens;
    }

    public record AuthResult(String token, User user) {}

    public AuthResult signup(String email, String password, String name, Role role, String githubUsername) {
        if (email == null || email.isBlank() || password == null || password.length() < 4) {
            throw new IllegalArgumentException("이메일과 4자 이상의 비밀번호를 입력해 주세요.");
        }
        if (users.existsByEmail(email)) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }
        String displayName = (name == null || name.isBlank())
                ? email.split("@")[0] : name;
        String gh = (githubUsername == null || githubUsername.isBlank()) ? null
                : githubUsername.trim().replaceFirst("^https?://github\\.com/", "").replaceFirst("/+$", "");
        User saved = users.save(new User(email, encoder.encode(password), displayName, role, gh));
        return new AuthResult(tokens.issue(saved.getId()), saved);
    }

    public AuthResult login(String email, String password) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));
        if (!encoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return new AuthResult(tokens.issue(user.getId()), user);
    }

    public User requireUser(String bearer) {
        String token = stripBearer(bearer);
        Long uid = tokens.resolve(token)
                .orElseThrow(() -> new IllegalStateException("로그인이 필요합니다."));
        return users.findById(uid)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다."));
    }

    public User updateGithub(User user, String githubUsername) {
        String gh = (githubUsername == null || githubUsername.isBlank()) ? null
                : githubUsername.trim().replaceFirst("^https?://github\\.com/", "").replaceFirst("/+$", "");
        user.setGithubUsername(gh);
        return users.save(user);
    }

    public void logout(String bearer) {
        tokens.revoke(stripBearer(bearer));
    }

    private String stripBearer(String header) {
        if (header == null) return null;
        return header.startsWith("Bearer ") ? header.substring(7) : header;
    }
}
