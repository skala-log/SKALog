package com.skalog.material;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record MaterialIdsRequest(@NotEmpty List<Long> ids) {}
