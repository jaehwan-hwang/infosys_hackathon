package kr.hyu.isd.hackathon.domain.evaluation;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.user.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 한 평가자가 한 팀에 매긴 평가 1건.
 *
 * (evaluator, targetTeam) 유니크 제약으로 DB 차원에서 중복 투표를 막는다.
 * 자기 팀 투표 차단은 서비스 계층에서 Team.hasMember()로 검사한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_evaluation", uniqueConstraints = {
        @UniqueConstraint(name = "uk_eval_voter_team", columnNames = {"evaluator_id", "target_team_id"})
})
public class Evaluation extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluation_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "target_team_id", nullable = false)
    private Team targetTeam;

    @Enumerated(EnumType.STRING)
    @Column(name = "evaluator_type", length = 20, nullable = false)
    private EvaluatorType evaluatorType;

    /**
     * 가중 환산 총점 (0~100).
     * 항목마다 (점수/만점 × 가중치 × 100)을 더해 만든다.
     */
    @Column(name = "total_score", nullable = false, precision = 6, scale = 2)
    private BigDecimal totalScore;

    @Column(length = 1000)
    private String comment;

    @Column(name = "evaluated_at", nullable = false)
    private Instant evaluatedAt;

    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationScore> scores = new ArrayList<>();

    private Evaluation(User evaluator, Team targetTeam, EvaluatorType evaluatorType) {
        this.evaluator = evaluator;
        this.targetTeam = targetTeam;
        this.evaluatorType = evaluatorType;
        this.totalScore = BigDecimal.ZERO;
        this.evaluatedAt = Instant.now();
    }

    public static Evaluation create(User evaluator, Team targetTeam, EvaluatorType evaluatorType) {
        return new Evaluation(evaluator, targetTeam, evaluatorType);
    }

    /**
     * 항목 점수를 통째로 갈아끼우고 가중 총점을 다시 계산한다.
     * 재평가(수정 제출) 시에도 같은 경로를 탄다.
     */
    public void replaceScores(List<EvaluationScore> newScores, String comment) {
        this.scores.clear();
        this.scores.addAll(newScores);
        this.comment = comment;
        this.totalScore = calculateWeightedTotal(newScores);
        this.evaluatedAt = Instant.now();
    }

    /**
     * 가중 환산 총점 = Σ (점수 / 항목 만점 × 항목 가중치) ÷ Σ 가중치 × 100
     *
     * 가중치 합으로 나누므로 합이 1이 아니어도 늘 100점 만점이다. 평가표의 배점 합이
     * 100이 아닌 트랙(스프린트·써밋은 110)이 있어서다 — 그대로 더하면 만점이 110이 되어
     * 트랙끼리, 그리고 써밋의 참가자·교수 몫끼리 비교가 어긋난다.
     * 항목별 만점이 달라도 비율로 바꿔 더하므로 상관없다.
     */
    private static BigDecimal calculateWeightedTotal(List<EvaluationScore> scores) {
        BigDecimal weighted = BigDecimal.ZERO;
        BigDecimal weightSum = BigDecimal.ZERO;
        for (EvaluationScore score : scores) {
            Criterion criterion = score.getCriterion();
            BigDecimal ratio = BigDecimal.valueOf(score.getScore())
                    .divide(BigDecimal.valueOf(criterion.getMaxScore()), 6, RoundingMode.HALF_UP);
            weighted = weighted.add(ratio.multiply(criterion.getWeight()));
            weightSum = weightSum.add(criterion.getWeight());
        }
        if (weightSum.signum() == 0) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        return weighted.multiply(BigDecimal.valueOf(100))
                .divide(weightSum, 2, RoundingMode.HALF_UP);
    }
}
