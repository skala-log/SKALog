insert into material (schedule_id, title, kind, url, status)
select s.id, v.title, v.kind, v.url, 'APPROVED'
from (values
    ('2026-07-14', 'Git 특강 슬라이드', 'LINK', 'https://example.com/materials/git-intro.pdf'),
    ('2026-07-15', 'HTML/CSS/JS 실습 자료', 'LINK', 'https://example.com/materials/html-css-js.zip')
) as v(date, title, kind, url)
join schedule s on s.date = v.date::date and s.class_id = (select id from class_group where name = '1반');
