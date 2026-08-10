package com.skalog.submission;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    List<Submission> findByScheduleIdAndUserIdAndDeletedAtIsNull(Long scheduleId, Long userId);

    Optional<Submission> findByIdAndUserIdAndDeletedAtIsNull(Long id, Long userId);
}
