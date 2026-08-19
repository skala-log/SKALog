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

    // ponytail: 캠퍼스까지 같이 비교하면 안 됨 — 시드 데이터는 "판교 4층"처럼 층까지 붙는데
    // 슬랙 표시 이름 파싱 결과는 "판교"뿐이라 절대 안 맞는다. 지금은 반 이름이 전체에서
    // 유일해서(판교만 운영) 이름만으로 매칭한다. 나중에 캠퍼스가 여러 개(광주/울산 등)
    // 실제로 붙으면 캠퍼스 문자열부터 통일하고 다시 캠퍼스+이름으로 매칭해야 한다.
    private User createFromSlack(String slackUserId, String slackTeamId, String slackDisplayName) {
        ParsedSlackName parsed = SlackDisplayNameParser.parse(slackDisplayName);
        ClassGroup classGroup = classGroupRepository.findByName(parsed.className())
                .orElseGet(() -> classGroupRepository.save(new ClassGroup(parsed.campus(), parsed.className())));
        return userRepository.save(new User(slackUserId, slackTeamId, parsed.personName(), classGroup.getId()));
    }
}
