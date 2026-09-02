package kr.hyu.isd.hackathon;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@EnableJpaAuditing
@SpringBootApplication
public class IsdHackathonApplication {

    public static void main(String[] args) {
        SpringApplication.run(IsdHackathonApplication.class, args);
    }
}
