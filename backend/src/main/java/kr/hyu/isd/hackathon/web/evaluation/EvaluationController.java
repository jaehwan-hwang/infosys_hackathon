package kr.hyu.isd.hackathon.web.evaluation;

import jakarta.validation.Valid;
import kr.hyu.isd.hackathon.application.evaluation.EvaluationService;
import kr.hyu.isd.hackathon.common.auth.AuthPrincipal;
import kr.hyu.isd.hackathon.common.auth.CurrentUser;
import kr.hyu.isd.hackathon.common.dto.response.ApiResponse;
import kr.hyu.isd.hackathon.domain.evaluation.EvaluatorType;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.web.evaluation.dto.EvaluationRequest;
import kr.hyu.isd.hackathon.web.evaluation.dto.EvaluationResponse;
import kr.hyu.isd.hackathon.web.evaluation.dto.EvaluationTargetResponse;
import kr.hyu.isd.hackathon.web.event.dto.CriterionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 학생 투표와 교수 평가.
 *
 * 평가자 유형을 요청 본문이 아니라 경로로 가른다.
 * 본문 값으로 받으면 학생이 교수 유형을 지정해 보내는 위조가 가능해지고,
 * 경로로 가르면 SecurityConfig의 역할 검사가 그대로 방어선이 된다.
 */
@RestController
@RequestMapping("/api/v1/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    // ---- 학생 투표 ----

    /** 내가 평가할 팀 목록 (내 트랙, 자기 팀 제외) */
    @GetMapping("/targets")
    public ApiResponse<List<EvaluationTargetResponse>> getStudentTargets(
            @CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(
                evaluationService.getTargets(principal.userId(), EvaluatorType.STUDENT));
    }

    /** 학생 투표 제출. 같은 팀을 다시 내면 덮어쓴다. */
    @PostMapping
    public ApiResponse<EvaluationResponse> evaluateAsStudent(
            @CurrentUser AuthPrincipal principal,
            @Valid @RequestBody EvaluationRequest request) {
        return ApiResponse.success(
                evaluationService.evaluate(principal.userId(), request, EvaluatorType.STUDENT));
    }

    /** 내가 제출한 평가 목록 */
    @GetMapping("/me")
    public ApiResponse<List<EvaluationResponse>> getMyEvaluations(
            @CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(evaluationService.getMyEvaluations(principal.userId()));
    }

    // ---- 교수 평가 (Summit 전용) ----

    /** 교수가 평가할 Summit 팀 목록 */
    @GetMapping("/professor/targets")
    public ApiResponse<List<EvaluationTargetResponse>> getProfessorTargets(
            @CurrentUser AuthPrincipal principal) {
        return ApiResponse.success(
                evaluationService.getTargets(principal.userId(), EvaluatorType.PROFESSOR));
    }

    /** 교수 평가 제출 */
    @PostMapping("/professor")
    public ApiResponse<EvaluationResponse> evaluateAsProfessor(
            @CurrentUser AuthPrincipal principal,
            @Valid @RequestBody EvaluationRequest request) {
        return ApiResponse.success(
                evaluationService.evaluate(principal.userId(), request, EvaluatorType.PROFESSOR));
    }

    // ---- 공통 ----

    /** 평가 화면에 뿌릴 항목 목록 */
    @GetMapping("/criteria")
    public ApiResponse<List<CriterionResponse>> getCriteria(
            @RequestParam Track track,
            @RequestParam(defaultValue = "STUDENT") EvaluatorType evaluatorType) {
        return ApiResponse.success(evaluationService.getCriteria(track, evaluatorType));
    }
}
