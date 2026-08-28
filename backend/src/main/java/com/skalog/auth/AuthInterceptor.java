package com.skalog.auth;

import com.skalog.user.Role;
import com.skalog.user.User;
import com.skalog.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * /api/** 전반에 로그인을 강제하고, {@link RequireAdmin}이 붙은 핸들러는 관리자만 통과시킨다.
 * HandlerMethod가 아닌 핸들러(정적 리소스, SPA 폴백 등)는 그냥 통과 — WebConfig에서 애초에
 * /api/** 로만 범위를 좁혀 등록하지만, 방어적으로 한 번 더 체크한다.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final UserRepository userRepository;

    public AuthInterceptor(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        if (!(handler instanceof HandlerMethod method)) {
            return true;
        }

        HttpSession session = request.getSession(false);
        Long userId = session == null ? null : (Long) session.getAttribute(AuthController.SESSION_USER_ID);
        if (userId == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "UNAUTHENTICATED");
            return false;
        }

        if (method.hasMethodAnnotation(RequireAdmin.class)) {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getRole() != Role.ADMIN) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "FORBIDDEN");
                return false;
            }
        }
        return true;
    }
}
