package com.skalog.slack;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "관리자")
@RestController
@RequestMapping("/api/admin/materials")
public class SlackAdminController {

    private final MaterialCollector materialCollector;

    public SlackAdminController(MaterialCollector materialCollector) {
        this.materialCollector = materialCollector;
    }

    @PostMapping("/collect")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void collect() {
        materialCollector.collect();
    }
}
