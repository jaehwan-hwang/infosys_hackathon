package kr.hyu.isd.hackathon.application.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Supabase Storage 설정. app.storage.* 를 바인딩한다.
 *
 * supabaseUrl 또는 serviceKey가 비어 있으면 업로드 기능이 비활성화되고,
 * 제출 폼은 외부 링크 입력만 받는다(구글 드라이브 등).
 */
@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
        String supabaseUrl,
        String supabaseServiceKey,
        String bucket,
        int maxUploadMb
) {

    public StorageProperties {
        if (bucket == null || bucket.isBlank()) bucket = "submissions";
        if (maxUploadMb <= 0) maxUploadMb = 50;
    }

    public boolean isEnabled() {
        return supabaseUrl != null && !supabaseUrl.isBlank()
                && supabaseServiceKey != null && !supabaseServiceKey.isBlank();
    }

    public long maxUploadBytes() {
        return (long) maxUploadMb * 1024 * 1024;
    }
}
