package com.skalog.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.skalog.user.SlackDisplayNameParser.ParsedSlackName;
import org.junit.jupiter.api.Test;

class SlackDisplayNameParserTest {

    @Test
    void parsesCampusClassAndName() {
        ParsedSlackName parsed = SlackDisplayNameParser.parse("판교_1반_탁연우");

        assertEquals("판교", parsed.campus());
        assertEquals("1반", parsed.className());
        assertEquals("탁연우", parsed.personName());
    }

    @Test
    void ignoresExtraPrefixParts() {
        ParsedSlackName parsed = SlackDisplayNameParser.parse("4기_판교_1반_김동현");

        assertEquals("판교", parsed.campus());
        assertEquals("1반", parsed.className());
        assertEquals("김동현", parsed.personName());
    }

    @Test
    void rejectsNamesWithoutThreeParts() {
        assertThrows(IllegalArgumentException.class, () -> SlackDisplayNameParser.parse("탁연우"));
        assertThrows(IllegalArgumentException.class, () -> SlackDisplayNameParser.parse("판교_탁연우"));
        assertThrows(IllegalArgumentException.class, () -> SlackDisplayNameParser.parse(""));
        assertThrows(IllegalArgumentException.class, () -> SlackDisplayNameParser.parse(null));
    }
}
