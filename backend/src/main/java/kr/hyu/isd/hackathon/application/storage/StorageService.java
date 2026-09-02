package kr.hyu.isd.hackathon.application.storage;

import kr.hyu.isd.hackathon.common.exception.ErrorCode;
import kr.hyu.isd.hackathon.common.exception.HackathonException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.net.URLConnection;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Supabase Storage 업로드.
 *
 * 서비스 롤 키는 서버에만 두고 프론트에는 노출하지 않는다.
 * 버킷은 공개(public) 설정을 전제로 하며, 업로드 후 공개 URL을 돌려준다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final StorageProperties properties;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /** 제출물로 허용하는 확장자. 실행 파일·스크립트는 받지 않는다. */
    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "pdf", "ppt", "pptx", "doc", "docx", "hwp", "hwpx",
            "png", "jpg", "jpeg", "gif", "webp", "svg",
            "zip", "txt", "md", "csv", "mp4", "mov"
    );

    /**
     * 파일을 업로드하고 공개 URL을 돌려준다.
     *
     * @param teamId 팀별로 경로를 나누기 위한 식별자
     * @param slot   제출 항목 이름 (plan, prototype, source, deck, architecture, techspec)
     */
    public String upload(Long teamId, String slot, MultipartFile file) {
        if (!properties.isEnabled()) {
            throw new HackathonException(ErrorCode.FILE_UPLOAD_FAILED,
                    "파일 저장소가 설정되지 않았습니다. 외부 링크로 제출해 주세요.");
        }
        if (file == null || file.isEmpty()) {
            throw new HackathonException(ErrorCode.BAD_REQUEST, "빈 파일입니다.");
        }
        if (file.getSize() > properties.maxUploadBytes()) {
            throw new HackathonException(ErrorCode.FILE_TOO_LARGE,
                    "최대 %dMB까지 업로드할 수 있습니다.".formatted(properties.maxUploadMb()));
        }

        String extension = extractExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new HackathonException(ErrorCode.UNSUPPORTED_FILE_TYPE,
                    "허용 확장자: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        // 원본 파일명은 경로에 쓰지 않는다. 한글·공백·경로 조작 문자를 그대로 넣으면
        // URL이 깨지거나 다른 팀 경로를 덮어쓸 여지가 생긴다.
        String objectPath = "%d/%s-%s.%s".formatted(
                teamId, sanitizeSlot(slot), UUID.randomUUID(), extension);

        try {
            byte[] bytes = file.getBytes();
            String uploadUrl = "%s/storage/v1/object/%s/%s".formatted(
                    trimTrailingSlash(properties.supabaseUrl()), properties.bucket(), objectPath);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(uploadUrl))
                    .header("Authorization", "Bearer " + properties.supabaseServiceKey())
                    .header("Content-Type", resolveContentType(file))
                    // 같은 슬롯에 다시 올리면 덮어쓴다
                    .header("x-upsert", "true")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(bytes))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Supabase 업로드 실패: status={}, body={}", response.statusCode(), response.body());
                throw new HackathonException(ErrorCode.FILE_UPLOAD_FAILED);
            }

            return publicUrl(objectPath);

        } catch (HackathonException e) {
            throw e;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new HackathonException(ErrorCode.FILE_UPLOAD_FAILED);
        } catch (Exception e) {
            log.error("파일 업로드 중 오류", e);
            throw new HackathonException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    public boolean isUploadEnabled() {
        return properties.isEnabled();
    }

    public int getMaxUploadMb() {
        return properties.maxUploadMb();
    }

    private String publicUrl(String objectPath) {
        return "%s/storage/v1/object/public/%s/%s".formatted(
                trimTrailingSlash(properties.supabaseUrl()), properties.bucket(), objectPath);
    }

    private static String resolveContentType(MultipartFile file) {
        if (file.getContentType() != null && !file.getContentType().isBlank()) {
            return file.getContentType();
        }
        String guessed = URLConnection.guessContentTypeFromName(file.getOriginalFilename());
        return guessed != null ? guessed : MediaType.APPLICATION_OCTET_STREAM_VALUE;
    }

    private static String extractExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    /** 경로에 넣어도 안전한 문자만 남긴다. */
    private static String sanitizeSlot(String slot) {
        if (slot == null) return "file";
        String cleaned = slot.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "");
        return cleaned.isBlank() ? "file" : cleaned;
    }

    private static String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
