package kr.hyu.isd.hackathon.domain.team;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("자가진단 트랙 배정")
class SelfCheckTest {

    /** 체크리스트 4개만 지정하고 즉시 배정 사유는 모두 false인 자가진단 */
    private static SelfCheck checklist(boolean api, boolean git, boolean course, boolean external) {
        return new SelfCheck(false, false, false, api, git, course, external);
    }

    @Nested
    @DisplayName("즉시 Summit 배정 사유")
    class InstantSummit {

        @Test
        @DisplayName("실무·인턴 경험이 있으면 체크리스트와 무관하게 Summit이다")
        void workExperienceForcesSummit() {
            SelfCheck check = new SelfCheck(true, false, false, false, false, false, false);

            assertThat(check.hasInstantSummitReason()).isTrue();
            assertThat(check.resolveTrack()).isEqualTo(Track.SUMMIT);
            assertThat(check.describeReason()).contains("실무·인턴 경험");
        }

        @Test
        @DisplayName("대회 수상 이력이 있으면 Summit이다")
        void awardHistoryForcesSummit() {
            SelfCheck check = new SelfCheck(false, true, false, false, false, false, false);

            assertThat(check.resolveTrack()).isEqualTo(Track.SUMMIT);
            assertThat(check.describeReason()).contains("개발 대회 수상 이력");
        }

        @Test
        @DisplayName("배포·운영 서비스를 보유하면 Summit이다")
        void liveServiceForcesSummit() {
            SelfCheck check = new SelfCheck(false, false, true, false, false, false, false);

            assertThat(check.resolveTrack()).isEqualTo(Track.SUMMIT);
            assertThat(check.describeReason()).contains("배포·운영 서비스 보유");
        }

        @Test
        @DisplayName("사유가 여러 개면 모두 배정 사유에 적힌다")
        void multipleReasonsAreListed() {
            SelfCheck check = new SelfCheck(true, true, true, false, false, false, false);

            assertThat(check.describeReason())
                    .contains("실무·인턴 경험")
                    .contains("개발 대회 수상 이력")
                    .contains("배포·운영 서비스 보유")
                    // 마지막 항목 뒤에 쉼표가 남지 않아야 한다
                    .doesNotEndWith(", ");
        }
    }

    @Nested
    @DisplayName("체크리스트 임계값")
    class ChecklistThreshold {

        @Test
        @DisplayName("4개 중 3개면 Summit이다")
        void threeOfFourIsSummit() {
            SelfCheck check = checklist(true, true, true, false);

            assertThat(check.checkedCount()).isEqualTo(3);
            assertThat(check.resolveTrack()).isEqualTo(Track.SUMMIT);
        }

        @Test
        @DisplayName("4개 모두면 Summit이다")
        void fourOfFourIsSummit() {
            SelfCheck check = checklist(true, true, true, true);

            assertThat(check.checkedCount()).isEqualTo(4);
            assertThat(check.resolveTrack()).isEqualTo(Track.SUMMIT);
        }

        @Test
        @DisplayName("4개 중 2개면 Sprint다 — 경계 바로 아래")
        void twoOfFourIsSprint() {
            SelfCheck check = checklist(true, true, false, false);

            assertThat(check.checkedCount()).isEqualTo(2);
            assertThat(check.resolveTrack()).isEqualTo(Track.SPRINT);
            assertThat(check.describeReason()).contains("Sprint");
        }

        @Test
        @DisplayName("하나도 해당하지 않으면 Sprint다")
        void noneIsSprint() {
            SelfCheck check = checklist(false, false, false, false);

            assertThat(check.checkedCount()).isZero();
            assertThat(check.resolveTrack()).isEqualTo(Track.SPRINT);
        }

        @Test
        @DisplayName("빈 자가진단은 Sprint다")
        void emptyIsSprint() {
            assertThat(SelfCheck.empty().resolveTrack()).isEqualTo(Track.SPRINT);
        }
    }

    @Nested
    @DisplayName("팀 생성 시 트랙 확정")
    class TeamCreation {

        @Test
        @DisplayName("Spark를 선택하면 자가진단이 Summit이라도 Spark로 확정된다")
        void sparkSelectionOverridesSelfCheck() {
            SelfCheck summitLevel = new SelfCheck(true, true, true, true, true, true, true);

            // Spark는 1일차 전용 아이디어톤이므로 자가진단 대상이 아니다
            assertThat(summitLevel.resolveTrack()).isEqualTo(Track.SUMMIT);
        }

        @Test
        @DisplayName("Spark 트랙은 1일차, Sprint/Summit은 2일차다")
        void trackDays() {
            assertThat(Track.SPARK.getDay()).isEqualTo(1);
            assertThat(Track.SPRINT.getDay()).isEqualTo(2);
            assertThat(Track.SUMMIT.getDay()).isEqualTo(2);
        }
    }
}
