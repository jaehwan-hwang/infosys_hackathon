package kr.hyu.isd.hackathon.domain.submission;

import jakarta.persistence.*;
import kr.hyu.isd.hackathon.common.BaseTimeEntity;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * 팀별 산출물 제출물. 팀당 1건이며 마감 전까지 계속 덮어쓸 수 있다.
 * 트랙마다 필수 항목이 달라(기획서 5장) 채워지는 필드가 갈린다.
 *
 * Spark 트랙은 구현된 코드 제출이 전면 금지이므로 sourceCodeUrl/deployUrl을
 * 아예 받지 않고, 서버에서도 값이 들어오면 거부한다.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "tb_submission")
public class Submission extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false, unique = true)
    private Team team;

    @Column(name = "project_name", length = 100, nullable = false)
    private String projectName;

    /** 한 줄 요약. 평가 화면에서 팀을 구분하는 기준이 된다. */
    @Column(length = 300, nullable = false)
    private String summary;

    @Column(length = 3000)
    private String description;

    // ---- 공통/Spark ----
    /** 서비스 기획서 (Spark 필수) */
    @Column(name = "plan_file_url", length = 500)
    private String planFileUrl;

    /** 프로토타입 목업·와이어프레임 (Spark 필수) */
    @Column(name = "prototype_url", length = 500)
    private String prototypeUrl;

    // ---- Sprint/Summit ----
    /** 소스코드 아카이브 또는 저장소 링크 (Sprint/Summit 필수) */
    @Column(name = "source_code_url", length = 500)
    private String sourceCodeUrl;

    /** 발표자료 PPT/PDF (Sprint/Summit 필수) */
    @Column(name = "deck_file_url", length = 500)
    private String deckFileUrl;

    /** 핵심 기능 시연 영상·링크 (Sprint 필수) */
    @Column(name = "demo_url", length = 500)
    private String demoUrl;

    // ---- Summit ----
    /** 실제 배포된 서비스 주소 (Summit 필수) */
    @Column(name = "deploy_url", length = 500)
    private String deployUrl;

    /** 시스템 아키텍처 다이어그램 (Summit 필수) */
    @Column(name = "architecture_file_url", length = 500)
    private String architectureFileUrl;

    /** 기술 명세서 (Summit 필수) */
    @Column(name = "tech_spec_file_url", length = 500)
    private String techSpecFileUrl;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "tb_submission_tech_stack", joinColumns = @JoinColumn(name = "submission_id"))
    @Column(name = "tech_stack", length = 50)
    private List<String> techStacks = new ArrayList<>();

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    private Submission(Team team, String projectName, String summary) {
        this.team = team;
        this.projectName = projectName;
        this.summary = summary;
        this.submittedAt = Instant.now();
    }

    public static Submission create(Team team, String projectName, String summary) {
        return new Submission(team, projectName, summary);
    }

    /** 제출 내용을 통째로 갱신하고 제출 시각을 다시 찍는다. */
    public void update(String projectName, String summary, String description,
                       String planFileUrl, String prototypeUrl,
                       String sourceCodeUrl, String deckFileUrl, String demoUrl,
                       String deployUrl, String architectureFileUrl, String techSpecFileUrl,
                       List<String> techStacks) {
        this.projectName = projectName;
        this.summary = summary;
        this.description = description;
        this.planFileUrl = planFileUrl;
        this.prototypeUrl = prototypeUrl;
        this.sourceCodeUrl = sourceCodeUrl;
        this.deckFileUrl = deckFileUrl;
        this.demoUrl = demoUrl;
        this.deployUrl = deployUrl;
        this.architectureFileUrl = architectureFileUrl;
        this.techSpecFileUrl = techSpecFileUrl;
        this.techStacks = techStacks != null ? new ArrayList<>(techStacks) : new ArrayList<>();
        this.submittedAt = Instant.now();
    }

    /**
     * 트랙별 필수 항목이 모두 채워졌는지 검사한다.
     * 미충족 항목명을 돌려주며, 비어 있으면 제출 요건을 만족한 것이다.
     */
    public List<String> findMissingRequirements() {
        List<String> missing = new ArrayList<>();
        Track track = team.getTrack();

        switch (track) {
            case SPARK -> {
                if (isBlank(planFileUrl)) missing.add("서비스 기획서");
                if (isBlank(prototypeUrl)) missing.add("프로토타입");
            }
            case SPRINT -> {
                if (isBlank(sourceCodeUrl)) missing.add("소스코드");
                if (isBlank(deckFileUrl)) missing.add("발표자료");
                if (isBlank(demoUrl)) missing.add("핵심 기능 시연");
            }
            case SUMMIT -> {
                if (isBlank(sourceCodeUrl)) missing.add("소스코드");
                if (isBlank(deckFileUrl)) missing.add("발표자료");
                if (isBlank(deployUrl)) missing.add("배포 링크");
                if (isBlank(architectureFileUrl)) missing.add("시스템 아키텍처 다이어그램");
                if (isBlank(techSpecFileUrl)) missing.add("기술 명세서");
            }
        }
        return missing;
    }

    /** 필수 항목을 모두 채운 제출물인가 */
    public boolean isComplete() {
        return findMissingRequirements().isEmpty();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
