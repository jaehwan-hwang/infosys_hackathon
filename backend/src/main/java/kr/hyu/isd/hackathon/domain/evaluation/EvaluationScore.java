package kr.hyu.isd.hackathon.domain.evaluation;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 평가 1건 안의 항목별 점수.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_evaluation_score", uniqueConstraints = {
        @UniqueConstraint(name = "uk_score_eval_criterion", columnNames = {"evaluation_id", "criterion_id"})
})
public class EvaluationScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "evaluation_score_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterion_id", nullable = false)
    private Criterion criterion;

    @Column(nullable = false)
    private int score;

    private EvaluationScore(Evaluation evaluation, Criterion criterion, int score) {
        this.evaluation = evaluation;
        this.criterion = criterion;
        this.score = score;
    }

    public static EvaluationScore create(Evaluation evaluation, Criterion criterion, int score) {
        return new EvaluationScore(evaluation, criterion, score);
    }
}
