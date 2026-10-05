package kr.hyu.isd.hackathon.web.event.dto;

import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.team.Track;

import java.time.Instant;
import java.util.Map;

/**
 * 랜딩 페이지와 각 폼이 공통으로 읽는 행사 상태.
 *
 * serverTime을 함께 내려 프론트가 카운트다운을 서버 시계에 맞춰 보정하도록 한다.
 * 열림/닫힘 판정 자체는 프론트가 아니라 서버가 이미 끝낸 결과(submissionOpen 등)를 쓴다.
 */
public record EventResponse(
        Long eventId,
        String title,
        String theme,
        String description,
        String location,
        String contactUrl,
        Instant registerStartsAt,
        Instant registerEndsAt,
        Instant sparkSubmitDeadline,
        Instant devSubmitDeadline,
        boolean registrationOpen,
        Map<Track, Boolean> submissionOpen,
        Map<Track, Boolean> votingOpen,
        Map<Track, Boolean> resultsPublished,
        int minTeamSize,
        int maxTeamSize,
        int maxUploadMb,
        Instant serverTime
) {

    public static EventResponse from(HackathonEvent event) {
        return from(event, event.getMaxUploadMb());
    }

    /**
     * @param effectiveMaxUploadMb 화면에 보여줄 업로드 한도.
     *                             행사 설정과 서버가 실제로 받는 크기 중 작은 쪽이어야 한다.
     *                             (둘이 어긋나면 "50MB까지"라고 안내해 놓고 25MB에서 막힌다)
     */
    public static EventResponse from(HackathonEvent event, int effectiveMaxUploadMb) {
        Instant now = Instant.now();
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getTheme(),
                event.getDescription(),
                event.getLocation(),
                event.getContactUrl(),
                event.getRegisterStartsAt(),
                event.getRegisterEndsAt(),
                event.getSparkSubmitDeadline(),
                event.getDevSubmitDeadline(),
                event.isRegistrationOpen(now),
                Map.of(
                        Track.SPARK, event.isSubmissionOpen(Track.SPARK, now),
                        Track.SPRINT, event.isSubmissionOpen(Track.SPRINT, now),
                        Track.SUMMIT, event.isSubmissionOpen(Track.SUMMIT, now)
                ),
                Map.of(
                        Track.SPARK, event.isVotingOpen(Track.SPARK),
                        Track.SPRINT, event.isVotingOpen(Track.SPRINT),
                        Track.SUMMIT, event.isVotingOpen(Track.SUMMIT)
                ),
                Map.of(
                        Track.SPARK, event.isResultsPublished(Track.SPARK),
                        Track.SPRINT, event.isResultsPublished(Track.SPRINT),
                        Track.SUMMIT, event.isResultsPublished(Track.SUMMIT)
                ),
                event.getMinTeamSize(),
                event.getMaxTeamSize(),
                effectiveMaxUploadMb,
                now
        );
    }
}
