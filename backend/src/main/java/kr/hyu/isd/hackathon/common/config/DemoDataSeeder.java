package kr.hyu.isd.hackathon.common.config;

import kr.hyu.isd.hackathon.application.evaluation.EvaluationService;
import kr.hyu.isd.hackathon.common.auth.DevLoginGate;
import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.Evaluation;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluationScore;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.RecruitStatus;
import kr.hyu.isd.hackathon.domain.team.SelfCheck;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.domain.team.TeamMemberRole;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.domain.user.Role;
import kr.hyu.isd.hackathon.domain.user.User;
import kr.hyu.isd.hackathon.infrastructure.persistence.CriterionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.EvaluationRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.HackathonEventRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.SubmissionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * 로컬 테스트용 가짜 데이터. 테스트 로그인(DevLoginGate)이 열려 있을 때만 돈다 — 운영에서는 돌지 않는다.
 *
 * 상황을 둘 중 하나로 채운다 (DEMO_SCENARIO 환경변수, 기본 live).
 *   - live : 행사 중. 세 트랙 모두 제출·평가가 열려 있고, 테스트 학생 팀은 결과물이 비어 있다.
 *            테스트 학생·교수는 아직 아무도 평가하지 않았다. 리더보드는 Spark만 공개.
 *   - final: 행사 끝. 제출 마감, 평가 마감, 세 트랙 리더보드 모두 공개. 테스트 학생 팀도
 *            결과물을 냈고, 테스트 학생·교수도 평가를 마쳤다.
 *
 * 참가자 표는 실제 규칙대로 넣는다 — 자기 팀은 빼고, Spark 참가자는 Spark 팀만.
 *
 * 테스트 학생 계정이 이미 있으면 아무것도 하지 않는다. 다시 채우려면 로컬 DB 파일을 지운다.
 * 상황마다 DB 파일을 따로 두면 서버만 다시 띄워 오갈 수 있다.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DemoDataSeeder {

    public static final String TEST_STUDENT = "test-student@hanyang.ac.kr"; // Sprint
    public static final String TEST_STUDENT_SPARK = "test-spark@hanyang.ac.kr";
    public static final String TEST_STUDENT_SUMMIT = "test-summit@hanyang.ac.kr";
    private static final Set<String> TEST_STUDENTS = Set.of(TEST_STUDENT, TEST_STUDENT_SPARK, TEST_STUDENT_SUMMIT);
    public static final String TEST_PROFESSOR = "test-professor@hanyang.ac.kr";
    public static final String TEST_ADMIN = "test-admin@hanyang.ac.kr";

    private final DevLoginGate devLoginGate;
    private final HackathonEventRepository eventRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final CriterionRepository criterionRepository;
    private final EvaluationRepository evaluationRepository;
    private final TransactionTemplate transactionTemplate;

    @Value("${app.demo.scenario:live}")
    private String scenario;

    private boolean finished;
    private int studentSeq = 0;

    @Bean
    @Order(3) // 행사를 만드는 DataSeeder(1), 평가표를 맞추는 RubricSync(2) 다음
    public ApplicationRunner seedDemoData() {
        return args -> {
            if (!devLoginGate.isEnabled()) return;
            transactionTemplate.executeWithoutResult(status -> seed());
        };
    }

    private void seed() {
        if (userRepository.findByEmail(TEST_STUDENT).isPresent()) return;
        HackathonEvent event = eventRepository.findFirstByActiveTrueOrderByIdDesc().orElse(null);
        if (event == null) return;
        finished = "final".equalsIgnoreCase(scenario);

        Instant now = Instant.now();
        if (finished) {
            // 2일차 저녁: 제출도 평가도 끝났고, 운영진이 세 트랙 리더보드를 모두 공개했다.
            event.updateSchedule(now.minus(Duration.ofDays(30)), now.minus(Duration.ofDays(10)),
                    now.minus(Duration.ofDays(2)), now.minus(Duration.ofDays(1)), now.minus(Duration.ofHours(3)));
            for (Track t : Track.values()) {
                event.setVotingOpen(t, false);
                event.setResultsPublished(t, true);
            }
        } else {
            // 행사 중: 신청은 끝났고, 세 트랙 모두 제출과 평가가 열려 있다.
            // 리더보드는 Spark만 공개해 두고, 나머지는 운영진 계정으로 공개해 본다.
            event.updateSchedule(now.minus(Duration.ofDays(30)), now.minus(Duration.ofDays(10)),
                    now.minus(Duration.ofDays(1)), now.plus(Duration.ofHours(3)), now.plus(Duration.ofHours(6)));
            for (Track t : Track.values()) event.setVotingOpen(t, true);
            event.setResultsPublished(Track.SPARK, true);
        }

        user(TEST_ADMIN, "테스트 운영진", Role.ADMIN, null);
        User professor = user(TEST_PROFESSOR, "테스트 교수", Role.PROFESSOR, null);
        User profA = user("demo-prof-a@hanyang.ac.kr", "가상 교수 A", Role.PROFESSOR, null);
        User profB = user("demo-prof-b@hanyang.ac.kr", "가상 교수 B", Role.PROFESSOR, null);
        User sprintStudent = user(TEST_STUDENT, "테스트 학생 Sprint", Role.STUDENT, "2021000001");
        User sparkStudent = user(TEST_STUDENT_SPARK, "테스트 학생 Spark", Role.STUDENT, "2021000002");
        User summitStudent = user(TEST_STUDENT_SUMMIT, "테스트 학생 Summit", Role.STUDENT, "2021000003");

        // 팀과 결과물. 트랙마다 테스트 학생이 첫 팀의 팀장이다.
        List<Team> spark = List.of(
                team(event, Track.SPARK, "아이디어공장", "캠퍼스 빈 강의실 찾기", sparkStudent, 0),
                team(event, Track.SPARK, "딸깍랩", "한 번에 끝내는 수강신청 도우미", null, 1),
                team(event, Track.SPARK, "새벽세시", "과제 마감 알림 메이트", null, 2));
        List<Team> sprint = List.of(
                team(event, Track.SPRINT, "버그없는팀", "학식 메뉴 실시간 평점", sprintStudent, 0),
                team(event, Track.SPRINT, "핫픽스", "스터디 매칭 앱", null, 1),
                team(event, Track.SPRINT, "커밋메시지", "동아리 회비 정산기", null, 2));
        List<Team> summit = List.of(
                team(event, Track.SUMMIT, "배포완료", "졸업요건 자동 점검 서비스", summitStudent, 0),
                team(event, Track.SUMMIT, "무중단", "학과 행사 예약 플랫폼", null, 1),
                team(event, Track.SUMMIT, "런칭데이", "중고 전공책 거래 장터", null, 2));
        List<List<Team>> tracks = List.of(spark, sprint, summit);

        // 가짜 참가자들이 매겨 둔 점수. 팀마다 수준을 달리해 순위가 갈리게 한다.
        List<User> voters = new ArrayList<>();
        Map<Long, Track> voterTrack = new HashMap<>();
        for (List<Team> group : tracks) {
            for (Team t : group) {
                t.getMembers().stream()
                        .map(TeamMember::getUser)
                        .filter(u -> u != null && !TEST_STUDENTS.contains(u.getEmail()))
                        .forEach(u -> {
                            voters.add(u);
                            voterTrack.put(u.getId(), t.getTrack());
                        });
            }
        }
        int[][] level = {{5, 4, 3}, {4, 5, 3}, {5, 3, 4}}; // 트랙별, 팀별 기본 점수
        for (int ti = 0; ti < tracks.size(); ti++) {
            List<Team> group = tracks.get(ti);
            for (int i = 0; i < group.size(); i++) {
                Team target = group.get(i);
                int count = 0;
                for (User voter : voters) {
                    if (!canVote(voterTrack.get(voter.getId()), voter, target)) continue;
                    if (count++ >= 5) break; // 팀마다 참가자 표 다섯 장
                    evaluate(event, voter, target, EvaluatorType.STUDENT, level[ti][i], count, null);
                }
            }
        }
        // Summit은 교수 두 분이 미리 매겨 둔다.
        int[] profLevel = {4, 5, 3};
        for (int i = 0; i < summit.size(); i++) {
            evaluate(event, profA, summit.get(i), EvaluatorType.PROFESSOR, profLevel[i], 1,
                    "발표 흐름이 좋았습니다. 운영 시 장애 대응 계획을 보완하면 좋겠습니다.");
            evaluate(event, profB, summit.get(i), EvaluatorType.PROFESSOR, profLevel[i], 2,
                    "핵심 기능 완성도가 인상적입니다.");
        }

        // 행사가 끝난 상황이면 테스트 학생·교수도 평가를 마쳐 둔다.
        if (finished) {
            Map<User, Track> testStudents = Map.of(
                    sparkStudent, Track.SPARK, sprintStudent, Track.SPRINT, summitStudent, Track.SUMMIT);
            testStudents.forEach((student, myTrack) -> {
                for (int ti = 0; ti < tracks.size(); ti++) {
                    for (int i = 0; i < tracks.get(ti).size(); i++) {
                        Team target = tracks.get(ti).get(i);
                        if (canVote(myTrack, student, target)) {
                            evaluate(event, student, target, EvaluatorType.STUDENT, level[ti][i], 3, null);
                        }
                    }
                }
            });
            for (int i = 0; i < summit.size(); i++) {
                evaluate(event, professor, summit.get(i), EvaluatorType.PROFESSOR, profLevel[i], 3,
                        "테스트 교수 코멘트입니다. 서비스 구조 설명이 명확했습니다.");
            }
        }

        log.warn("테스트 데이터를 채웠습니다 (로컬 전용, {}). 학생={}, 교수={}, 운영진={}",
                finished ? "행사 종료 후" : "행사 중", TEST_STUDENTS, professor.getEmail(), TEST_ADMIN);
    }

    /** 실제 평가 규칙과 같다: 자기 팀은 못 하고, Spark 참가자는 Spark 팀만. */
    private static boolean canVote(Track voterTrack, User voter, Team target) {
        return !target.hasMember(voter.getId())
                && EvaluationService.votableTracks(voterTrack).contains(target.getTrack());
    }

    private User user(String email, String name, Role role, String studentId) {
        User user = User.create(email, name, role);
        user.completeProfile(name, studentId != null ? studentId : nextStudentId(),
                "정보시스템학과", "010-0000-0000", true);
        return userRepository.save(user);
    }

    private String nextStudentId() {
        return "20229" + String.format("%05d", ++studentSeq);
    }

    /** 팀 하나와 그 결과물. leader가 없으면 가짜 참가자 셋으로 꾸린다. */
    private Team team(HackathonEvent event, Track track, String name, String project, User leader, int idx) {
        String slug = name.hashCode() < 0 ? "t" + (-name.hashCode()) : "t" + name.hashCode();
        User head = leader != null ? leader
                : user(slug + "-1@hanyang.ac.kr", name + " 팀장", Role.STUDENT, null);
        Team team = Team.create(event, name, head, track, SelfCheck.empty(), RecruitStatus.NONE, null);
        team.addMember(TeamMember.create(team, head, head.getName(), head.getStudentId(), head.getEmail(),
                TeamMemberRole.LEADER, true));
        for (int i = 2; i <= 3; i++) {
            User m = user(slug + "-" + i + "@hanyang.ac.kr", name + " 팀원" + (i - 1), Role.STUDENT, null);
            team.addMember(TeamMember.create(team, m, m.getName(), m.getStudentId(), m.getEmail(),
                    TeamMemberRole.MEMBER, true));
        }
        teamRepository.save(team);
        // 행사 중이면 테스트 학생 팀은 결과물을 비워 둔다 — 트랙별 필수 제출물을 직접 내 볼 수 있게.
        if (leader != null && !finished) return team;

        // 팀마다 낸 자료를 다르게 둔다 — 평가 화면에 "낸 것만" 버튼이 뜨는지 볼 수 있게.
        // 트랙별 필수 항목은 다 채우고(Spark 발표 자료 / Sprint 프로토타입·발표 자료 /
        // Summit 프로덕트·소스코드·발표 자료), 선택 항목은 팀마다 들쭉날쭉하게.
        String deck = "https://example.com/" + slug + "/deck.pdf";
        String plan = null, prototype = null, source = null, demo = null, deploy = null, arch = null, spec = null;
        switch (track) {
            case SPARK -> {
                if (idx == 1) plan = "https://example.com/" + slug + "/plan.pdf";
                if (idx == 2) prototype = "https://www.figma.com/file/example";
            }
            case SPRINT -> {
                prototype = "https://example.com/" + slug + "/prototype";
                if (idx == 1) {
                    source = "https://github.com/example/" + slug;
                    demo = "https://www.youtube.com/watch?v=example";
                }
            }
            case SUMMIT -> {
                deploy = "https://example.com/" + slug;
                source = idx == 2 ? "https://example.com/" + slug + "/source.zip" : "https://github.com/example/" + slug;
                if (idx == 1) {
                    demo = "https://www.youtube.com/watch?v=example";
                    arch = "https://example.com/" + slug + "/architecture.png";
                    spec = "https://example.com/" + slug + "/spec.pdf";
                }
            }
        }
        Submission submission = Submission.create(team, project, project + "를 만들었습니다.");
        submission.update(project, project + "를 만들었습니다.",
                "테스트용 결과물입니다. 실제 팀이 아닙니다.",
                plan, prototype, source, deck, demo, deploy, arch, spec,
                List.of("Next.js", "Spring Boot"));
        submissionRepository.save(submission);
        return team;
    }

    /**
     * 평가 한 장. 항목마다 base 근처에서 조금씩 흔들어 같은 점수만 나오지 않게 한다.
     * 점수는 늘 1~5 안에 둔다.
     */
    private void evaluate(HackathonEvent event, User evaluator, Team target, EvaluatorType type,
                          int base, int jitter, String comment) {
        List<Criterion> criteria = criterionRepository
                .findByEventIdAndTrackAndEvaluatorTypeOrderByDisplayOrderAsc(event.getId(), target.getTrack(), type);
        Evaluation evaluation = Evaluation.create(evaluator, target, type);
        List<EvaluationScore> scores = new ArrayList<>();
        for (int i = 0; i < criteria.size(); i++) {
            int wobble = ((i + jitter) % 3) - 1; // -1, 0, +1
            int score = Math.max(1, Math.min(5, base + wobble));
            scores.add(EvaluationScore.create(evaluation, criteria.get(i), score));
        }
        evaluation.replaceScores(scores, comment);
        evaluationRepository.save(evaluation);
    }
}
