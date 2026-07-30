insert into app_user (slack_user_id, slack_team_id, name, class_id, role)
values ('DEV_USER', 'DEV_TEAM', '테스트 유저', (select id from class_group where name = '1반'), 'STUDENT');
