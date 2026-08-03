# SKALog — 다음 세션 이어서 작업하기 (2026-08-03 기록)

> 집/회사에서 Claude Code 새로 켰을 때 아래 "복붙용 프롬프트"만 붙여넣으면 된다.
> 그 아래는 이 세션에서 실제로 무슨 일이 있었는지, 무엇이 미결인지 전부 적은 기록이다.
>
> 이전 문서: [`NEXT-PROMPT.md`](./NEXT-PROMPT.md) — 여전히 유효하나, 이 문서가 더 최신이다.

---

## 복붙용 프롬프트

```
SKALog 작업 이어서 할 거야. design/next-session2.md 를 먼저 읽고 시작해.

핵심 규칙:
- design/prototype.pen 이 유일한 정답 소스다. docs/ui-ux-spec.md 는 요약본이라 신뢰하지 말 것.
- .pen 은 암호화 파일이다. 반드시 pencil MCP 툴로만 접근 (Read/Grep 금지).
- ★ .pen 을 건드리기 전에 Pencil 앱을 완전 종료(Cmd+Q) 후 재실행하고,
  최상위 프레임 목록이 이 문서의 목록과 맞는지 먼저 확인할 것.
  (앱 메모리와 디스크가 어긋나 작업이 날아간 사고가 이미 두 번 있었다)
- 백엔드 연결 없음. mock 데이터로만 동작.
- 구현했으면 반드시 .pen export ↔ 브라우저 캡처를 눈으로 대조하고 나서 "했다"고 보고할 것.

이번에 할 일: 아래 "남은 일" 1번부터.
```

---

## 이 세션에서 한 일

### A. §7 마감 점검 후속 — S1~S8 · M5 · M6 대조 (완료)

`NEXT-PROMPT.md` 1번 과제. `.pen` export ↔ Playwright 캡처를 10개 화면 눈으로 대조하고 drift 전부 수정했다.

| 화면 | 고친 것 |
|---|---|
| M5 | 워드마크 24→**34px**, 버튼 48→**56**, 라벨 15→**17** |
| M6 | 질문 20→**24**, 셀렉트·버튼 48→**56**, 값/라벨 15→**17**, 간격 24 통일 |
| S1 | 카드3이 로딩 무시하고 실데이터 렌더 → 카드 3장 모두 스켈레톤. 진행바도 로딩 중엔 그라데이션 숨김 |
| S2 | 구성 전면 교체 — "다음 강의" 헤더 + 날짜 배지 + `강의자료 0` + 자료없음 안내 + "최근 강의(M/D)에 기록 남기기" |
| S3 | 컴포저 스타일 정정 + **키보드 위 sticky 저장 바 신규** (§6.3 규칙이 아예 빠져 있었음) |
| S5 | 자료없음 회색 1줄 → 흰 카드 + 테두리 2줄 |
| S6 | 빈 상태에서 필터 칩 제거, EmptyState 아이콘 원형 배경 제거, 안내문 2번째 줄 복원 |
| S8 | **에러 카드가 카드1이 아니라 카드2(이번 주)** — 대상이 반대였음. 아이콘 `cloud-off`, 아웃라인 버튼 |
| 공통 | 일정표 행 `border-t` 제거, **홈 가로 스크롤 버그(386→375px)** 수정 — `min-w-0` 누락이 원인 |

`NEXT-PROMPT.md` 2번(전역 슬롯)은 **조치 불필요**로 결론. `.pen` 의 `전역 슬롯 96×96` 박스는 구현할 UI 가 아니라 설계 주석이다(spec §2.3 — "v1에서는 아무것도 렌더하지 않는다"). 1440×900 에서 해당 영역이 비어 있는 것 확인.

### B. 홈 재설계 + 신규 화면 (완료)

사용자 요구 6건 반영. 계획서는 [`home-redesign-plan.md`](./home-redesign-plan.md).

1. **탭 이름 `오늘` → `홈`** — `.pen` TabBar/Sidebar 마스터 + `Shell.tsx`
2. **슬랙 공지** 홈에 표시 (mock)
3. **주간 식단표** 홈에 표시 (5열 스트립, 열 클릭 시 중·석식 아코디언)
4. **외부 서비스 바로가기 레일** — 아래 실제 URL 반영
5. **쇼케이스 페이지** 신규 (`/showcase`) — 타 교육생 서비스 아카이브
6. **월간 캘린더** `.pen` 에 신규 작성 (아래 C 참조)

홈 구조를 **4층**으로 재편: 히어로(인사·날짜·진행·오늘강의) → 바로가기 레일 → 공지·식단 → 이번주·최근기록.
기존 "공지·출결 카드가 들어올 자리" placeholder 는 실제 공지가 생겼으므로 삭제.

**실제 URL** (`lib/mock.ts` `QUICK_LINKS`)

| 라벨 | URL |
|---|---|
| 훈련생 포털 | `https://student.skala-ai.com/` |
| SKALA HUB | `https://skala-hub.vercel.app/` |
| 출결 체크인 | `https://att.skala-ai.com/att-checkin` |
| 회의실 예약 | `https://tabling.skala-ai.com/` (utm 파라미터 제거함) |
| Udemy | `https://skala2.udemy.com/organization/home/` |
| 쇼케이스 | `/showcase` (내부) |

### C. `.pen` 월간 캘린더 복구 (완료)

이전 커밋 `f377b9c` 의 메시지에는 "월간 캘린더 뷰 신규 (.pen M7 모바일 / D4 데스크톱)" 이라고 적혀 있었으나
**실제 커밋된 `.pen` 에는 그 프레임이 없었다** (전체 1098 노드를 훑어도 `PmtUx`/`WPXKz` 없음).
Pencil 앱 메모리에만 만들고 저장 전에 커밋한 것으로 보인다. 이번에 다시 그려 넣었다.

### D. 일정표 개선 (완료)

- 주차 헤더 `text-label`(14) → **`text-heading`(17) semibold**, 날짜 범위는 `text-label`
- **주차 아코디언** — 헤더 전체가 토글. **이번 주만 펼쳐진 채로** 시작. 접힌 주차엔 `5일` 표시
- **`이번 주` 마커** — 옅은 배지 → **`today-vivid` 채움 + 흰 글씨 + 앞 점**
- **지난 수업 흐리게** — 주간/월간 모두 `opacity-55`
  ⚠️ 이건 **spec §5.2 와 충돌한다** ("지난 주차는 텍스트 대비를 낮추지 **않는다**. 포트폴리오 축이라 과거가 열등해 보이면 안 된다").
  사용자가 명시적으로 요청해 반영했으나 **spec 문장을 아직 안 고쳤다** → 남은 일 3번

### E. 사이드바 고정 (완료)

`aside` 에 `lg:sticky lg:top-0 lg:h-dvh` + `self-start`. `self-start` 가 없으면 flex stretch 때문에
높이가 본문만큼 늘어나 sticky 가 안 걸린다. 일정표 최하단(scrollY 6662)에서도 고정 확인.

### F. 홈 "조잡함" 개선안 — D1-b / M1-b 프레임으로 시안만 제작 (검토 대기)

사용자 피드백: "홈 탭이 조잡하다, 한눈에 안 들어온다."

측정 결과(근거):

| | 모바일 | 데스크톱 |
|---|---|---|
| 히어로 한 덩어리 | 440px (뷰포트 54%) | 476px (53%) |
| 홈 전체 높이 | 1636px | **1238px > 900** → 한 화면에 안 들어옴 |

원인 5가지: ①히어로 과적 ②회색 위 회색(hero `bg-subtle` + 자료 행 `bg-subtle`) ③섹션 헤더 4종류
④데스크톱 가로 낭비 ⑤블록 무게가 전부 비슷해 위계 없음.

**안 B(2열 재배치)** 로 시안 제작 → `D1-b`, `M1-b` (아래 프레임 목록 참조). **기존 M1/D1 은 그대로 둠.**

- `D1-b` : 상단 얇은 스트립(49px) / 좌 580 = 오늘 강의 + 이번 주 / 우 280 = 바로가기 2×3 · 공지 3 · 식단 5열 / 하단 전폭 = 내 최근 기록
  → **총 851px, 한 화면에 들어감** (기존 1238px)
- `M1-b` : 히어로 440 → **79px**(인사+날짜+진행만), 오늘 강의는 흰 카드로 분리
- **콘텐츠 축소는 하지 않음**(사용자 지시). 공지 3건·식단 5열 유지, 여백만 조임

---

## `.pen` 최상위 프레임 목록 (2026-08-03 기준 · 30개)

```
u58CS9  00 · Tokens              Ta8Oo   01 · Components
e6PnK1  02 · 프로토타입 흐름
ma3xy   M1 · 홈                  qNqFY   M2 · 일정표
y30Qw1  M3 · 일정 상세           G2TPg   M4 · 내 기록
EEDNh   M5 · 로그인              fey9g   M6 · 반 선택
rknlZ   M7 · 일정표 (월간) ★신규  LlNDU   M8 · 쇼케이스 ★신규
bSwvB   S1 · 홈 / 로딩           bMd4o   S2 · 홈 / 오늘 강의 없음
k5uog   S3 · 컴포저 펼침+키보드   HULce   S4 · 저장 직후
W50odo  S5 · 자료 없음           jecJH   S6 · 내 기록 빈 상태
Fv0J1   S7 · 아코디언 닫힘        p11orv  S8 · 카드 단위 에러
mV6Fp   D1 · 데스크톱 홈          UJ18c   D2 · 데스크톱 일정 상세
qDmVh   D3 · 데스크톱 내 기록     QNwiq   D4 · 데스크톱 일정표(월간) ★신규
lkgZA   D5 · 데스크톱 쇼케이스 ★신규
XOFB4   A1 · 자료 승인함          TMhSV   A2 · 일정 관리
A3uj2e  A2-a · 행 인라인 편집     k0JTK   A2-b · 삭제 경고
O8LLed  D1-b · 데스크톱 홈 (2열 재배치안) ★검토 대기
QSiEe   M1-b · 홈 (수정안)              ★검토 대기
```

### 신규 컴포넌트 (`01 · Components`)

```
N0TLx  LinkTile     (icon n0X6S, label U8OsET, arrow UVmYm)
g9a9A  NoticeRow    (dot JYifJ, title imy0X, meta Q19o1, arrow h93JXA)
ldXjX  MealCol      (day DZljd, date N2faNk, menu c0i6H)
yVFVu  ShowcaseTile (name fFv1M, summary QXKO1, team J1Zhp, arrow YZwWi)
aFUiO  DayCell      (date g0bTG, subject r0FlEZ, clip Z3xuG, dot TL0v7)
```
+ `HoverStates` 프레임에 Default/Hover 쌍 데모 (Pencil 은 정적이라 톤만 확정, 실제 전환은 프론트 CSS)

### 기존 컴포넌트 마스터

```
zWNLL Badge(lmFN1) · aOR6f Dot · t2ns28 BadgeIcon(h5HpKh,y49R1S)
phV74 Card(WjBNO title, QX5IP meta, Za40Y body slot)
CxxDW ListItem · m3Wlc Composer/Collapsed · CrFdG Composer/Expanded
fgwC7 EmptyState · BiAQO Sheet · Wz08H AppHeader(z7zkC,b0yrbA,tBYW4)
tnWL6 TabBar(nhDHA 홈 / Sv3U2 일정표 / TKbJq 내 기록)
CRePe WeekRow · MfhSN NavItem · ckNFx Sidebar(LLAbT 홈 … x5B8yZ 쇼케이스)
```

---

## frontend 현재 상태

- 브랜치 `design/ui-ux-prototype` · 실행 `cd frontend && npm i && npm run dev` → **http://localhost:5173**
- 검증 전부 통과: `npx tsc -b --noEmit` / `npx vite build` / `npx oxlint src`, 콘솔 에러 0, 375·1440 가로 넘침 0

### 라우트

| 경로 | 화면 | .pen |
|---|---|---|
| `/` | 홈 | `ma3xy` / `mV6Fp` |
| `/timeline` | 일정표(주간) | `qNqFY` |
| `/timeline?view=month` | 일정표(월간) | `rknlZ` / `QNwiq` |
| `/timeline/:id` | 일정 상세 | `y30Qw1` / `UJ18c` |
| `/records` | 내 기록 | `G2TPg` / `qDmVh` |
| `/showcase` | 쇼케이스 | `LlNDU` / `lkgZA` |
| `/login` | 로그인 | `EEDNh` |
| `/onboarding/class` | 반 선택 | `fey9g` |
| `/admin/materials` | 자료 승인함 | `XOFB4` |
| `/admin/schedules` | 일정 관리 | `TMhSV` / `A3uj2e` / `k0JTK` |

상태 화면: `/?state=loading|no-class|error`, `/records?state=empty`

### 이번 세션에 새로 생긴 파일

```
frontend/src/components/HomeBlocks.tsx   LinkRail · BlockHead · NoticeList · MealStrip
frontend/src/pages/Showcase.tsx          /showcase
design/home-redesign-plan.md             홈 재설계 계획서
design/visual-identity-proposal.md       비주얼 아이덴티티 제안 v3 (A안만 채택됨)
```

### 새 데이터 타입 (`lib/types.ts` · 전부 mock)

`Notice` / `MealPlan` / `QuickLink` / `ShowcaseItem`
→ `lib/mock.ts` 의 `MOCK_NOTICES` · `MOCK_MEALS` · `QUICK_LINKS` · `MOCK_SHOWCASE`

---

## 남은 일 (우선순위 순)

### 1. ★ D1-b / M1-b 검토 → 확정 시 본 화면에 반영

사용자가 퇴근 전 시안만 보고 갔다. 집에서 확인 후 판단할 것.

- **OK 라면**: `D1-b` → `mV6Fp`(D1), `M1-b` → `ma3xy`(M1) 에 반영하고 **frontend `Home.tsx` 도 같은 구조로** 수정.
  데스크톱은 `lg:` 브레이크포인트에서 좌 2 : 우 1 그리드, 모바일은 히어로를 인사+날짜+진행만 남기고 오늘 강의를 흰 카드로 분리.
- **아니라면**: `D1-b`/`M1-b` 삭제하고 다른 안(계획서의 안 A 또는 C) 재검토.

### 2. 섹션 헤더 4종 → 1종 통일 (안 B 에 포함됐으나 아직 안 함)

현재 뒤섞여 있음:
`라벨+헤어라인`(식단) / `라벨+헤어라인+더보기`(공지) / `카드제목+배지`(이번 주) / `카드제목+링크`(최근 기록)
→ `제목 + (우측 액션)` 하나로. `.pen` 컴포넌트로 만들어 두고 프론트는 `BlockHead` 로 통일.

### 3. `docs/ui-ux-spec.md` 개정 (밀려 있음)

이번 세션 변경이 spec 에 하나도 반영 안 됐다. 고쳐야 할 것:

- §2.1 화면 목록에 `/showcase` 추가
- §2.2 탭 이름 `오늘` → `홈`, 사이드바 학습 그룹에 쇼케이스
- §5.1 홈 구성 — 4층 구조로 다시 씀. **"3초 안에 읽혀야 한다" 조항은 사용자가 폐기 선언함**
- §5.2 **"지난 주차는 대비를 낮추지 않는다" → 낮추는 것으로 변경** (D절 참조)
- §5.8(신규) 쇼케이스
- §15 "그리지 않을 것" 목록과 이번 추가분(공지·식단·외부링크)의 관계 정리

### 4. 백엔드 연동

`lib/store.tsx` 가 in-memory Context store. 여기만 갈아끼우면 페이지 코드는 그대로 간다.
공지·식단은 실제 데이터 소스가 아직 없다 — 슬랙 연동/식단 API 계약부터 필요.

---

## 주의사항 (같은 실수 반복 금지)

1. **★ Pencil 앱 메모리 ≠ 디스크.** 이 세션에서만 두 번 겪었다.
   - `git pull` 로 `.pen` 이 바뀌어도 앱은 이전 스냅샷을 계속 들고 있다 → 탭만 닫지 말고 **Cmd+Q 후 재실행**
   - 저장 안 하고 커밋하면 작업이 통째로 날아간다 (`f377b9c` 의 월간 캘린더가 그렇게 유실됨)
   - `.pen` 편집 후 커밋 전에 `date -r design/prototype.pen` 로 저장 시각을 꼭 확인할 것
2. **`.pen` 이 정답이다.** `docs/ui-ux-spec.md` 만 보고 구현했다가 전체를 다시 만든 적 있다.
3. **`.pen` 은 암호화 파일** — `Read`/`Grep` 금지, pencil MCP 만. `get_app_state` 는 4개 boolean 을 전부 넘겨야 한다.
4. **Pencil `width`/`height` 는 리터럴 숫자로.** `"$touch-min"` 같은 변수는 **조용히 무시된다.**
   (`padding`/`gap`/`cornerRadius`/`fontSize`/`fill`/`strokeWidth` 는 `$변수` 정상 동작)
5. **JSX 주석을 `return (` 바로 뒤에 두면 파스 에러** — 인접 루트 노드가 된다. 일반 주석으로 함수 위에 쓸 것.
6. **Tailwind v4**: `tailwind.config.js` 없음. `src/index.css` 의 `@theme` 가 토큰. `@import "tailwindcss"` 는 인라인되므로 폰트 `@import` 는 그 **위**에.
7. **grid 아이템에 `min-w-0`** 안 주면 `-mx-*` 목록이 컬럼을 넓혀 가로 스크롤이 생긴다.
8. macOS 에 `timeout` 바이너리 없음 → 대기 루프는 `for i in $(seq 1 40)`.
9. **디자인이 일부러 뺀 것을 임의로 더하지 말 것.** 지금까지 잡은 drift 가 전부 이거였다 —
   불필요한 chevron, 개수 배지, 여분 링크, 회색 칩, 아이콘 원형 배경.

### 검증 스크립트 (스크래치패드에 있던 것 · 새 세션엔 없음, 다시 짜야 함)

Playwright 로 `chromium.launch({ channel: 'chrome' })` 사용 (이 맥에 chromium 없음, Chrome 은 설치돼 있음).
`npm i playwright` 시 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 로 브라우저 다운로드는 건너뛸 것.
긴 페이지는 `fullPage:true` 로 찍으면 다운샘플링돼 못 알아본다 → **뷰포트만** 찍을 것.
