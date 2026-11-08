package kr.hyu.isd.hackathon.domain.submission;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TechStackNormalizeTest {

    @Test
    void 여러_구분자로_나누고_긴_항목은_자른다() {
        String longOne = "가".repeat(80);
        List<String> result = Submission.normalizeTechStacks(
                List.of("React / Spring Boot·MySQL\nAWS", "React", longOne, "  ", "Figma;Notion|Slack"));

        assertThat(result).startsWith("React", "Spring Boot", "MySQL", "AWS");
        assertThat(result).contains("Figma", "Notion", "Slack");
        assertThat(result).doesNotHaveDuplicates();
        assertThat(result).allMatch(s -> s.length() <= Submission.TECH_STACK_MAX_LENGTH);
    }
}
