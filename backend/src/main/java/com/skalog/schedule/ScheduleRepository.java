package com.skalog.schedule;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByClassIdOrderByDateAsc(Long classId);

    Optional<Schedule> findByClassIdAndDate(Long classId, LocalDate date);
}
