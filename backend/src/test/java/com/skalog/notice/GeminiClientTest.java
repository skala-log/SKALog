package com.skalog.notice;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import org.junit.jupiter.api.Test;

class GeminiClientTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void 응답에서_요약_텍스트를_뽑는다() throws Exception {
        String body = """
                {"candidates":[{"content":{"parts":[{"text":"9/7(월) 판교4층 취업캠프 — 자소서 파일 준비\\n"}]}}]}
                """;
        assertEquals("9/7(월) 판교4층 취업캠프 — 자소서 파일 준비", GeminiClient.extractText(mapper.readTree(body)));
    }

    @Test
    void PASS_변형과_빈_답은_PASS로_본다() {
        assertTrue(GeminiClient.isPass("PASS"));
        assertTrue(GeminiClient.isPass("PASS."));
        assertTrue(GeminiClient.isPass("**pass**"));
        assertTrue(GeminiClient.isPass("  "));
        assertFalse(GeminiClient.isPass("9/7(월) 취업캠프 — 자소서 준비"));
        assertFalse(GeminiClient.isPass("PASS 카드 발급 안내"));
    }

    @Test
    void DUP_응답에서_공지_번호를_뽑는다() {
        assertEquals(12L, GeminiClient.parseDup("DUP:12"));
        assertEquals(3L, GeminiClient.parseDup("**DUP:3**"));
        assertEquals(7L, GeminiClient.parseDup("dup: 7."));
        assertNull(GeminiClient.parseDup("PASS"));
        assertNull(GeminiClient.parseDup("DUP:x"));
        assertNull(GeminiClient.parseDup("9/7(월) 취업캠프 — 자소서 준비"));
    }

    @Test
    void 텍스트가_없으면_예외() throws Exception {
        String body = """
                {"candidates":[{"finishReason":"SAFETY"}]}
                """;
        var root = mapper.readTree(body);
        assertThrows(IOException.class, () -> GeminiClient.extractText(root));
    }
}
