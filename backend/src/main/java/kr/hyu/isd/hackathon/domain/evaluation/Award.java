package kr.hyu.isd.hackathon.domain.evaluation;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.team.Team;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 트랙별 수상 내역. 집계 결과를 보고 운영진이 확정해 등록한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_award")
public class Award extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "award_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    /** 예: "대상", "최우수상" */
    @Column(name = "award_name", length = 60, nullable = false)
    private String awardName;

    /** 트랙 내 순위. 1이 최상위 */
    @Column(name = "award_rank")
    private Integer awardRank;

    private Award(Team team, String awardName, Integer awardRank) {
        this.team = team;
        this.awardName = awardName;
        this.awardRank = awardRank;
    }

    public static Award create(Team team, String awardName, Integer awardRank) {
        return new Award(team, awardName, awardRank);
    }

    public void update(String awardName, Integer awardRank) {
        this.awardName = awardName;
        this.awardRank = awardRank;
    }
}
