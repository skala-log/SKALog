-- 공지 노출 범위를 층까지 구분한다. class_group.campus 와 같은 문자열("판교 4층").
--   CLASS  : class_id = 반, campus = 그 반의 층  (반 학생만)
--   FLOOR  : class_id null, campus = 층          (그 층의 반들만)
--   CAMPUS : class_id null, campus null           (모두)
alter table notice add column campus varchar(50);
update notice set campus = cg.campus from class_group cg where notice.class_id = cg.id;
