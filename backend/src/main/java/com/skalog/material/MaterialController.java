package com.skalog.material;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "강의자료")
@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    private final MaterialRepository materialRepository;

    public MaterialController(MaterialRepository materialRepository) {
        this.materialRepository = materialRepository;
    }

    @GetMapping
    public List<Material> list(@RequestParam Long scheduleId) {
        return materialRepository.findByScheduleIdAndStatus(scheduleId, MaterialStatus.APPROVED);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Material create(@Valid @RequestBody MaterialRequest req) {
        Material material = new Material(req.scheduleId(), req.title(), req.kind(), req.url());
        return materialRepository.save(material);
    }
}
