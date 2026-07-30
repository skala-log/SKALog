# 다음 세션 인계 (2026-07-31 오전 → 회사)

## 회사에서 붙여넣을 프롬프트

> 아래 블록을 통째로 복사해서 Claude Code에 붙여넣으면 된다.
> **Pencil 앱을 먼저 열고 `design/prototype.pen`을 로드해 둘 것.** 안 열려 있으면 MCP가 붙지 않는다.

```
SKALog 프로토타입 디자인 작업을 이어서 한다.

컨텍스트 파일 3개를 먼저 읽어라. 이게 전부다. 다른 걸 찾지 마라.
- docs/ui-ux-spec.md      : UI/UX 구성안 (§3.1 색 토큰, §3.1.1 색 사용 금지 규칙, §5 와이어프레임, §6 컴포저 상태, §16 기획서 이탈 7건)
- design/prompts.md       : 단계별 실행 프롬프트 (§0 절대 규칙, §1~§7)
- design/audit-01.md      : §7 마감 점검 1차 결과 — 위반 목록과 미결 결정사항

설계 파일은 design/prototype.pen 이고 Pencil MCP로만 접근한다.
작업 전에 get_app_state({include_schema:true, include_canvas_design:true,
include_scripts_and_shaders:false, include_browser:false}) 를 반드시 호출해서 스키마와
현재 노드 트리를 확보해라.

§1~§6 은 전부 완료됐다. 화면 24개가 이미 들어있다. 새로 만들지 마라.

이번 세션에서 할 일은 audit-01.md 의 "다음 결정이 필요한 것" 6개를 처리하는 것이다.
1번부터 순서대로, 하나 끝낼 때마다 스크린샷으로 확인하고 나에게 보고한 뒤 다음으로 넘어가라.
6번(§16 기획서 이탈 7건)은 내 결정이 필요하니 선택지를 정리해서 물어봐라.

작업 중 반드시 지킬 것:
- width/height 는 반드시 리터럴 숫자로 써라. "$touch-min" 같은 변수는 조용히 무시된다.
  (padding/gap/cornerRadius/fontSize/fill/strokeWidth 는 $변수가 정상 동작한다)
- 인스턴스 내부는 Insert 로 못 건드린다. descendants 맵에 경로 키("instId/childId")로
  오버라이드하거나, type 을 포함한 전체 노드로 교체해라.
- Copy 직후에는 새 자식 id 를 모른다. Get(copy,(n,c)=>Print(c.depth,n.id,n.name),
  {resolveInstances:true}) 로 열거한 뒤 Update/Replace 해라.
- Get(id, cb) 의 반환값은 콜백 결과 "배열"이다. 노드를 직접 받으려 하지 말고
  콜백 안에서 처리해라. c.bounds 는 부모 기준 상대 좌표다.
- "fill_container 인데 flexbox 안이 아니다" 경고는 enabled:false 노드와 인스턴스
  슬롯에서 상시 뜨는 노이즈다. 스크린샷이 정상이면 무시해라.
- 작업이 끝나면 나에게 "Pencil 앱에서 Cmd+S 눌러라"고 알려줘라.
  MCP 로 편집해도 디스크에는 저장되지 않는다. 이거 빼먹으면 작업이 전부 날아간다.
```

---

## 지금까지 진행 상황

### 완료

| 단계 | 내용 | 상태 |
|---|---|---|
| — | `docs/ui-ux-spec.md` UI/UX 구성안 16개 절 | ✅ |
| — | `design/prompts.md` 단계별 실행 프롬프트 | ✅ |
| §1 | 디자인 토큰 50개 (`00 · Tokens` 판) | ✅ |
| §2 | 공용 컴포넌트 14종 (`01 · Components` 판) | ✅ |
| §3 | 모바일 화면 6개 M1–M6 (375×812) | ✅ |
| §4 | 상태 화면 8개 S1–S8 + 흐름 연결 지시서(`02 · 프로토타입 흐름`) | ✅ |
| §5 | 데스크톱 3개 D1–D3 (1440×900) | ✅ |
| §6 | 관리자 A1 자료 승인함, A2 일정 관리 + 변형 2개(A2-a 인라인 편집, A2-b 삭제 경고) | ✅ |
| §7 | 마감 점검 1차 → `design/audit-01.md` | ✅ |

**총 24개 프레임.** 전부 스크린샷 검증 완료.

### 미결

1. `design/audit-01.md` 의 위반 12건 수정 여부 결정
2. `docs/ui-ux-spec.md` §16 기획서 이탈 7건 승인/반려 ← **가장 중요.** 이게 정해져야 프론트엔드 착수 가능

---

## 알아둘 것

- **`.pen` 파일에는 인터랙션/핫스팟 속성이 아예 없다.** 그래서 §4의 클릭 흐름은 실제 링크가 아니라
  `02 · 프로토타입 흐름` 보드에 흐름별 검증 포인트를 적은 문서로 만들었다.
  클릭 가능한 프로토타입이 필요하면 Figma로 옮기거나 코드로 바로 가야 한다.
- **모바일 화면은 375×812 고정 + `clip:true`** 라서 폴드 아래 콘텐츠는 잘린다(M1 4번째 카드 등).
  버그가 아니라 "첫 화면에 뭐가 보이는가"를 정직하게 보여주는 뷰다.
- Pencil MCP 편집은 **앱 메모리에만** 반영된다. Cmd+S 전까지 디스크의 `.pen` 은 그대로다.

---

## 컴포넌트 마스터 ID (Pencil 조작 시 필요)

```
Badge      zWNLL  (label lmFN1)
Dot        aOR6f
BadgeIcon  t2ns28 (glyph h5HpKh, label y49R1S)
Card       phV74  (Head GKpal, Title WjBNO, Meta QX5IP, Body slot Za40Y)
ListItem   CxxDW  (Accent TshJZ, Main nniD2, TopRow ktOLI, LeadBadge gLpye,
                   Title gNiU2, TrailBadge rfSnM, Meta etdqs, Trail pZLhh,
                   HasRecord LtctJ, Chevron d76kNV)
Composer/Collapsed m3Wlc (Plus OaB7E, Label aWvxv)
Composer/Expanded  CrFdG (ContextText jF0J5, Seg노트 QyPPB/JGb2K,
                   Seg과제 L1VKzr/UzBUB, Field/Title t6InX8/DiwRZ, Caret G1qWs,
                   Field/Body MsCUe/XtuJD, FileChips RAIEC, Toolbar IyjmL,
                   Btn파일 eihnq, Btn링크 TLgzM, Btn취소 e2wBdG,
                   Btn저장 DbAd4/N20wI9)
EmptyState fgwC7  (Icon CfQIq, Message FqqjZ, Sub I6as1a, Btn AH5h8/zjVBj)
Sheet      BiAQO  (Grabber sRNRt, Header HPD5H, Title PciMX, Close iU82f, Body qeNC9)
AppHeader  Wz08H  (Back z7zkC, Title b0yrbA, Right tBYW4)
TabBar     tnWL6  (오늘 K1DMX/xzv4L/nhDHA, 일정표 jHEE3/Z2wCf0/Sv3U2,
                   내기록 tfe4l/q3EQ9n/TKbJq)
WeekRow    CRePe  (Accent xAJiy, Day b407BZ, Date F1upG, Subject tKhG6,
                   Clip U9OYk, HasRecord fTyrS)
NavItem    MfhSN  (Icon B7pUzF, Label YsjqB)
Sidebar    ckNFx  (today LLAbT, timeline HASse, records x7W0pr,
                   admin-mat HVhHj, admin-sch vvkTh)
```

## 화면 루트 ID

```
u58CS9 00·Tokens    Ta8Oo 01·Components   e6PnK1 02·흐름판
ma3xy  M1 홈        qNqFY M2 일정표        y30Qw1 M3 일정상세
G2TPg  M4 내기록     EEDNh M5 로그인        fey9g  M6 반선택
bSwvB  S1 로딩       bMd4o S2 강의없음      k5uog  S3 컴포저펼침
HULce  S4 저장직후   W50odo S5 자료없음     jecJH  S6 빈상태
Fv0J1  S7 아코디언닫힘  p11orv S8 카드에러
mV6Fp  D1 홈        UJ18c D2 상세          qDmVh  D3 내기록
XOFB4  A1 승인함     TMhSV A2 일정관리
A3uj2e A2-a 인라인편집  k0JTK A2-b 삭제경고
```
