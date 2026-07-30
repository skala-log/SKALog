insert into class_group (name, campus) values ('1반', '판교');

insert into schedule (class_id, date, week_no, subject, instructor)
select
    1,
    (date '2026-01-05' + (n - 1) * interval '7 days')::date,
    n,
    'W' || lpad(n::text, 2, '0') || ' 주차',
    null
from generate_series(1, 23) as n;
