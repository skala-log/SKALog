package com.skalog.schedule;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    // open-in-view=false 라 instructors(LAZY)는 트랜잭션 안에서 fetch join 으로 미리 채워야
    // 컨트롤러에서 Jackson 직렬화할 때 LazyInitializationException 이 안 난다.
    @Query("select distinct s from Schedule s left join fetch s.instructors where s.classId = :classId order by s.date asc")
    List<Schedule> findByClassIdOrderByDateAsc(@Param("classId") Long classId);

    @Query("select s from Schedule s left join fetch s.instructors where s.id = :id")
    Optional<Schedule> findWithInstructorsById(@Param("id") Long id);

    Optional<Schedule> findByClassIdAndDate(Long classId, LocalDate date);
}
