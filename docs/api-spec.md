# SKALog API 명세 v1

> 도출 기준: `design/prototype.pen`(화면) → `frontend/src/lib/{types,store,selectors}.ts`(프론트가 실제로 쓰는 모양) → `backend/src/main/java/com/skalog`(현재 구현).
> **화면이 요구하는 것**을 기준으로 쓰고, 지금 백엔드에 없는 것은 `🆕`로 표시했다.
>
> Base URL `/api` · 모든 요청·응답 `application/json; charset=utf-8` · 날짜 `YYYY-MM-DD` · 시각 ISO-8601 오프셋 포함

---

## 0. 지금 구현된 것 vs 화면이 필요한 것

| 리소스 | 현재 백엔드 | 화면이 요구하는 것 |
| --- | --- | --- |
| 일정 | `GET /api/schedules`, `GET /api/schedules/{id}` | + 관리자 CRUD, `classMode` 필드 |
| 자료 | `GET /api/materials?scheduleId`, `POST /api/materials` | + 승인/반려, 대기 목록, 일괄 처리 |
| 기록 | `GET /api/submissions?userId`, `POST /api/submissions` | + 수정·삭제·복구, 첨부, 커서 페이징 |
| 공지 | ❌ 없음 | 🆕 슬랙 #공지 수집 |
| 식단 | ❌ 없음 | 🆕 주간 식단 |
| 쇼케이스 | ❌ 없음 | 🆕 타 교육생 서비스 목록 |
| 인증 | ❌ 없음 | 🆕 슬랙 OAuth, 세션, 내 정보 |
| 바로가기 | — | 프론트 상수로 충분 (API 불필요) |

> `userId`/`classId`를 쿼리 파라미터로 받는 현재 방식은 **인증 붙으면 전부 세션에서 꺼내야 한다.**
> 지금은 프로토타입이라 `defaultValue = "1"`로 하드코딩돼 있다.

---

## 1. 공통 규약

### 1.1. 오류

```json
{ "code": "SCHEDULE_NOT_FOUND", "message": "일정을 찾을 수 없습니다" }
```

`message`는 **그대로 사용자에게 보여준다**(spec §7). 단 네트워크 오류는 프론트가
"연결이 불안정합니다 · 작성 내용은 보관했습니다"로 치환한다.

| HTTP | code 예시 | 쓰는 곳 |
| --- | --- | --- |
| 400 | `VALIDATION_FAILED` | 필수값 누락, 형식 오류 |
| 401 | `UNAUTHENTICATED` | 세션 없음 → 로그인으로 |
| 403 | `FORBIDDEN` | 관리자 전용 리소스 |
| 404 | `SCHEDULE_NOT_FOUND` | 없는 리소스 |
| 409 | `SCHEDULE_HAS_REFERENCES` | 삭제 막힘 (§3.5) |
| 413 | `FILE_TOO_LARGE` | 20MB 초과 |
| 415 | `UNSUPPORTED_FILE_TYPE` | 허용 외 확장자 |

### 1.2. 페이지네이션 — 커서 방식

목록이 길어질 수 있는 것(`/submissions`)에만 적용. 무한 스크롤이 아니라 **"더 보기" 버튼**이므로
커서만 있으면 된다(spec §5.4).

```json
{ "items": [ ... ], "nextCursor": "eyJpZCI6NDJ9" }
```

`nextCursor`가 `null`이면 마지막 페이지다.

### 1.3. 권한

- `role: STUDENT` — 본인 기록 CRUD, 일정·자료 조회
- `role: ADMIN` — 위 + 자료 승인/반려, 일정 CRUD
- 관리자 메뉴는 **프론트에서 렌더 자체를 안 한다.** 서버는 직접 호출을 403으로 막는다(spec §7).

---

## 2. 인증 🆕

### `GET /api/auth/slack/authorize`
슬랙 OAuth 시작. 302로 슬랙 인증 페이지로 보낸다.

### `GET /api/auth/slack/callback?code=…`
콜백. 세션 쿠키를 굽고 `/`로 302.
`slack_team_id`가 SKALA 워크스페이스가 아니면 403 `NOT_SKALA_MEMBER`.

### `GET /api/me`

```json
{
  "id": 1,
  "name": "탁연우",
  "role": "STUDENT",
  "classId": 1,
  "className": "1반",
  "campus": "판교",
  "needsClassSelection": false
}
```

`needsClassSelection: true`면 프론트가 `/onboarding/class`로 보낸다.

> ⚠️ **미결** — spec §16 #5에서 "반 선택 1스텝"이 반려되고 "서버가 자동 판단"으로 결정됐다.
> 슬랙 프로필·채널 소속으로 반을 유추하는 방법이 정해지면 `needsClassSelection`은 항상 `false`가 되고
> `PUT /api/me/class`는 설정 화면 전용으로 남는다.

### `PUT /api/me/class`
```json
{ "classId": 1 }
```

### `POST /api/auth/logout`
204.

---

## 3. 일정

### `GET /api/schedules`

| 파라미터 | 필수 | 설명 |
| --- | --- | --- |
| `classId` | ✕ | 없으면 내 반 (인증 후) |
| `from` / `to` | ✕ | 날짜 범위. 없으면 과정 전체 23주 |

```json
[
  {
    "id": 14,
    "classId": 1,
    "date": "2026-08-03",
    "weekday": "월",
    "weekNo": 4,
    "subject": "데이터 분석을 위한 Python 이해",
    "instructor": "박창렴",
    "classMode": "ONSITE",
    "materialCount": 2,
    "hasMyRecord": true
  }
]
```

**화면이 요구하는 파생 필드** — 목록에서 바로 필요하다. 없으면 N+1 요청이 난다.

| 필드 | 쓰는 화면 |
| --- | --- |
| `weekday` | 일정표 행, 홈 일정 목록 (서버 계산이 안전 — 로케일 이슈 없음) |
| `materialCount` | 일정표 `📎2` 배지 (spec §5.2 — 이게 자료찾기 2클릭의 근거) |
| `hasMyRecord` | 일정표 `●` 점. 23주 통째로 "내가 뭘 남겼나"가 보이는 장치 |
| `classMode` 🆕 | 홈 `현강`/`온라인` 배지 |

> `classMode`는 **아직 DB에 컬럼이 없다.** 프론트는 임시로 과목명 정규식(`/특강|온라인|원격/`)으로
> 판별 중이며(`Home.tsx: classModeOf`), 컬럼이 생기면 그 함수를 지운다.
> 마이그레이션: `ALTER TABLE schedule ADD COLUMN class_mode VARCHAR(10) NOT NULL DEFAULT 'ONSITE'`

### `GET /api/schedules/{id}`
단건. 위와 같은 모양 + `materials`, `submissions`를 포함해도 된다(일정 상세는 한 번에 그린다).

### `POST /api/schedules` 🆕 · ADMIN
```json
{ "classId": 1, "date": "2026-08-03", "weekNo": 4,
  "subject": "데이터 분석을 위한 Python 이해", "instructor": "박창렴", "classMode": "ONSITE" }
```
`weekNo`는 서버가 `date`로 계산해 채워도 된다(spec §5.6 — 자동 계산 후 수정 가능).

### `PATCH /api/schedules/{id}` 🆕 · ADMIN
부분 수정. 인라인 편집(A2-a)에서 4필드만 보낸다.

### `DELETE /api/schedules/{id}` 🆕 · ADMIN

연결된 자료·기록이 있으면 **막는다**(spec §5.6):

```json
// 409
{ "code": "SCHEDULE_HAS_REFERENCES",
  "message": "이 일정에 기록 3건, 자료 2건이 연결되어 있습니다",
  "detail": { "submissionCount": 3, "materialCount": 2 } }
```

프론트(A2-b)는 이 `detail`로 경고 문구를 만들고 `[삭제] [날짜만 수정]`을 띄운다.
강제 삭제는 `?force=true`.

---

## 4. 강의자료

### `GET /api/materials?scheduleId={id}`

```json
[
  {
    "id": 14,
    "scheduleId": 14,
    "title": "Python 기초 문법 정리.pdf",
    "kind": "FILE",
    "ext": "PDF",
    "fileSize": "2.1MB",
    "url": "https://…",
    "status": "APPROVED",
    "sourceRef": "슬랙 원본",
    "sourceUrl": "https://theskala.slack.com/files/…",
    "postedAt": "2026-08-03T09:40:00+09:00",
    "uploaderName": "박창렴"
  }
]
```

`kind: LINK`면 `ext`/`fileSize`는 `null`. 프론트는 `FILE`→`↓`, `LINK`→`↗`로 아이콘을 가른다.

### `GET /api/materials/pending` 🆕 · ADMIN

승인함(A1). 판단에 필요한 정보가 **한 행에 다 있어야 한다**(spec §5.5).

```json
{
  "items": [
    {
      "id": 21, "title": "numpy_실습_최종본.pdf", "kind": "FILE",
      "ext": "PDF", "fileSize": "3.2MB",
      "uploaderName": "권기창", "postedAt": "2026-08-03T11:02:00+09:00",
      "sourceUrl": "https://theskala.slack.com/…",
      "matchedScheduleId": 14,
      "matchConfidence": "EXACT"
    }
  ],
  "counts": { "pending": 8, "collectedToday": 3 }
}
```

`matchConfidence`: `EXACT` | `GUESS` | `null`(매칭 실패).
`GUESS`면 화면에 `⚠ 추정` 배지가 붙는다 — 관리자에게 어디를 볼지 알려주는 장치.

### `POST /api/materials` · ADMIN
수동 등록. 현재 구현됨.

### `PATCH /api/materials/{id}` 🆕 · ADMIN
매칭 일정 인라인 변경: `{ "scheduleId": 15 }`

### `POST /api/materials/approve` 🆕 · ADMIN
```json
{ "ids": [21, 22, 23] }
```
단건도 배열 하나로 보낸다. 모바일은 단건만, 데스크톱은 일괄(spec §16 #6 — 유일하게 승인된 플랫폼 차이).

### `POST /api/materials/reject` 🆕 · ADMIN
```json
{ "ids": [24], "reason": "중복 업로드" }
```
`reason`은 선택.

---

## 5. 내 기록 (Submission)

### `GET /api/submissions`

| 파라미터 | 설명 |
| --- | --- |
| `scheduleId` | 일정 상세의 "내 기록" 섹션 |
| `type` | `ASSIGNMENT` \| `NOTE` — 내 기록 필터 칩 |
| `sort` | `RECENT`(기본) \| `WEEK` — 정렬 세그먼트 |
| `cursor` / `limit` | 더 보기 |

```json
{
  "items": [
    {
      "id": 1, "scheduleId": 14, "type": "NOTE",
      "title": "pandas DataFrame 기본 연산 정리",
      "body": "loc / iloc 차이…",
      "visibility": "PRIVATE",
      "createdAt": "2026-08-03T14:20:00+09:00",
      "updatedAt": "2026-08-03T14:20:00+09:00",
      "attachments": [
        { "id": 1, "name": "pandas_치트시트.png", "size": "340KB", "url": "https://…" }
      ],
      "schedule": { "id": 14, "subject": "데이터 분석을 위한 Python 이해", "weekNo": 4, "date": "2026-08-03" }
    }
  ],
  "nextCursor": null
}
```

**`schedule`을 끼워 보내는 이유** — "내 기록" 화면은 항목마다 과목명·주차를 보여준다.
없으면 목록 한 페이지에 12번 추가 요청이 난다.

### `GET /api/submissions/summary` 🆕
내 기록 요약 스트립 (`총 12건 · 과제 5 · 노트 7 · 첨부 4`).

```json
{ "total": 12, "assignment": 5, "note": 7, "attachment": 4, "currentWeekNo": 4, "totalWeeks": 23 }
```

### `POST /api/submissions`
```json
{ "scheduleId": 14, "type": "NOTE", "title": "…", "body": "…", "visibility": "PRIVATE" }
```

**첨부는 여기 넣지 않는다.** spec §16 #3 — API는 2단계, UI만 1회로 보이게 한다(낙관적 업로드).
프론트는 이 응답을 받자마자 목록에 항목을 꽂고, 첨부는 백그라운드로 올린다.

### `POST /api/submissions/{id}/attachments` · `multipart/form-data`

- 필드명 `files`, 복수 가능
- 제한: **20MB / 5개 / 허용 확장자** — 프론트가 선택 즉시 사전 검증하고 서버는 최종 방어
- 실패해도 기록 본문은 이미 저장돼 있다 → 프론트는 `⚠ 첨부 실패 · 다시 시도`만 인라인 표시

### `PATCH /api/submissions/{id}`
제목·본문·타입 수정.

### `DELETE /api/submissions/{id}`

**소프트 삭제** (`deleted_at`). 확인 모달 없이 즉시 삭제 + 5초 실행 취소(spec §16 #4).

### `POST /api/submissions/{id}/restore` 🆕
실행 취소용. `deleted_at`이 5분 이내면 복구, 아니면 410 `RESTORE_WINDOW_EXPIRED`.

---

## 6. 공지 🆕

슬랙 `#공지` 채널 수집분. 홈 공지 블록.

### `GET /api/notices?limit=3`

```json
{
  "items": [
    {
      "id": 1,
      "title": "8/3(월) 특강 시간표 변경 안내",
      "scope": "CLASS",
      "scopeLabel": "우리반",
      "postedAt": "2026-08-03T08:50:00+09:00",
      "url": "https://theskala.slack.com/archives/…"
    }
  ],
  "unreadCount": 2
}
```

`scope`: `CLASS`(우리반) | `FLOOR`(4층) | `CAMPUS`(판교).
프론트는 이 값으로 배지 색을 가른다 — 보라 / 민트 / 중립.

> **수집 방식이 미정이다.** 슬랙 Events API 구독 vs 주기적 `conversations.history` 폴링.
> `scope`를 채널별로 매핑할지(`#공지-1반`, `#공지-4층`) 메시지 본문에서 파싱할지도 정해야 한다.

---

## 7. 식단 🆕

### `GET /api/meals?from=2026-08-03&to=2026-08-07`

```json
[
  {
    "date": "2026-08-03",
    "lunch": ["제육볶음", "미역국", "계란찜", "배추김치", "요구르트"],
    "dinner": ["순두부찌개", "잡채", "깍두기", "단호박샐러드"]
  }
]
```

메뉴는 **문자열 배열**이다. 화면이 항목마다 점을 찍어 나열한다(`.pen` 식단 상세 패널).
주말은 아예 항목이 없다.

> **데이터 소스 미정.** 급식 업체 공지(슬랙/PDF)를 파싱할지, 관리자가 수동 입력할지.
> 수동이라면 `POST /api/meals` (ADMIN)가 추가로 필요하다.

---

## 8. 쇼케이스 🆕

### `GET /api/showcase`

```json
{
  "items": [
    {
      "id": 1,
      "name": "SKALog",
      "summary": "설정 없이 바로 쓰는 학습 기록장",
      "team": "판교 1반 · 탁연우",
      "url": "https://…",
      "createdAt": "2026-08-01"
    }
  ]
}
```

최신순 고정. 필터·검색 없음(spec §15 — 검색 바는 그리지 않는다).

> 등록 경로가 미정이다. 교육생이 직접 올리는 폼을 만들면 `POST /api/showcase`와
> 관리자 승인 흐름이 붙는다. v1은 **관리자 수동 입력(읽기 전용 API)**로 두는 게 범위상 맞다.

---

## 9. 화면 ↔ 엔드포인트 대응

| 화면 | 호출 |
| --- | --- |
| 홈 (M1/D1) | `GET /me` · `GET /schedules?from&to` · `GET /materials?scheduleId` · `GET /submissions?limit=3` · `GET /notices?limit=3` · `GET /meals?from&to` |
| 일정표 주간/월간 (M2·M3/D2) | `GET /schedules` (전체 23주, `materialCount`·`hasMyRecord` 포함) |
| 일정 상세 (M4/D3) | `GET /schedules/{id}` · `GET /materials?scheduleId` · `GET /submissions?scheduleId` |
| 내 기록 (M5/D4) | `GET /submissions?type&sort&cursor` · `GET /submissions/summary` |
| 쇼케이스 (M6/D5) | `GET /showcase` |
| 로그인 (M7) | `GET /auth/slack/authorize` |
| 반 선택 (M8) | `GET /me` · `PUT /me/class` |
| 자료 승인함 (A1) | `GET /materials/pending` · `POST /materials/approve` · `POST /materials/reject` · `PATCH /materials/{id}` |
| 일정 관리 (A2) | `GET /schedules` · `POST` · `PATCH` · `DELETE` |
| 컴포저 저장 | `POST /submissions` → `POST /submissions/{id}/attachments` |

---

## 10. 남은 결정

| # | 항목 | 메모 |
| --- | --- | --- |
| 1 | 슬랙 공지 수집 방식 | Events API 구독 vs 폴링. `scope` 판별 규칙 |
| 2 | 식단 데이터 소스 | 파싱 vs 관리자 입력 |
| 3 | 쇼케이스 등록 주체 | 관리자 수동(v1 권장) vs 교육생 제출 + 승인 |
| 4 | 반 자동 판별 | spec §16 #5 후속. 슬랙 프로필/채널 → 반 매핑 |
| 5 | `class_mode` 컬럼 | 마이그레이션 필요. 지금은 프론트 정규식 임시 판별 |
| 6 | 파일 저장소 | `fileKey` 컬럼은 있는데 S3/로컬 미정. 다운로드 URL 서명 방식도 |
| 7 | 인증 전 파라미터 | `userId`/`classId` 쿼리 파라미터를 세션으로 전부 교체 |
