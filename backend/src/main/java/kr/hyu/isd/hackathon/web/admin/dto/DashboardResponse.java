package kr.hyu.isd.hackathon.web.admin.dto;

import kr.hyu.isd.hackathon.domain.team.Track;

import java.util.Map;

/**
 * 운영진 대시보드 상단 요약.
 *
 * @param submissionsByTrack   트랙별 제출 완료 팀 수
 * @param teamsByTrack         트랙별 등록 팀 수
 * @param studentVotesByTrack  트랙별 학생 투표 건수
 * @param professorVoteCount   교수 평가 건수 (Summit)
 * @param professorsCompleted  Summit 팀을 모두 평가한 교수 수
 * @param professorsRequired   평가를 마쳐야 할 교수 수 (참고용, 공개를 막지 않는다)
 * @param professorEvaluationSwitchOn 운영진의 교수 평가 스위치
 * @param professorEvaluationOpen     지금 교수가 실제로 평가할 수 있는가 (스위치·마감·공개 여부를 모두 따진 결과)
 */
public record DashboardResponse(
        long totalTeams,
        long totalSubmissions,
        long totalParticipants,
        Map<Track, Long> teamsByTrack,
        Map<Track, Long> submissionsByTrack,
        Map<Track, Long> studentVotesByTrack,
        long professorVoteCount,
        Map<Track, Boolean> resultsPublished,
        Map<Track, Boolean> votingOpen,
        int professorsCompleted,
        int professorsRequired,
        boolean professorEvaluationSwitchOn,
        boolean professorEvaluationOpen
) {
}
