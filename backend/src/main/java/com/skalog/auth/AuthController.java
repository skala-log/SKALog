package com.skalog.auth;

import com.skalog.slack.SlackProperties;
import com.skalog.user.User;
import com.skalog.user.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Tag(name = "인증")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    // MeController와 공유하는 세션 키 — 문자열 하나뿐이라 상수 클래스로 안 뺐다.
    static final String SESSION_USER_ID = "userId";

    private final SlackOidcClient slackOidcClient;
    private final SlackProperties slackProperties;
    private final UserService userService;

    public AuthController(SlackOidcClient slackOidcClient, SlackProperties slackProperties, UserService userService) {
        this.slackOidcClient = slackOidcClient;
        this.slackProperties = slackProperties;
        this.userService = userService;
    }

    @GetMapping("/slack/authorize")
    public ResponseEntity<Void> authorize() {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(slackOidcClient.authorizeUrl())).build();
    }

    @GetMapping("/slack/callback")
    public ResponseEntity<Void> callback(@RequestParam String code, HttpSession session) {
        SlackOidcClient.SlackIdentity identity;
        try {
            identity = slackOidcClient.exchangeCode(code);
        } catch (IOException | InterruptedException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "슬랙 인증 처리 실패");
        }

        String expectedTeamId = slackProperties.teamId();
        if (expectedTeamId != null && !expectedTeamId.isBlank() && !expectedTeamId.equals(identity.slackTeamId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "NOT_SKALA_MEMBER");
        }

        User user;
        try {
            user = userService.resolveFromSlack(identity.slackUserId(), identity.slackTeamId(), identity.displayName());
        } catch (IllegalArgumentException e) {
            // 슬랙 표시 이름이 "캠퍼스_반_이름" 형식이 아니면 반 자동 매칭이 불가능 — 로그인 화면으로 안내 메시지와 함께 되돌린다.
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(slackProperties.redirectBaseUri() + "/login?error=display_name_format"))
                    .build();
        }
        session.setAttribute(SESSION_USER_ID, user.getId());

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(slackProperties.redirectBaseUri() + "/"))
                .build();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpSession session) {
        session.invalidate();
    }
}
