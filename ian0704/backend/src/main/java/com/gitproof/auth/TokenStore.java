package com.gitproof.auth;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** 데모용 인메모리 토큰 스토어 (재시작 시 초기화 → 재로그인). */
@Component
public class TokenStore {

    private final Map<String, Long> tokenToUserId = new ConcurrentHashMap<>();

    public String issue(Long userId) {
        String token = UUID.randomUUID().toString().replace("-", "");
        tokenToUserId.put(token, userId);
        return token;
    }

    public Optional<Long> resolve(String token) {
        if (token == null || token.isBlank()) return Optional.empty();
        return Optional.ofNullable(tokenToUserId.get(token));
    }

    public void revoke(String token) {
        if (token != null) tokenToUserId.remove(token);
    }
}
