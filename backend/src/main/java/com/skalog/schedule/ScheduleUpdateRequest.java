package com.skalog.schedule;

import jakarta.validation.constraints.NotBlank;

public record ScheduleUpdateRequest(@NotBlank String subject, String instructor) {}
