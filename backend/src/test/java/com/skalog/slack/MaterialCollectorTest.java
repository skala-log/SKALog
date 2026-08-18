package com.skalog.slack;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.skalog.material.MaterialKind;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class MaterialCollectorTest {

    @Test
    void tsToKstDate_UTC밤이면_KST로는_다음날() {
        Instant instant = Instant.parse("2026-01-15T20:00:00Z"); // KST 2026-01-16 05:00
        String ts = String.valueOf(instant.getEpochSecond()) + ".000000";

        assertEquals(LocalDate.of(2026, 1, 16), MaterialCollector.tsToKstDate(ts));
    }

    @Test
    void extractCandidates_파일있으면_파일마다_후보하나씩() {
        SlackMessage message = new SlackMessage(
                "1690848000.000100",
                "오늘 자료 올립니다",
                List.of(
                        new SlackMessage.SlackFile("F1", "슬라이드.pdf", "https://files.slack.com/f1", "pdf"),
                        new SlackMessage.SlackFile("F2", "예제.zip", "https://files.slack.com/f2", "zip")));

        List<MaterialCollector.MaterialCandidate> candidates = MaterialCollector.extractCandidates(message);

        assertEquals(2, candidates.size());
        assertEquals("슬라이드.pdf", candidates.get(0).title());
        assertEquals(MaterialKind.FILE, candidates.get(0).kind());
        assertEquals("F1", candidates.get(0).sourceRef());
        assertEquals("https://files.slack.com/f1", candidates.get(0).url());
    }

    @Test
    void extractCandidates_파일없고_URL있으면_링크후보하나() {
        SlackMessage message = new SlackMessage(
                "1690848000.000200", "참고 링크 공유해요 https://example.com/notes 확인해주세요", List.of());

        List<MaterialCollector.MaterialCandidate> candidates = MaterialCollector.extractCandidates(message);

        assertEquals(1, candidates.size());
        assertEquals(MaterialKind.LINK, candidates.get(0).kind());
        assertEquals("https://example.com/notes", candidates.get(0).url());
        assertEquals("1690848000.000200", candidates.get(0).sourceRef());
    }

    @Test
    void extractCandidates_슬랙링크마크업_라벨있으면_라벨을제목으로_URL은순수하게() {
        SlackMessage message = new SlackMessage(
                "1690848000.000400",
                "금일 수업자료입니다. <https://drive.google.com/drive/folders/abc|drive.google.com/…>",
                List.of());

        List<MaterialCollector.MaterialCandidate> candidates = MaterialCollector.extractCandidates(message);

        assertEquals(1, candidates.size());
        assertEquals("https://drive.google.com/drive/folders/abc", candidates.get(0).url());
        assertEquals("drive.google.com/…", candidates.get(0).title());
    }

    @Test
    void extractCandidates_슬랙링크마크업_라벨없으면_URL을제목으로() {
        SlackMessage message = new SlackMessage("1690848000.000500", "<https://example.com/handout.pdf>", List.of());

        List<MaterialCollector.MaterialCandidate> candidates = MaterialCollector.extractCandidates(message);

        assertEquals(1, candidates.size());
        assertEquals("https://example.com/handout.pdf", candidates.get(0).url());
        assertEquals("https://example.com/handout.pdf", candidates.get(0).title());
    }

    @Test
    void extractCandidates_파일도URL도없으면_후보없음() {
        SlackMessage message = new SlackMessage("1690848000.000300", "오늘 수업 재밌었어요", List.of());

        assertTrue(MaterialCollector.extractCandidates(message).isEmpty());
    }
}
