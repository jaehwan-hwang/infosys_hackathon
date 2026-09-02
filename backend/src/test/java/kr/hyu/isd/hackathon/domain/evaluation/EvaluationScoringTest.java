package kr.hyu.isd.hackathon.domain.evaluation;

import kr.hyu.isd.hackathon.domain.team.Track;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 가중 총점 계산 검증.
 *
 * 항목별 만점이 서로 달라도 100점 만점으로 정규화되는지가 핵심이다.
 * 이 값이 틀어지면 트랙 간 비교와 Summit 70:30 합산이 모두 어긋난다.
 */
@DisplayName("평가 가중 총점")
class EvaluationScoringTest {

    private static Criterion criterion(String name, int maxScore, String weight) {
        return Criterion.create(null, Track.SPRINT, EvaluatorType.STUDENT,
                name, null, maxScore, new BigDecimal(weight), 1);
    }

    /** 평가에 점수를 채워 총점을 계산한다. */
    private static BigDecimal totalOf(List<Criterion> criteria, int... scores) {
        Evaluation evaluation = Evaluation.create(null, null, EvaluatorType.STUDENT);
        List<EvaluationScore> entries = new java.util.ArrayList<>();
        for (int i = 0; i < criteria.size(); i++) {
            entries.add(EvaluationScore.create(evaluation, criteria.get(i), scores[i]));
        }
        evaluation.replaceScores(entries, null);
        return evaluation.getTotalScore();
    }

    @Test
    @DisplayName("모든 항목 만점이면 100점이다")
    void perfectScoreIsHundred() {
        List<Criterion> criteria = List.of(
                criterion("동작성", 10, "0.40"),
                criterion("기획 적합성", 10, "0.30"),
                criterion("발표", 10, "0.30"));

        assertThat(totalOf(criteria, 10, 10, 10)).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("모든 항목 0점이면 0점이다")
    void zeroScoreIsZero() {
        List<Criterion> criteria = List.of(
                criterion("동작성", 10, "0.40"),
                criterion("기획 적합성", 10, "0.30"),
                criterion("발표", 10, "0.30"));

        assertThat(totalOf(criteria, 0, 0, 0)).isEqualByComparingTo("0.00");
    }

    @Test
    @DisplayName("항목별 만점이 달라도 비율로 환산된다")
    void differentMaxScoresAreNormalized() {
        // 5점 만점 항목의 5점과 10점 만점 항목의 10점은 똑같이 100% 기여해야 한다
        List<Criterion> criteria = List.of(
                criterion("A", 5, "0.50"),
                criterion("B", 10, "0.50"));

        assertThat(totalOf(criteria, 5, 10)).isEqualByComparingTo("100.00");
    }

    @Test
    @DisplayName("가중치가 큰 항목이 총점에 더 크게 반영된다")
    void heavierWeightMovesScoreMore() {
        List<Criterion> criteria = List.of(
                criterion("무거운 항목", 10, "0.70"),
                criterion("가벼운 항목", 10, "0.30"));

        // 무거운 항목만 만점 → 70점
        assertThat(totalOf(criteria, 10, 0)).isEqualByComparingTo("70.00");
        // 가벼운 항목만 만점 → 30점
        assertThat(totalOf(criteria, 0, 10)).isEqualByComparingTo("30.00");
    }

    @Test
    @DisplayName("부분 점수는 비율만큼 반영된다")
    void partialScoreIsProportional() {
        List<Criterion> criteria = List.of(
                criterion("A", 10, "0.50"),
                criterion("B", 10, "0.50"));

        // (7/10 × 0.5 + 3/10 × 0.5) × 100 = 50.00
        assertThat(totalOf(criteria, 7, 3)).isEqualByComparingTo("50.00");
    }

    @Test
    @DisplayName("재평가하면 이전 점수가 남지 않고 총점이 다시 계산된다")
    void reEvaluationReplacesPreviousScores() {
        List<Criterion> criteria = List.of(criterion("A", 10, "1.00"));
        Evaluation evaluation = Evaluation.create(null, null, EvaluatorType.STUDENT);

        evaluation.replaceScores(
                List.of(EvaluationScore.create(evaluation, criteria.get(0), 10)), null);
        assertThat(evaluation.getTotalScore()).isEqualByComparingTo("100.00");

        evaluation.replaceScores(
                List.of(EvaluationScore.create(evaluation, criteria.get(0), 4)), "다시 봄");

        assertThat(evaluation.getScores()).hasSize(1);
        assertThat(evaluation.getTotalScore()).isEqualByComparingTo("40.00");
        assertThat(evaluation.getComment()).isEqualTo("다시 봄");
    }

    @Test
    @DisplayName("나누어떨어지지 않는 비율도 소수 둘째 자리까지 안정적으로 계산된다")
    void repeatingDecimalIsRounded() {
        List<Criterion> criteria = List.of(criterion("A", 3, "1.00"));

        // 1/3 × 100 = 33.333... → 33.33
        assertThat(totalOf(criteria, 1)).isEqualByComparingTo("33.33");
    }
}
