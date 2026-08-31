-- 반 채널 공지는 그 반에게만 보인다. notice.class_id null = 전체 공개(층·캠퍼스 공지).
alter table notice add column class_id bigint references class_group (id);

-- 반별 슬랙 교육 채널. 채널이 비공개라 봇을 초대받은 반만 채워진다 — null이면 그 반 공지는 수집하지 않는다.
alter table class_group add column slack_channel_id varchar(20) unique;
update class_group set slack_channel_id = 'C0BE0AC6D9B' where name = '1반' and campus = '판교 4층';
