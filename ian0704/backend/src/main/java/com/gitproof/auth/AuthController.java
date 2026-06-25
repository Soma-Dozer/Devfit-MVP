package com.gitproof.auth;

import com.gitproof.user.Role;
import com.gitproof.user.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    public record UserDto(Long id, String email, String name, String role, String githubUsername) {
        static UserDto of(User u) {
            return new UserDto(u.getId(), u.getEmail(), u.getName(), u.getRole().name(), u.getGithubUsername());
        }
    }

    public record SignupRequest(String email, String password, String name, String role, String githubUsername) {}
    public record LoginRequest(String email, String password) {}
    public record GithubRequest(String githubUsername) {}

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
        try {
            Role role = parseRole(req.role());
            AuthService.AuthResult r = auth.signup(req.email(), req.password(), req.name(), role, req.githubUsername());
            return ResponseEntity.ok(Map.of("token", r.token(), "user", UserDto.of(r.user())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            AuthService.AuthResult r = auth.login(req.email(), req.password());
            return ResponseEntity.ok(Map.of("token", r.token(), "user", UserDto.of(r.user())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader(value = "Authorization", required = false) String authz) {
        try {
            return ResponseEntity.ok(Map.of("user", UserDto.of(auth.requireUser(authz))));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    /** 지원자가 자신의 GitHub username을 등록/수정. */
    @PostMapping("/github")
    public ResponseEntity<?> setGithub(@RequestHeader(value = "Authorization", required = false) String authz,
                                       @RequestBody GithubRequest req) {
        try {
            User u = auth.requireUser(authz);
            User updated = auth.updateGithub(u, req.githubUsername());
            return ResponseEntity.ok(Map.of("user", UserDto.of(updated)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(401).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authz) {
        auth.logout(authz);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private Role parseRole(String role) {
        if (role == null) return Role.APPLICANT;
        try {
            return Role.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("역할은 applicant 또는 interviewer여야 합니다.");
        }
    }
}
