package kr.hyu.isd.hackathon.common.config;

import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.infrastructure.persistence.CriterionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * 최초 기동 시 활성 행사와 트랙별 기본 평가 항목을 만들어 둔다.
 *
 * 이미 행사가 있으면 아무것도 하지 않으므로, 운영 중 재배포해도 데이터가 덮이지 않는다.
 * 평가 항목은 기획서 2장의 "평가 중점"을 그대로 옮긴 것이며,
 * 운영진이 대시보드에서 얼마든지 수정할 수 있는 출발점일 뿐이다.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataSeeder {

    private final HackathonEventRepository eventRepository;
    private final CriterionRepository criterionRepository;

    @Bean
    public ApplicationRunner seedInitialData() {
        return args -> seed();
    }

    @Transactional
    protected void seed() {
        if (eventRepository.findFirstByActiveTrueOrderByIdDesc().isPresent()) {
            return;
        }

        HackathonEvent event = eventRepository.save(
                HackathonEvent.create("정보시스템학과 해커톤"));
        log.info("초기 행사 생성: id={}", event.getId());

        seedSparkCriteria(event);
        seedSprintCriteria(event);
        seedSummitStudentCriteria(event);
        seedSummitProfessorCriteria(event);

        log.info("기본 평가 항목 {}개 생성", criterionRepository.countByEventId(event.getId()));
    }

    /** Spark — 학생 투표 100% */
    private void seedSparkCriteria(HackathonEvent event) {
        save(event, Track.SPARK, EvaluatorType.STUDENT, 1,
                "문제 정의 및 타당성", "해결하려는 문제가 분명하고 설득력 있는가", "0.35");
        save(event, Track.SPARK, EvaluatorType.STUDENT, 2,
                "UI/UX 완성도", "프로토타입의 사용자 흐름과 화면 설계가 충실한가", "0.35");
        save(event, Track.SPARK, EvaluatorType.STUDENT, 3,
                "서비스 실현 가능성", "실제로 만들어질 수 있는 기획인가", "0.30");
    }

    /** Sprint — 학생 투표 100% */
    private void seedSprintCriteria(HackathonEvent event) {
        save(event, Track.SPRINT, EvaluatorType.STUDENT, 1,
                "핵심 기능 동작성", "의도한 핵심 기능이 실제로 동작하는가", "0.40");
        save(event, Track.SPRINT, EvaluatorType.STUDENT, 2,
                "기획 적합성 및 UX", "만든 기능이 기획한 문제를 실제로 푸는가", "0.30");
        save(event, Track.SPRINT, EvaluatorType.STUDENT, 3,
                "발표 및 코드 이해도", "팀이 자신의 결과물을 정확히 설명하는가", "0.30");
    }

    /** Summit — 학생 투표 30% 몫에 쓰이는 항목 */
    private void seedSummitStudentCriteria(HackathonEvent event) {
        save(event, Track.SUMMIT, EvaluatorType.STUDENT, 1,
                "서비스 완성도", "사용자 입장에서 완결된 서비스로 느껴지는가", "0.50");
        save(event, Track.SUMMIT, EvaluatorType.STUDENT, 2,
                "발표", "결과물과 기술 선택을 설득력 있게 전달했는가", "0.50");
    }

    /** Summit — 교수 평가 70% 몫에 쓰이는 항목 */
    private void seedSummitProfessorCriteria(HackathonEvent event) {
        save(event, Track.SUMMIT, EvaluatorType.PROFESSOR, 1,
                "기술적 난이도 및 완성도", "구현 난이도와 마감 수준", "0.30");
        save(event, Track.SUMMIT, EvaluatorType.PROFESSOR, 2,
                "시스템 아키텍처 및 안정성", "구조 설계의 타당성과 운영 안정성", "0.30");
        save(event, Track.SUMMIT, EvaluatorType.PROFESSOR, 3,
                "서비스 완성도 및 상용화 가능성", "실제 서비스로 이어질 수 있는가", "0.25");
        save(event, Track.SUMMIT, EvaluatorType.PROFESSOR, 4,
                "발표", "기술적 의사결정을 명확히 설명했는가", "0.15");
    }

    private void save(HackathonEvent event, Track track, EvaluatorType type,
                      int order, String name, String description, String weight) {
        criterionRepository.save(Criterion.create(
                event, track, type, name, description, 10, new BigDecimal(weight), order));
    }
}
