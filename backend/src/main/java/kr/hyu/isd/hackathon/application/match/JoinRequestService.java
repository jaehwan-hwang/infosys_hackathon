package kr.hyu.isd.hackathon.application.match;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.match.JoinRequest;
import kr.hyu.isd.hackathon.domain.match.JoinRequestStatus;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.infrastructure.persistence.JoinRequestRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.web.match.dto.JoinRequestCreateRequest;
import kr.hyu.isd.hackathon.web.match.dto.JoinRequestResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Stream;

/**
 * 팀 합류 신청.
 *
 * 신청이 들어와도 그 자리에서 합쳐지지 않는다. 운영진이 양쪽에 연락해 확인한 뒤
 * 직접 합치는 것이 이 행사의 방식이라, 여기서는 대기 목록을 쌓고 취소만 처리한다.
 * 실제 합치기는 AdminService가 한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JoinRequestService {

    private final JoinRequestRepository joinRequestRepository;
    private final TeamRepository teamRepository;
    private final EventService eventService;

    /**
     * 합류 신청을 보낸다.
     *
     * toTeamId가 있으면 그 팀에, 없으면 "어느 팀이든 좋다"는 신청이 된다.
     */
    @Transactional
    public JoinRequestResponse create(Long userId, JoinRequestCreateRequest request) {
        HackathonEvent event = eventService.getActiveEvent();
        if (!event.isRegistrationOpen(Instant.now())) {
            throw new HackathonException(ErrorCode.REGISTRATION_CLOSED,
                    "신청 기간이 끝나 팀 합치기를 신청할 수 없습니다.");
        }

        Team myTeam = teamRepository.findByEventIdAndMemberUserId(event.getId(), userId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND,
                        "먼저 팀을 등록해야 합치기를 신청할 수 있습니다."));
        if (!myTeam.canManage(userId)) {
            throw new HackathonException(ErrorCode.NOT_TEAM_LEADER,
                    "팀장 또는 팀을 등록한 사람만 신청할 수 있습니다.");
        }

        Team target = resolveTarget(event, myTeam, request);

        JoinRequest saved = joinRequestRepository.save(
                JoinRequest.create(event, myTeam, target, request.message()));
        log.info("합류 신청: from={}, to={}", myTeam.getName(),
                target != null ? target.getName() : "(지정 없음)");

        return JoinRequestResponse.from(saved);
    }

    private Team resolveTarget(HackathonEvent event, Team myTeam, JoinRequestCreateRequest request) {
        if (request.toTeamId() == null) {
            // "어느 팀이든 좋다"는 신청은 팀당 하나만 받는다. 여러 번 눌러도 줄만 길어진다.
            if (joinRequestRepository.existsByFromTeamIdAndToTeamIsNullAndStatus(
                    myTeam.getId(), JoinRequestStatus.PENDING)) {
                throw new HackathonException(ErrorCode.INVALID_INPUT,
                        "이미 팀 합치기를 신청해 두었습니다. 운영진이 연락드릴 때까지 기다려 주세요.");
            }
            return null;
        }

        if (request.toTeamId().equals(myTeam.getId())) {
            throw new HackathonException(ErrorCode.INVALID_INPUT, "우리 팀에는 신청할 수 없습니다.");
        }

        Team target = teamRepository.findByIdWithMembers(request.toTeamId())
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND));

        // 합쳤을 때 정원을 넘길 조합이면 신청 단계에서 막는다. 운영진이 뒤늦게 알면 번거롭다.
        if (myTeam.memberCount() + target.memberCount() > event.getMaxTeamSize()) {
            throw new HackathonException(ErrorCode.INVALID_TEAM_SIZE,
                    "두 팀을 합치면 최대 인원 %d명을 넘습니다. (%d명 + %d명)".formatted(
                            event.getMaxTeamSize(), target.memberCount(), myTeam.memberCount()));
        }
        if (joinRequestRepository.existsByFromTeamIdAndToTeamIdAndStatus(
                myTeam.getId(), target.getId(), JoinRequestStatus.PENDING)) {
            throw new HackathonException(ErrorCode.INVALID_INPUT, "이미 신청한 팀입니다.");
        }
        return target;
    }

    /** 우리 팀이 보낸 신청과 우리 팀으로 들어온 신청 */
    @Transactional(readOnly = true)
    public List<JoinRequestResponse> getMyRequests(Long userId) {
        HackathonEvent event = eventService.getActiveEvent();
        Team myTeam = teamRepository.findByEventIdAndMemberUserId(event.getId(), userId).orElse(null);
        if (myTeam == null) return List.of();

        return Stream.concat(
                        joinRequestRepository.findByEventIdAndFromTeamId(event.getId(), myTeam.getId()).stream(),
                        joinRequestRepository.findByEventIdAndToTeamId(event.getId(), myTeam.getId()).stream())
                .map(r -> JoinRequestResponse.from(r, myTeam.getId()))
                .toList();
    }

    /**
     * 보낸 신청을 거둔다.
     *
     * 상태만 "취소"로 바꾸면 적어 둔 글이 목록에 그대로 남는다. 거두는 쪽은 흔적까지
     * 없애려는 것이므로 행을 지운다. 운영진 목록에서도 함께 사라진다.
     */
    @Transactional
    public void cancel(Long userId, Long requestId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new HackathonException(ErrorCode.TEAM_NOT_FOUND, "신청을 찾을 수 없습니다."));
        if (!request.getFromTeam().canManage(userId)) {
            throw new HackathonException(ErrorCode.INSUFFICIENT_PERMISSION, "본인 팀이 보낸 신청만 취소할 수 있습니다.");
        }
        if (!request.isPending()) {
            throw new HackathonException(ErrorCode.INVALID_INPUT, "이미 처리된 신청입니다.");
        }
        joinRequestRepository.delete(request);
    }
}
