package com.skalog.material;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
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

    @GetMapping("/pending")
    public List<Material> pending() {
        return materialRepository.findByStatusOrderByCreatedAtDesc(MaterialStatus.PENDING);
    }

    @PostMapping("/approve")
    public List<Material> approve(@Valid @RequestBody MaterialIdsRequest req) {
        List<Material> materials = materialRepository.findAllById(req.ids());
        materials.forEach(Material::approve);
        return materialRepository.saveAll(materials);
    }

    @PostMapping("/reject")
    public List<Material> reject(@Valid @RequestBody MaterialIdsRequest req) {
        List<Material> materials = materialRepository.findAllById(req.ids());
        materials.forEach(Material::reject);
        return materialRepository.saveAll(materials);
    }

    @PatchMapping("/{id}/relink")
    public Material relink(@PathVariable Long id, @RequestBody MaterialRelinkRequest req) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        material.relink(req.scheduleId());
        return materialRepository.save(material);
    }
}
