package com.skalog.notice;

import com.skalog.auth.CurrentUser;
import com.skalog.user.ClassGroup;
import com.skalog.user.ClassGroupRepository;
import com.skalog.user.User;
import com.skalog.user.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "공지")
@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;
    private final ClassGroupRepository classGroupRepository;

    public NoticeController(
            NoticeRepository noticeRepository,
            UserRepository userRepository,
            ClassGroupRepository classGroupRepository) {
        this.noticeRepository = noticeRepository;
        this.userRepository = userRepository;
        this.classGroupRepository = classGroupRepository;
    }

    /** 내 반 + 내 층 + 모두에게 가는 공지만. */
    @GetMapping
    public List<Notice> list(HttpSession session) {
        User user = userRepository.findById(CurrentUser.id(session))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED"));
        String campus = classGroupRepository.findById(user.getClassId()).map(ClassGroup::getCampus).orElse(null);
        return noticeRepository.findVisibleTo(user.getClassId(), campus, Limit.of(20));
    }
}
