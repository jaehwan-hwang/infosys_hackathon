package kr.hyu.isd.hackathon.web.submission.dto;

/**
 * 파일 업로드 결과. 프론트는 받은 url을 제출 폼의 해당 항목에 채워 넣는다.
 */
public record UploadResponse(String url, String slot, long sizeBytes) {
}
