package kr.hyu.isd.hackathon.common.config;

import kr.hyu.isd.hackathon.application.storage.StorageProperties;
import kr.hyu.isd.hackathon.common.auth.AuthProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @ConfigurationProperties 레코드들을 빈으로 등록한다.
 */
@Configuration
@EnableConfigurationProperties({AuthProperties.class, StorageProperties.class})
public class PropertiesConfig {
}
