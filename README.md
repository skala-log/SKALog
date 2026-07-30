# SKALog

반별 강의 일정표를 축으로 강의자료·내 산출물·내 노트를 한 곳에서 관리하는 SKALA 교육생용 학습 홈.

## 구조

```
skalog/
├── backend/     Spring Boot 4.1 (Java 21, Gradle) — API + 정적 서빙
├── frontend/    React 19 + TypeScript + Vite + Tailwind v4
└── docker-compose.yml   로컬 PostgreSQL
```

백엔드 패키지는 계층이 아니라 도메인 단위로 나눈다. 기능이 늘어날 때
폴더 하나만 추가되도록 하기 위해서다.

```
com.skalog
├── common/config   설정 (SPA 폴백 등)
├── health          연결 확인용 엔드포인트
├── user            User, ClassGroup, Role
├── schedule        Schedule
├── material        Material (승인 상태 포함)
├── submission      Submission (과제/노트)
└── admin           승인함 (3단계에서 채움)
```

수집 배치와 API 서버는 서로를 호출하지 않는다. 둘의 유일한 접점은
`material` 테이블이며, `status` 가 계약이다.
`PENDING` 으로 들어오면 승인함에 뜨고, `APPROVED` 가 되면 일정 상세에 뜬다.

## 시작하기

사전 준비: JDK 21, Node 20 이상, Docker

```bash
cp .env.example .env      # 값 채우기
docker compose up -d      # PostgreSQL 기동
```

백엔드 (터미널 1):

```bash
cd backend
./gradlew bootRun
```

프론트엔드 (터미널 2):

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 접속. 홈 화면에 `서버 ok · DB up` 이 보이면
브라우저 → 서버 → DB 경로가 뚫린 것이다. 이것이 0단계의 완료 조건이다.

개발 중에는 Vite dev server(5173)와 백엔드(8080)를 따로 띄운다.
`/api` 요청은 Vite proxy 가 백엔드로 넘긴다.

## 배포 빌드

프론트를 빌드해 백엔드 jar 안에 넣어 단일 서버로 배포한다.

```bash
cd backend
./gradlew bootJar -Pfrontend
java -jar build/libs/skalog-0.0.1-SNAPSHOT.jar
```

## 스키마 변경

Flyway 로만 변경한다. `ddl-auto` 는 `validate` 이므로
엔티티와 테이블이 어긋나면 애플리케이션이 뜨지 않는다.

새 마이그레이션은 `backend/src/main/resources/db/migration/` 에
`V2__설명.sql` 형식으로 추가한다. 이미 적용된 파일은 수정하지 않는다.

## 개발 순서

| 단계 | 내용 | 완료 기준 |
| --- | --- | --- |
| 0 | 스캐폴딩 + 빈 껍데기 배포 | `.env` 가 추적되지 않고, 홈에서 DB up 확인 |
| 1 | 일정 적재 → 일정표·상세 | W01~W23 이 실제 데이터로 보임 |
| 2 | 내 기록 등록·조회 | **모바일에서 3클릭 30초 이내 등록** |
| 3 | 강의자료 표시 (수동 입력) | 일정 상세에 자료가 붙음 |
| 4 | 슬랙 수집기 + 승인함 | 슬랙 업로드가 후보로 뜨고 승인 시 노출 |
| 5 | 홈(오늘) 카드 그리드 | 카드 추가가 삽입만으로 가능 |
| 6 | 슬랙 OIDC + 권한 검사 | 다른 워크스페이스 계정이 거부됨 |
| 7 | 반응형 마무리 → 파일럿 | 375px·1440px 동일 기능, 새로고침 404 없음 |

## 아직 정하지 않은 것

기획서 13.1 중 아래는 해당 단계 전까지 결정한다.

- 반별 일정이 다른가 / 일정 데이터를 어떻게 확보하나 → 1단계 전
- 과제 파일 업로드를 v1 에 넣는가 → 2단계 전
- 강의자료를 서버에 복사해도 되는가 → 4단계 전
