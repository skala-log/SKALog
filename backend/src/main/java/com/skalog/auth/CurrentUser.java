package com.skalog.auth;

import jakarta.servlet.http.HttpSession;

/** AuthInterceptor가 로그인 여부를 이미 보장하므로, 컨트롤러는 세션에서 id만 꺼내 쓰면 된다. */
public final class CurrentUser {

    private CurrentUser() {}

    public static Long id(HttpSession session) {
        return (Long) session.getAttribute(AuthController.SESSION_USER_ID);
    }
}
