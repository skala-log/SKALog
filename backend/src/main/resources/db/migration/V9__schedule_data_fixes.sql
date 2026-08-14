update schedule set week_no = 6 where date = date '2026-08-17';
update schedule set week_no = 13 where date = date '2026-10-05';
delete from schedule where date in (date '2026-09-26', date '2026-09-27');
