package com.skalog.material;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MaterialRequest(
        @NotNull Long scheduleId,
        @NotBlank String title,
        @NotNull MaterialKind kind,
        @NotBlank String url) {}
