package com.skalog.material;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findByScheduleIdAndStatus(Long scheduleId, MaterialStatus status);

    List<Material> findByStatusOrderByCreatedAtDesc(MaterialStatus status);

    boolean existsBySourceRef(String sourceRef);
}
