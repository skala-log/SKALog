package com.skalog.schedule;

import com.skalog.material.MaterialRepository;
import com.skalog.submission.SubmissionRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Tag(name = "일정")
@RestController
@RequestMapping("/api/schedules")
public class ScheduleController {

    private final ScheduleRepository scheduleRepository;
    private final MaterialRepository materialRepository;
    private final SubmissionRepository submissionRepository;

    public ScheduleController(
            ScheduleRepository scheduleRepository,
            MaterialRepository materialRepository,
            SubmissionRepository submissionRepository) {
        this.scheduleRepository = scheduleRepository;
        this.materialRepository = materialRepository;
        this.submissionRepository = submissionRepository;
    }

    @GetMapping
    public List<Schedule> list(@RequestParam(defaultValue = "1") Long classId) {
        return scheduleRepository.findByClassIdOrderByDateAsc(classId);
    }

    @GetMapping("/{id}")
    public Schedule detail(@PathVariable Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PatchMapping("/{id}")
    public Schedule update(@PathVariable Long id, @Valid @RequestBody ScheduleUpdateRequest req) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        schedule.update(req.subject(), req.instructor());
        return scheduleRepository.save(schedule);
    }

    // ponytail: 연결된 자료/기록이 있으면 삭제를 막는다. UI 문구는 "분리됩니다"지만
    // material/submission의 schedule_id가 not null이라 실제 분리(FK를 null로)는 별도 스키마 변경이 필요함.
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        if (materialRepository.existsByScheduleId(id) || submissionRepository.existsByScheduleId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "연결된 자료 또는 기록이 있어 삭제할 수 없습니다");
        }
        scheduleRepository.deleteById(id);
    }
}
