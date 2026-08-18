package com.skalog.user;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Comparator;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "반")
@RestController
@RequestMapping("/api/classes")
public class ClassGroupController {

    private final ClassGroupRepository classGroupRepository;

    public ClassGroupController(ClassGroupRepository classGroupRepository) {
        this.classGroupRepository = classGroupRepository;
    }

    // "1반".."10반" 이름에서 숫자만 뽑아 자연스러운 순서로 정렬 (문자열 정렬이면 "10반"이 "2반"보다 앞에 온다)
    @GetMapping
    public List<ClassGroup> list() {
        return classGroupRepository.findAll().stream()
                .sorted(Comparator.comparingInt(cg -> Integer.parseInt(cg.getName().replaceAll("\\D", ""))))
                .toList();
    }
}
