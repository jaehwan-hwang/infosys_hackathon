package kr.hyu.isd.hackathon.infrastructure.persistence;

import kr.hyu.isd.hackathon.domain.event.HackathonEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HackathonEventRepository extends JpaRepository<HackathonEvent, Long> {

    /** 현재 활성 행사. 활성 행사는 하나만 유지한다. */
    Optional<HackathonEvent> findFirstByActiveTrueOrderByIdDesc();
}
