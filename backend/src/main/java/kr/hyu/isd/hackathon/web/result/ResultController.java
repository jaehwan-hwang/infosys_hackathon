package kr.hyu.isd.hackathon.web.result;

import kr.hyu.isd.hackathon.application.result.ResultService;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.web.result.dto.TrackResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 공개 결과. 운영진이 결과를 공개하기 전까지는 403을 돌려준다.
 */
@RestController
@RequestMapping("/api/v1/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @GetMapping
    public ApiResponse<List<TrackResultResponse>> getResults() {
        return ApiResponse.success(resultService.getPublishedResults());
    }
}
