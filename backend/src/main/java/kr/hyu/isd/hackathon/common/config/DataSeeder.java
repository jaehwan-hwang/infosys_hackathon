package kr.hyu.isd.hackathon.common.config;

import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.infrastructure.persistence.CriterionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;


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
    @Order(1) // 맨 먼저 — 행사와 평가 항목이 있어야 나머지가 돈다
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

        // 평가 항목은 평가표(EvaluationRubric) 그대로 넣는다. 이미 돌고 있는 DB는 RubricSync가 맞춘다.
        criterionRepository.saveAll(RubricSync.buildFromRubric(event));

        log.info("기본 평가 항목 {}개 생성", criterionRepository.countByEventId(event.getId()));
    }

}
