package com.skalog.submission;

import jakarta.validation.constraints.NotBlank;

public record SubmissionUpdateRequest(@NotBlank String title, String body) {}
