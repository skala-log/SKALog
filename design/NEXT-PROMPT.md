# SKALog 프론트엔드 — 이어서 작업할 때 붙여넣는 프롬프트

> 회사에서 Claude Code 새로 켰을 때 아래 "복붙용 프롬프트"만 그대로 붙여넣으면 됨.
> 그 아래는 참고용 컨텍스트(현재 상태 / 남은 일 / 주의사항).

---

## 복붙용 프롬프트

```
SKALog 프론트엔드 작업 이어서 할 거야. `design/NEXT-PROMPT.md` 를 먼저 읽고 시작해.

핵심 규칙:
- `design/prototype.pen` 이 유일한 정답 소스다. `docs/ui-ux-spec.md` 는 요약본이라 신뢰하지 말 것.
- .pen 은 암호화 파일이다. 반드시 pencil MCP 툴로만 접근 (Read/Grep 금지).
- 백엔드 연결 없음. mock 데이터로만 동작.
- 구현했으면 반드시 스크린샷을 찍어서 .pen export 와 일일이 눈으로 대조할 것. "구현했다" 는 보고는 대조 후에만.

이번에 할 일: 아래 "남은 일" 섹션 1번부터 순서대로.
```

---

## 현재 상태 (2026-08-03 기준)

- 브랜치: `design/ui-ux-prototype`
- 프론트: `frontend/` — Vite 8 + React 19 + TS + react-router-dom v7 + Tailwind v4 + lucide-react
- 실행: `cd frontend && npm install && npm run dev` → http://localhost:5174
- 백엔드 없음. 전부 `frontend/src/lib/mock.ts` + `frontend/src/lib/schedules.ts` 의 mock 데이터로 동작.
  - `schedules.ts` 는 `backend/src/main/resources/db/migration/V3__real_schedule.sql` 의 실제 1반 일정을 옮겨 담은 것.
- `npx tsc -b --noEmit` 통과, `npx vite build` 통과, 브라우저 콘솔 에러 0.

### 구현된 라우트

| 경로 | 화면 | .pen 노드 |
|---|---|---|
| `/` | M1 홈 / D1 데스크톱 홈 | `ma3xy` / `mV6Fp` |
| `/timeline` | M2 일정표(주간) | `qNqFY` |
| `/timeline?view=month` | M7 월간 캘린더 / D4 데스크톱 캘린더 | `PmtUx` / `WPXKz` |
| `/timeline/:id` | M3 일정 상세 / D2 데스크톱 상세 | `y30Qw1` / `UJ18c` |
| `/records` | M4 내 기록 / D3 데스크톱 내 기록 | `G2TPg` / `qDmVh` |
| `/login` | M5 로그인 | `EEDNh` |
| `/class-select` | M6 반 선택 | `fey9g` |
| `/admin/materials` | A1 자료 승인함 | `XOFB4` |
| `/admin/schedules` | A2 일정 관리 (+ A2-a 인라인 편집, A2-b 삭제 확인) | `TMhSV` / `A3uj2e` / `k0JTK` |

### 상태 화면 (S1~S8) — 쿼리스트링으로 직접 확인

| 화면 | URL | .pen |
|---|---|---|
| S1 로딩 | `/?state=loading` | `bSwvB` |
| S2 오늘 강의 없음 | `/?state=no-class` | `bMd4o` |
| S3 컴포저 펼침 | `/timeline/:id` 에서 컴포저 클릭 | `k5uog` |
| S4 저장 직후 | 컴포저 저장 시 | `HULce` |
| S5 자료 없음 | 자료 없는 일정 상세 | `W50odo` |
| S6 기록 빈 상태 | `/records?state=empty` | `jecJH` |
| S7 아코디언 접힘 | `/timeline` 기본 | `Fv0J1` |
| S8 카드 에러 | `/?state=error` | `p11orv` |

---

## 남은 일 (우선순위 순)

### 1. .pen ↔ 화면 최종 대조 마무리 — **진행 중이던 작업**

이미 대조 끝내고 수정까지 완료한 화면: **M1, M2, M3, M7, D1, D2, D3, M4, D4, A1, A2**

아직 최근 수정 이후로 다시 눈으로 확인 안 한 화면:
- **S1~S8 상태 화면 8개** — `MaterialRow`(아이콘 칩 제거 + `card`/`fill` variant), `Card` placeholder(점선 → 단색 옅은 판), `TodayBadge` solid variant 가 바뀐 뒤로 재확인 안 됨.
- **M5 로그인(`EEDNh`), M6 반 선택(`fey9g`)** — 초기 구현 이후 재대조 안 됨.

대조 방법:
```bash
# 1) .pen 화면 내보내기 (pencil MCP export_nodes 사용)
#    filePath: design/prototype.pen, outputDir: <scratchpad>/pen, nodeIds: [...]
# 2) 브라우저 캡처
cd frontend && npm run dev            # 5174
node <scratchpad>/verify.mjs          # 25개 화면 전체 캡처
node <scratchpad>/spot.mjs            # 뷰포트만 캡처(긴 페이지용)
# 3) Read 툴로 두 PNG 를 열어서 나란히 비교
```
> `verify.mjs` / `spot.mjs` 는 세션 스크래치패드에 있던 거라 새 세션에선 없다. Playwright 로 다시 짜면 됨
> (`chromium.launch({ channel: 'chrome' })` 사용 — 이 맥에 `chromium-cli` 없음).
> 긴 페이지는 `fullPage: true` 로 찍으면 다운샘플링돼서 못 알아본다 → 뷰포트만 찍을 것.

### 2. D3 데스크톱 사이드바 하단 유저 칩 확인
`.pen qDmVh` 는 사이드바 맨 아래에 `탁연우 · 판교 1반` 칩이 있고, 우측 하단에 `전역 슬롯` 플레이스홀더가 떠 있다.
`Shell.tsx:128` 에 유저 칩은 있는데, 우측 하단 전역 슬롯은 아직 없음. .pen 다시 확인하고 필요하면 추가.

### 3. 백엔드 연동
`docs/` 의 API 명세 + `backend/` 기준으로 mock store 를 실제 API 호출로 교체.
- 지금은 `frontend/src/lib/store.tsx` 가 in-memory Context store.
- 여기만 갈아끼우면 페이지 코드는 그대로 갈 수 있게 짜놨음.

---

## 주의사항 (같은 실수 반복 금지)

1. **`.pen` 이 정답이다.** 이전에 `docs/ui-ux-spec.md`(요약 마크다운)만 보고 구현했다가 전체를 다시 만들었다.
   반드시 pencil MCP `export_nodes` 로 실제 화면을 뽑아서 대조할 것.
2. **`.pen` 은 암호화 파일** — `Read`/`Grep` 절대 쓰지 말 것. pencil MCP 툴만.
   `get_app_state` 는 4개 boolean 플래그를 전부 넘겨야 한다.
3. **Tailwind v4**: `tailwind.config.js` 없음. `frontend/src/index.css` 의 `@theme` 가 토큰 정의.
   - layer 없는 CSS 가 `@layer utilities` 를 이긴다 → base reset 은 반드시 `@layer base` 안에.
   - `@import "tailwindcss"` 는 인라인되므로 다른 `@import`(폰트 등)는 그 **위**에 와야 한다.
4. **macOS 에 `timeout` 바이너리 없음** → 대기 루프는 `for i in $(seq 1 40)` 로.
5. 디자인이 **일부러 뺀 것**을 임의로 더하지 말 것. 지금까지 잡은 drift 패턴이 전부 이거였다:
   불필요한 chevron, 개수 배지, 여분 링크, 회색 칩(→ .pen 은 흰 배경 + 테두리 칩), 칩 배지(→ .pen 은 그냥 글자).
