package com.gitproof.bedrock;

/** LLM(Bedrock) 호출/응답 실패를 사용자 친화적 메시지와 함께 전달한다. */
public class LlmException extends RuntimeException {
    public LlmException(String message) {
        super(message);
    }
}
