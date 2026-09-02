package kr.hyu.isd.hackathon.application.admin;

import kr.hyu.isd.hackathon.application.event.EventService;
import kr.hyu.isd.hackathon.application.result.ResultService;
import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import kr.hyu.isd.hackathon.domain.submission.Submission;
import kr.hyu.isd.hackathon.domain.team.Team;
import kr.hyu.isd.hackathon.domain.team.TeamMember;
import kr.hyu.isd.hackathon.infrastructure.persistence.SubmissionRepository;
import kr.hyu.isd.hackathon.infrastructure.persistence.TeamRepository;
import kr.hyu.isd.hackathon.web.result.dto.TeamResultResponse;
import kr.hyu.isd.hackathon.web.result.dto.TrackResultResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 운영진용 CSV 내보내기.
 *
 * Excel이 UTF-8 CSV를 기본으로 한글 깨짐 없이 열도록 BOM을 앞에 붙인다.
 * 이게 없으면 한글 팀명이 전부 깨져 보인다.
 */
@Service
@RequiredArgsConstructor
public class CsvExportService {

    private final TeamRepository teamRepository;
    private final SubmissionRepository submissionRepository;
    private final ResultService resultService;
    private final EventService eventService;

    /** Excel 호환을 위한 UTF-8 BOM */
    private static final String BOM = "﻿";

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIMESTAMP =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm").withZone(KST);

    /**
     * 참가자 명단. 팀원 한 명이 한 행이 된다.
     */
    @Transactional(readOnly = true)
    public String exportParticipants() {
        HackathonEvent event = eventService.getActiveEvent();
        StringBuilder sb = new StringBuilder(BOM);
        sb.append("팀명,트랙,배정사유,역할,성명,학번,이메일,등록일시\n");

        for (Team team : teamRepository.findAllByEventIdWithMembers(event.getId())) {
            for (TeamMember member : team.getMembers()) {
                appendRow(sb,
                        team.getName(),
                        team.getTrack().name(),
                        team.getTrackReason(),
                        member.isLeader() ? "조장" : "팀원",
                        member.getName(),
                        member.getStudentId(),
                        member.getEmail(),
                        format(team.getCreatedAt()));
            }
        }
        return sb.toString();
    }

    /**
     * 제출 현황. 미제출 팀도 한 행으로 남겨 누락을 바로 확인할 수 있게 한다.
     */
    @Transactional(readOnly = true)
    public String exportSubmissions() {
        HackathonEvent event = eventService.getActiveEvent();

        Map<Long, Submission> byTeam = new HashMap<>();
        submissionRepository.findAllByEventId(event.getId())
                .forEach(s -> byTeam.put(s.getTeam().getId(), s));

        StringBuilder sb = new StringBuilder(BOM);
        sb.append("팀명,트랙,제출여부,필수항목충족,누락항목,프로젝트명,요약,기획서,프로토타입,")
                .append("소스코드,발표자료,시연,배포링크,아키텍처,기술명세서,제출시각\n");

        for (Team team : teamRepository.findAllByEventIdWithMembers(event.getId())) {
            Submission s = byTeam.get(team.getId());
            if (s == null) {
                appendRow(sb, team.getName(), team.getTrack().name(), "미제출", "N", "",
                        "", "", "", "", "", "", "", "", "", "", "");
                continue;
            }
            List<String> missing = s.findMissingRequirements();
            appendRow(sb,
                    team.getName(),
                    team.getTrack().name(),
                    "제출",
                    missing.isEmpty() ? "Y" : "N",
                    String.join(" / ", missing),
                    s.getProjectName(),
                    s.getSummary(),
                    s.getPlanFileUrl(),
                    s.getPrototypeUrl(),
                    s.getSourceCodeUrl(),
                    s.getDeckFileUrl(),
                    s.getDemoUrl(),
                    s.getDeployUrl(),
                    s.getArchitectureFileUrl(),
                    s.getTechSpecFileUrl(),
                    format(s.getSubmittedAt()));
        }
        return sb.toString();
    }

    /**
     * 트랙별 최종 순위표. 학생/교수 평균을 함께 실어 산출 근거를 남긴다.
     */
    @Transactional(readOnly = true)
    public String exportResults() {
        StringBuilder sb = new StringBuilder(BOM);
        sb.append("트랙,산식,순위,팀명,프로젝트명,학생평균,학생투표수,교수평균,교수평가수,최종점수,수상\n");

        for (TrackResultResponse track : resultService.getResultsForAdmin()) {
            for (TeamResultResponse r : track.results()) {
                appendRow(sb,
                        track.track().name(),
                        track.formula(),
                        String.valueOf(r.rank()),
                        r.teamName(),
                        r.projectName(),
                        String.valueOf(r.studentAverage()),
                        String.valueOf(r.studentVoterCount()),
                        String.valueOf(r.professorAverage()),
                        String.valueOf(r.professorVoterCount()),
                        String.valueOf(r.finalScore()),
                        r.awardName());
            }
        }
        return sb.toString();
    }

    private void appendRow(StringBuilder sb, String... cells) {
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(cells[i]));
        }
        sb.append('\n');
    }

    /**
     * CSV 셀 이스케이프.
     *
     * 쉼표·따옴표·줄바꿈이 든 값은 따옴표로 감싸고 내부 따옴표는 두 번 반복한다.
     * 팀명이나 요약에 쉼표가 흔히 들어가므로 생략할 수 없다.
     */
    private String escape(String value) {
        if (value == null || value.isEmpty()) return "";
        boolean needsQuoting = value.indexOf(',') >= 0
                || value.indexOf('"') >= 0
                || value.indexOf('\n') >= 0
                || value.indexOf('\r') >= 0;
        if (!needsQuoting) return value;
        return '"' + value.replace("\"", "\"\"") + '"';
    }

    private String format(Instant instant) {
        return instant != null ? TIMESTAMP.format(instant) : "";
    }
}
