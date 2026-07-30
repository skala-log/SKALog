create table class_group (
    id          bigserial primary key,
    name        varchar(50)  not null,
    campus      varchar(50),
    created_at  timestamptz  not null default now()
);

create table app_user (
    id             bigserial primary key,
    slack_user_id  varchar(50)  not null unique,
    slack_team_id  varchar(50)  not null,
    name           varchar(100) not null,
    class_id       bigint       references class_group (id),
    role           varchar(20)  not null default 'STUDENT',
    created_at     timestamptz  not null default now()
);

create table schedule (
    id          bigserial primary key,
    class_id    bigint      not null references class_group (id),
    date        date        not null,
    week_no     int         not null,
    subject     varchar(200) not null,
    instructor  varchar(100),
    created_at  timestamptz not null default now()
);
create index idx_schedule_class_date on schedule (class_id, date);

create table material (
    id          bigserial primary key,
    schedule_id bigint       not null references schedule (id),
    title       varchar(300) not null,
    kind        varchar(20)  not null,
    url         text,
    file_key    text,
    status      varchar(20)  not null default 'PENDING',
    source_ref  varchar(200) unique,
    created_at  timestamptz  not null default now()
);
create index idx_material_schedule_status on material (schedule_id, status);

create table submission (
    id          bigserial primary key,
    user_id     bigint       not null references app_user (id),
    schedule_id bigint       not null references schedule (id),
    type        varchar(20)  not null,
    title       varchar(300) not null,
    body        text,
    file_key    text,
    visibility  varchar(20)  not null default 'PRIVATE',
    deleted_at  timestamptz,
    created_at  timestamptz  not null default now(),
    updated_at  timestamptz  not null default now()
);
create index idx_submission_user_created on submission (user_id, created_at desc);
create index idx_submission_schedule on submission (schedule_id);
