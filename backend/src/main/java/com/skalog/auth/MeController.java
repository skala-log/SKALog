package com.skalog.auth;

import com.skalog.user.ClassGroup;
import com.skalog.user.ClassGroupRepository;
import com.skalog.user.User;
import com.skalog.user.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "내 정보")
@RestController
public class MeController {

    private final UserRepository userRepository;
    private final ClassGroupRepository classGroupRepository;

    public MeController(UserRepository userRepository, ClassGroupRepository classGroupRepository) {
        this.userRepository = userRepository;
        this.classGroupRepository = classGroupRepository;
    }

    @GetMapping("/api/me")
    public MeResponse me(HttpSession session) {
        Object userId = session.getAttribute(AuthController.SESSION_USER_ID);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED");
        }
        User user = userRepository.findById((Long) userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED"));
        ClassGroup classGroup = classGroupRepository.findById(user.getClassId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "CLASS_NOT_FOUND"));

        return new MeResponse(
                user.getId(),
                user.getName(),
                user.getRole().name(),
                classGroup.getId(),
                classGroup.getName(),
                classGroup.getCampus(),
                false);
    }

    public record MeResponse(
            Long id,
            String name,
            String role,
            Long classId,
            String className,
            String campus,
            boolean needsClassSelection) {}
}
