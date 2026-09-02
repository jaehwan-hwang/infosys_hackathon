package kr.hyu.isd.hackathon.application.event;

import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.infrastructure.persistence.CriterionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.HackathonEventRepository;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import kr.hyu.isd.hackathon.web.event.dto.EventResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 활성 행사 조회. 다른 서비스도 현재 행사를 여기서 가져다 쓴다.
 */
@Service
@RequiredArgsConstructor
public class EventService {

    private final HackathonEventRepository eventRepository;
    private final CriterionRepository criterionRepository;

    /** 현재 활성 행사 엔티티. 없으면 예외 */
    @Transactional(readOnly = true)
    public HackathonEvent getActiveEvent() {
        return eventRepository.findFirstByActiveTrueOrderByIdDesc()
                .orElseThrow(() -> new HackathonException(ErrorCode.NO_ACTIVE_EVENT));
    }

    @Transactional(readOnly = true)
    public EventResponse getActiveEventInfo() {
        return EventResponse.from(getActiveEvent());
    }

    /** 평가 기준 전체 목록. 평가 화면과 랜딩의 심사 기준 안내가 함께 쓴다. */
    @Transactional(readOnly = true)
    public List<CriterionResponse> getCriteria() {
        HackathonEvent event = getActiveEvent();
        return criterionRepository.findByEventIdOrderByTrackAscDisplayOrderAsc(event.getId())
                .stream()
                .map(CriterionResponse::from)
                .toList();
    }
}
