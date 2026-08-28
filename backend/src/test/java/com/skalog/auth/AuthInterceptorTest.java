package com.skalog.auth;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.skalog.user.Role;
import com.skalog.user.User;
import com.skalog.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.method.HandlerMethod;

class AuthInterceptorTest {

    static class Dummy {
        public void plain() {}

        @RequireAdmin
        public void adminOnly() {}
    }

    private final UserRepository userRepository = mock(UserRepository.class);
    private final AuthInterceptor interceptor = new AuthInterceptor(userRepository);
    private final HttpServletRequest request = mock(HttpServletRequest.class);
    private final HttpServletResponse response = mock(HttpServletResponse.class);

    private HandlerMethod handlerFor(String methodName) throws NoSuchMethodException {
        return new HandlerMethod(new Dummy(), Dummy.class.getMethod(methodName));
    }

    @Test
    void 세션없으면_401() throws Exception {
        when(request.getSession(false)).thenReturn(null);

        assertFalse(interceptor.preHandle(request, response, handlerFor("plain")));
        verify(response).sendError(401, "UNAUTHENTICATED");
    }

    @Test
    void 관리자아니어도_되는_핸들러는_세션만있으면_통과() throws Exception {
        HttpSession session = mock(HttpSession.class);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(AuthController.SESSION_USER_ID)).thenReturn(1L);

        assertTrue(interceptor.preHandle(request, response, handlerFor("plain")));
        verifyNoInteractions(userRepository);
    }

    @Test
    void 관리자전용_핸들러에_학생이면_403() throws Exception {
        HttpSession session = mock(HttpSession.class);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(AuthController.SESSION_USER_ID)).thenReturn(1L);
        User student = mock(User.class);
        when(student.getRole()).thenReturn(Role.STUDENT);
        when(userRepository.findById(1L)).thenReturn(Optional.of(student));

        assertFalse(interceptor.preHandle(request, response, handlerFor("adminOnly")));
        verify(response).sendError(403, "FORBIDDEN");
    }

    @Test
    void 관리자전용_핸들러에_관리자면_통과() throws Exception {
        HttpSession session = mock(HttpSession.class);
        when(request.getSession(false)).thenReturn(session);
        when(session.getAttribute(AuthController.SESSION_USER_ID)).thenReturn(2L);
        User admin = mock(User.class);
        when(admin.getRole()).thenReturn(Role.ADMIN);
        when(userRepository.findById(2L)).thenReturn(Optional.of(admin));

        assertTrue(interceptor.preHandle(request, response, handlerFor("adminOnly")));
    }
}
