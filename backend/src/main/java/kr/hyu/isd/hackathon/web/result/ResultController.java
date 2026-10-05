package kr.hyu.isd.hackathon.web.result;

import kr.hyu.isd.hackathon.application.result.ResultService;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.web.result.dto.PublicTrackResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 참가자가 보는 리더보드.
 *
 * 로그인 없이 열리지만, 공개하지 않은 트랙은 빈 칸으로만 내려간다.
 */
@RestController
@RequestMapping("/api/v1/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;

    @GetMapping
    public ApiResponse<List<PublicTrackResultResponse>> getResults() {
        return ApiResponse.success(resultService.getPublishedResults());
    }
}
