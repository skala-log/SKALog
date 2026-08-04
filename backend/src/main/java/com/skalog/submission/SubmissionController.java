package com.skalog.submission;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

// ponytail: userId는 로그인(6단계) 전까지 쿼리 파라미터로 받는 임시 스텁. 로그인 붙으면 세션에서 꺼내도록 교체.
@Tag(name = "내 기록")
@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionRepository submissionRepository;

    public SubmissionController(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping
    public List<Submission> mine(@RequestParam(defaultValue = "1") Long userId) {
        return submissionRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Submission create(@RequestParam(defaultValue = "1") Long userId, @Valid @RequestBody SubmissionRequest req) {
        Submission submission = new Submission(userId, req.scheduleId(), req.type(), req.title(), req.body());
        return submissionRepository.save(submission);
    }

    @PatchMapping("/{id}")
    public Submission update(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") Long userId,
            @Valid @RequestBody SubmissionUpdateRequest req) {
        Submission submission = submissionRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        submission.update(req.title(), req.body());
        return submissionRepository.save(submission);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @RequestParam(defaultValue = "1") Long userId) {
        Submission submission = submissionRepository.findByIdAndUserIdAndDeletedAtIsNull(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        submission.softDelete();
        submissionRepository.save(submission);
    }
}
