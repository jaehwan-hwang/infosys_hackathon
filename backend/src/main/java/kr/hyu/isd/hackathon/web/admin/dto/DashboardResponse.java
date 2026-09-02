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
 */
public record DashboardResponse(
        long totalTeams,
        long totalSubmissions,
        long totalParticipants,
        Map<Track, Long> teamsByTrack,
        Map<Track, Long> submissionsByTrack,
        Map<Track, Long> studentVotesByTrack,
        long professorVoteCount,
        boolean resultsPublished,
        Map<Track, Boolean> votingOpen
) {
}
