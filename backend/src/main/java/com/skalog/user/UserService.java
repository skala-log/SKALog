package com.skalog.user;

import com.skalog.user.SlackDisplayNameParser.ParsedSlackName;
import org.springframework.stereotype.Service;

/**
 * 슬랙 로그인 콜백에서 쓸 서비스. 처음 로그인하는 유저는 표시 이름을 파싱해
 * 반을 자동으로 매칭/생성한다 — 반 선택 온보딩 화면이 하던 일을 대신한다.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final ClassGroupRepository classGroupRepository;

    public UserService(UserRepository userRepository, ClassGroupRepository classGroupRepository) {
        this.userRepository = userRepository;
        this.classGroupRepository = classGroupRepository;
    }

    public User resolveFromSlack(String slackUserId, String slackTeamId, String slackDisplayName) {
        return userRepository.findBySlackUserId(slackUserId)
                .orElseGet(() -> createFromSlack(slackUserId, slackTeamId, slackDisplayName));
    }

    private User createFromSlack(String slackUserId, String slackTeamId, String slackDisplayName) {
        ParsedSlackName parsed = SlackDisplayNameParser.parse(slackDisplayName);
        ClassGroup classGroup = classGroupRepository.findByCampusAndName(parsed.campus(), parsed.className())
                .orElseGet(() -> classGroupRepository.save(new ClassGroup(parsed.campus(), parsed.className())));
        return userRepository.save(new User(slackUserId, slackTeamId, parsed.personName(), classGroup.getId()));
    }
}
