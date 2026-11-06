package kr.hyu.isd.hackathon.common.config;

import kr.hyu.isd.hackathon.domain.evaluation.Criterion;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluationRubric;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.infrastructure.persistence.CriterionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.EvaluationRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.HackathonEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 기동할 때 진행 중인 행사의 평가 항목을 평가표(EvaluationRubric)와 맞춘다.
 *
 * 평가 항목은 DB에 있고 처음 기동 때 임시 항목으로 채워졌다. 평가표가 정해졌으니 그 내용으로
 * 바꿔야 하는데, 운영 DB를 손으로 고치는 대신 배포만 하면 맞춰지게 한다.
 *
 * 평가가 하나라도 들어왔으면 손대지 않는다. 항목을 갈아끼우면 이미 매긴 점수가 가리키는
 * 항목이 사라지고, 같은 팀이 다른 기준으로 매겨진 점수가 섞인다. 그때는 경고만 남긴다.
 * 이미 평가표와 같으면 아무것도 하지 않으므로 몇 번 재배포해도 안전하다.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class RubricSync {

    private final HackathonEventRepository eventRepository;
    private final CriterionRepository criterionRepository;
    private final EvaluationRepository evaluationRepository;

    /** 같은 클래스 안에서 부르는 @Transactional은 프록시를 타지 않아 직접 연다. */
    private final TransactionTemplate transactionTemplate;

    @Bean
    @Order(2) // DataSeeder 다음 — 이미 있는 행사의 평가 항목을 평가표에 맞춘다
    public ApplicationRunner syncRubric() {
        return args -> transactionTemplate.executeWithoutResult(status -> sync());
    }

    private void sync() {
        Optional<HackathonEvent> found = eventRepository.findFirstByActiveTrueOrderByIdDesc();
        if (found.isEmpty()) return;
        HackathonEvent event = found.get();

        List<Criterion> current = criterionRepository.findByEventIdOrderByTrackAscDisplayOrderAsc(event.getId());
        if (matchesRubric(current)) return;

        if (evaluationRepository.existsByEventId(event.getId())) {
            log.warn("평가 항목이 평가표와 다르지만 이미 들어온 평가가 있어 그대로 둡니다. event={}", event.getId());
            return;
        }

        criterionRepository.deleteAll(current);
        criterionRepository.flush();
        List<Criterion> fresh = buildFromRubric(event);
        criterionRepository.saveAll(fresh);
        log.warn("평가 항목을 평가표로 바꿨습니다: {}개 → {}개", current.size(), fresh.size());
    }

    /** 평가표대로 만든 항목 목록. 가중치는 배점/100으로 두고, 총점에서 합으로 나눠 100점으로 맞춘다. */
    public static List<Criterion> buildFromRubric(HackathonEvent event) {
        List<Criterion> result = new ArrayList<>();
        for (Track track : Track.values()) {
            for (EvaluatorType type : EvaluatorType.values()) {
                List<EvaluationRubric.Item> items = EvaluationRubric.itemsFor(track, type);
                for (int i = 0; i < items.size(); i++) {
                    EvaluationRubric.Item item = items.get(i);
                    result.add(Criterion.create(event, track, type, item.question(), null,
                            EvaluationRubric.MAX_SCORE, weightOf(item), i + 1));
                }
            }
        }
        return result;
    }

    private static BigDecimal weightOf(EvaluationRubric.Item item) {
        return BigDecimal.valueOf(item.points()).movePointLeft(2).setScale(3);
    }

    /** 트랙·평가자·순서·문구·만점·가중치까지 모두 같아야 같은 것으로 본다. */
    private static boolean matchesRubric(List<Criterion> current) {
        int expected = 0;
        for (Track track : Track.values()) {
            for (EvaluatorType type : EvaluatorType.values()) {
                List<EvaluationRubric.Item> items = EvaluationRubric.itemsFor(track, type);
                expected += items.size();
                List<Criterion> mine = current.stream()
                        .filter(c -> c.getTrack() == track && c.getEvaluatorType() == type)
                        .sorted((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                        .toList();
                if (mine.size() != items.size()) return false;
                for (int i = 0; i < items.size(); i++) {
                    Criterion c = mine.get(i);
                    EvaluationRubric.Item item = items.get(i);
                    if (!c.getName().equals(item.question())
                            || c.getMaxScore() != EvaluationRubric.MAX_SCORE
                            || c.getWeight().compareTo(weightOf(item)) != 0
                            || c.getDisplayOrder() != i + 1) {
                        return false;
                    }
                }
            }
        }
        return current.size() == expected;
    }
}
