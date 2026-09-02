package kr.hyu.isd.hackathon.web.event;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import kr.hyu.isd.hackathon.web.event.dto.EventResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/event")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    /** 현재 해커톤 행사 정보. 로그인 없이 랜딩 페이지가 읽는다. */
    @GetMapping
    public ApiResponse<EventResponse> getEvent() {
        return ApiResponse.success(eventService.getActiveEventInfo());
    }

    /** 트랙별 평가 기준 */
    @GetMapping("/criteria")
    public ApiResponse<List<CriterionResponse>> getCriteria() {
        return ApiResponse.success(eventService.getCriteria());
    }
}
