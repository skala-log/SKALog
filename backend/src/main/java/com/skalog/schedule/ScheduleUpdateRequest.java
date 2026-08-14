package com.skalog.schedule;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ScheduleUpdateRequest(@NotBlank String subject, @Valid List<InstructorInput> instructors) {

    public record InstructorInput(@NotBlank String name, @NotNull InstructorRole role) {}
}
