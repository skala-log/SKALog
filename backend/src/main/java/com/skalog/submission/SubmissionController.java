package com.skalog.submission;

import com.skalog.auth.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "내 기록")
@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionRepository submissionRepository;

    public SubmissionController(SubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping
    public List<Submission> mine(HttpSession session) {
        return submissionRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(CurrentUser.id(session));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Submission create(HttpSession session, @Valid @RequestBody SubmissionRequest req) {
        Submission submission =
                new Submission(CurrentUser.id(session), req.scheduleId(), req.type(), req.title(), req.body());
        return submissionRepository.save(submission);
    }

    @PatchMapping("/{id}")
    public Submission update(
            @PathVariable Long id, HttpSession session, @Valid @RequestBody SubmissionUpdateRequest req) {
        Submission submission = submissionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(id, CurrentUser.id(session))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        submission.update(req.title(), req.body());
        return submissionRepository.save(submission);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, HttpSession session) {
        Submission submission = submissionRepository
                .findByIdAndUserIdAndDeletedAtIsNull(id, CurrentUser.id(session))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        submission.softDelete();
        submissionRepository.save(submission);
    }
}
