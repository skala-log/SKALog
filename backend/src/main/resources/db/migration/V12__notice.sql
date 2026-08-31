-- 슬랙 공지 채널에서 수집해 LLM으로 한 줄 요약한 공지. title이 곧 요약문이다.
create table notice (
    id          bigserial primary key,
    title       varchar(300) not null,
    scope       varchar(20)  not null check (scope in ('CLASS', 'FLOOR', 'CAMPUS')),
    scope_label varchar(50)  not null,
    posted_at   timestamptz  not null,
    url         text,
    source_ref  varchar(200) not null unique,
    created_at  timestamptz  not null default now()
);
create index idx_notice_posted_at on notice (posted_at desc);
