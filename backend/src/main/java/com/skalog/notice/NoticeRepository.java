package com.skalog.notice;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface NoticeRepository extends JpaRepository<Notice, Long> {
    boolean existsBySourceRef(String sourceRef);

    /** 내 반 공지 + 내 층 공지 + 모두에게 가는 공지. 다른 반·다른 층 공지는 내려주지 않는다. */
    @Query("""
            select n from Notice n
            where n.classId = :classId
               or (n.classId is null and (n.campus is null or n.campus = :campus))
            order by n.postedAt desc
            """)
    List<Notice> findVisibleTo(Long classId, String campus, Limit limit);

    /** 중복 판정용 최근 공지. 반 구분 없이 전부 — 다른 반 공지의 재게시도 잡아야 한다. */
    List<Notice> findTop30ByPostedAtAfterOrderByPostedAtDesc(OffsetDateTime since);
}
