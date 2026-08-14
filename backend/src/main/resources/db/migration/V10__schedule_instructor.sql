-- 강사 구조 개편: 반별 시간표 서식(흰배경+볼드=전임, 색배경=실습) 기준으로 역할을 분리한다.
-- 직강 반은 전임=실습(동일인), 원격(중계) 반은 전임(그 날짜 직강 반 강사)과 실습(자기 반에 배정된 강사)이 서로 다르다.

create table schedule_instructor (
    id           bigserial primary key,
    schedule_id  bigint       not null references schedule (id) on delete cascade,
    name         varchar(100) not null,
    role         varchar(20)  not null check (role in ('FULL_TIME', 'PRACTICE')),
    created_at   timestamptz  not null default now()
);
create index idx_schedule_instructor_schedule on schedule_instructor (schedule_id);
create unique index uq_schedule_instructor_role on schedule_instructor (schedule_id, role);

-- 실습교수: 기존 instructor 컬럼 값 = 각 반에 배정된 실습 담당
insert into schedule_instructor (schedule_id, name, role)
select id, instructor, 'PRACTICE'
from schedule
where instructor is not null;

-- 전임교수: 같은 캠퍼스(4층/5층)·날짜에서 직강(is_live) 반의 강사를 그 줄 전체 반에 공통 적용
insert into schedule_instructor (schedule_id, name, role)
select s.id, ft.name, 'FULL_TIME'
from schedule s
join class_group cg on cg.id = s.class_id
join (
    select cg2.campus, s2.date, s2.instructor as name
    from schedule s2
    join class_group cg2 on cg2.id = s2.class_id
    where s2.is_live = true
) ft on ft.campus = cg.campus and ft.date = s.date;

alter table schedule drop column instructor;
