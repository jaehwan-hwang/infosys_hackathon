package kr.hyu.isd.hackathon.application.submission;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.application.storage.StorageService;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.Track;
import kr.hyu.isd.hackathon.infrastructure.persistence.SubmissionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.web.submission.dto.SubmissionRequest;
import kr.hyu.isd.hackathon.web.submission.dto.SubmissionResponse;
import kr.hyu.isd.hackathon.web.submission.dto.UploadResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

/**
 * 산출물 제출.
 *
 * 마감 판정은 언제나 서버 시계로 한다. 프론트가 카운트다운을 보여주더라도
 * 실제 잠금은 여기서만 일어나므로, 클라이언트 시계를 조작해도 마감 후 제출은 통과하지 못한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final TeamRepository teamRepository;
    private final StorageService storageService;
    private final EventService eventService;

    /**
     * 제출물을 저장한다. 팀당 1건이며 마감 전까지 계속 덮어쓸 수 있다.
     * 조장만 제출할 수 있다.
     */
    @Transactional
    public SubmissionResponse submit(Long userId, SubmissionRequest request) {
        Team team = findMyTeam(userId);
        requireLeader(team, userId);
        requireSubmissionOpen(team);

        // Spark 트랙은 구현된 코드·구동 프로그램 제출이 전면 금지다(기획서 2장).
        if (team.getTrack() == Track.SPARK
                && (notBlank(request.sourceCodeUrl()) || notBlank(request.deployUrl()))) {
            throw new HackathonException(ErrorCode.SOURCE_CODE_FORBIDDEN);
        }

        Submission submission = submissionRepository.findByTeamId(team.getId())
                .orElseGet(() -> submissionRepository.save(
                        Submission.create(team, request.projectName(), request.summary())));

        submission.update(
                request.projectName(),
                request.summary(),
                request.description(),
                request.planFileUrl(),
                request.prototypeUrl(),
                request.sourceCodeUrl(),
                request.deckFileUrl(),
                request.demoUrl(),
                request.deployUrl(),
                request.architectureFileUrl(),
                request.techSpecFileUrl(),
                request.techStacks()
        );

        log.info("제출 저장: team={}, track={}, complete={}",
                team.getName(), team.getTrack(), submission.isComplete());

        return SubmissionResponse.from(submission);
    }

    /**
     * 제출물을 최종 확정한다. 필수 항목이 하나라도 비어 있으면 거부한다.
     *
     * 저장(submit)과 확정을 나눈 이유는, 마감 직전까지 부분 저장을 허용하되
     * "다 냈다"는 상태는 요건을 만족할 때만 만들어지도록 하기 위해서다.
     */
    @Transactional
    public SubmissionResponse finalizeSubmission(Long userId) {
        Team team = findMyTeam(userId);
        requireLeader(team, userId);
        requireSubmissionOpen(team);

        Submission submission = submissionRepository.findByTeamId(team.getId())
                .orElseThrow(() -> new HackathonException(ErrorCode.SUBMISSION_NOT_FOUND));

        List<String> missing = submission.findMissingRequirements();
        if (!missing.isEmpty()) {
            throw new HackathonException(ErrorCode.SUBMISSION_INCOMPLETE,
                    "누락 항목: " + String.join(", ", missing));
        }

        return SubmissionResponse.from(submission);
    }

    /** 내 팀 제출물. 아직 제출 전이면 null */
    @Transactional(readOnly = true)
    public SubmissionResponse getMySubmission(Long userId) {
        Team team = findMyTeam(userId);
        return submissionRepository.findByTeamId(team.getId())
                .map(SubmissionResponse::from)
                .orElse(null);
    }

    /** 평가 화면이 읽는 팀 제출물 */
    @Transactional(readOnly = true)
    public SubmissionResponse getTeamSubmission(Long teamId) {
        return submissionRepository.findByTeamId(teamId)
                .map(SubmissionResponse::from)
                .orElseThrow(() -> new HackathonException(ErrorCode.SUBMISSION_NOT_FOUND));
    }

    /** 트랙별 제출물 목록. 평가 대상 목록을 만들 때 쓴다. */
    @Transactional(readOnly = true)
    public List<SubmissionResponse> getSubmissionsByTrack(Track track) {
        HackathonEvent event = eventService.getActiveEvent();
        return submissionRepository.findByEventIdAndTrack(event.getId(), track)
                .stream()
                .map(SubmissionResponse::from)
                .toList();
    }

    /**
     * 제출 파일을 업로드하고 공개 URL을 돌려준다.
     * 업로드 자체도 마감 이후에는 막는다.
     */
    @Transactional(readOnly = true)
    public UploadResponse uploadFile(Long userId, String slot, MultipartFile file) {
        Team team = findMyTeam(userId);
        requireLeader(team, userId);
        requireSubmissionOpen(team);

        String url = storageService.upload(team.getId(), slot, file);
        return new UploadResponse(url, slot, file.getSize());
    }

    /** 팀의 트랙 마감 시각이 지났으면 제출을 거부한다. */
    private void requireSubmissionOpen(Team team) {
        HackathonEvent event = team.getEvent();
        Instant now = Instant.now();
        if (!event.isSubmissionOpen(team.getTrack(), now)) {
            throw new HackathonException(ErrorCode.SUBMISSION_CLOSED,
                    "%s 트랙 제출은 마감되었습니다.".formatted(team.getTrack().name()));
        }
    }

    private Team findMyTeam(Long userId) {
        HackathonEvent event = eventService.getActiveEvent();
        return teamRepository.findByEventIdAndMemberUserId(event.getId(), userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                        "소속된 팀이 없습니다. 먼저 팀을 등록해 주세요."));
    }

    private void requireLeader(Team team, Long userId) {
        if (!team.isLedBy(userId)) {
            throw new HackathonException(ErrorCode.NOT_TEAM_LEADER,
                    "산출물 제출은 조장만 할 수 있습니다.");
        }
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
