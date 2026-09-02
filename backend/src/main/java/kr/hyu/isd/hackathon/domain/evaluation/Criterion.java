package kr.hyu.isd.hackathon.domain.evaluation;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Track;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * 트랙별 평가 기준 한 항목. 기획서 2장의 "평가 중점"이 이 테이블의 행이 된다.
 * 평가자 유형(학생/교수)별로 다른 기준을 둘 수 있어 evaluatorType으로 구분한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_criterion")
public class Criterion extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "criterion_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private HackathonEvent event;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private Track track;

    /** 이 기준으로 채점하는 평가자 유형 */
    @Enumerated(EnumType.STRING)
    @Column(name = "evaluator_type", length = 20, nullable = false)
    private EvaluatorType evaluatorType;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 300)
    private String description;

    /** 이 항목의 만점 */
    @Column(name = "max_score", nullable = false)
    private int maxScore;

    /** 항목 가중치. 트랙 내 합이 1.0이 되도록 운영진이 설정한다. */
    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal weight;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    private Criterion(HackathonEvent event, Track track, EvaluatorType evaluatorType,
                      String name, String description, int maxScore,
                      BigDecimal weight, int displayOrder) {
        this.event = event;
        this.track = track;
        this.evaluatorType = evaluatorType;
        this.name = name;
        this.description = description;
        this.maxScore = maxScore;
        this.weight = weight;
        this.displayOrder = displayOrder;
    }

    public static Criterion create(HackathonEvent event, Track track, EvaluatorType evaluatorType,
                                   String name, String description, int maxScore,
                                   BigDecimal weight, int displayOrder) {
        return new Criterion(event, track, evaluatorType, name, description,
                maxScore, weight, displayOrder);
    }

    public void update(String name, String description, int maxScore,
                       BigDecimal weight, int displayOrder) {
        this.name = name;
        this.description = description;
        this.maxScore = maxScore;
        this.weight = weight;
        this.displayOrder = displayOrder;
    }
}
