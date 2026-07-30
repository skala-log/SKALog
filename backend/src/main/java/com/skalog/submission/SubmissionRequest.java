package com.skalog.submission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SubmissionRequest(
        @NotNull Long scheduleId,
        @NotNull SubmissionType type,
        @NotBlank String title,
        String body) {}
