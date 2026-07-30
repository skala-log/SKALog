package com.skalog.submission;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    List<Submission> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId);

    List<Submission> findByScheduleIdAndUserIdAndDeletedAtIsNull(Long scheduleId, Long userId);
}
