import { REAL_SCHEDULES } from './schedules'
import type { Material, Schedule, Submission, User } from './types'

export const TODAY_ISO = '2026-08-03'
export const TOTAL_WEEKS = 23

export const CURRENT_USER: User = {
  name: '탁연우',
  className: '1반',
  campus: '판교',
  role: 'ADMIN', // 관리자 화면(A1/A2)도 프로토타입에서 함께 확인하기 위해
}

export const CLASS_NAME = `${CURRENT_USER.campus} ${CURRENT_USER.className}`
export const USER_NAME = CURRENT_USER.name

export const MOCK_SCHEDULES: Schedule[] = REAL_SCHEDULES

const byDate = new Map(MOCK_SCHEDULES.map((s) => [s.date, s]))
const idOf = (date: string) => {
  const s = byDate.get(date)
  if (!s) throw new Error(`mock: no schedule on ${date}`)
  return s.id
}

// ── 강의자료 ──────────────────────────────────────────────────────────
// 슬랙 채널에서 수집돼 승인된 자료들. 실제 과목명에 맞춰 구성.
let materialSeq = 0
const mat = (
  date: string | null,
  title: string,
  kind: Material['kind'],
  ext: string | null,
  fileSize: string | null,
  postedAt: string,
  extra: Partial<Material> = {},
): Material => ({
  id: ++materialSeq,
  scheduleId: date ? idOf(date) : null,
  title,
  kind,
  ext,
  url: '#',
  fileSize,
  status: 'APPROVED',
  sourceRef: '슬랙 원본',
  postedAt,
  ...extra,
})

export const MOCK_MATERIALS: Material[] = [
  mat('2026-07-14', '팀빌딩 오리엔테이션.pdf', 'FILE', 'PDF', '1.4MB', '2026-07-14T13:20:00'),
  mat('2026-07-14', 'Git 기본 명령어 치트시트.pdf', 'FILE', 'PDF', '0.6MB', '2026-07-14T16:05:00'),
  mat('2026-07-15', 'HTML_CSS_JS 실습자료.pdf', 'FILE', 'PDF', '3.0MB', '2026-07-15T12:40:00'),
  mat('2026-07-16', '실습 저장소', 'LINK', null, null, '2026-07-16T10:10:00'),
  mat('2026-07-20', '기초통계 강의노트.pdf', 'FILE', 'PDF', '2.4MB', '2026-07-20T14:00:00'),
  mat('2026-07-21', '데이터 전처리 실습.ipynb', 'FILE', 'ZIP', '0.4MB', '2026-07-21T15:12:00'),
  mat('2026-07-27', 'SpringBoot 프로젝트 세팅.pdf', 'FILE', 'PDF', '1.1MB', '2026-07-27T11:30:00'),
  mat('2026-07-28', 'Spring DI 개요.pdf', 'FILE', 'PDF', '2.1MB', '2026-07-28T13:05:00'),
  mat('2026-07-28', '실습 코드 저장소', 'LINK', null, null, '2026-07-28T13:07:00'),
  mat('2026-07-29', 'REST API 설계 가이드.pdf', 'FILE', 'PDF', '1.8MB', '2026-07-29T14:22:00'),
  mat('2026-07-30', 'JPA 연관관계 매핑.pdf', 'FILE', 'PDF', '2.6MB', '2026-07-30T13:44:00'),
  mat('2026-07-30', '과제 안내.docx', 'FILE', 'DOCX', '0.2MB', '2026-07-30T17:50:00'),
  mat('2026-07-31', '주차 회고 템플릿', 'LINK', null, null, '2026-07-31T17:10:00'),
  mat('2026-08-03', 'Python 기초 문법 정리.pdf', 'FILE', 'PDF', '2.1MB', '2026-08-03T09:40:00'),
  mat('2026-08-03', 'pandas 실습 노트북.zip', 'FILE', 'ZIP', '4.7MB', '2026-08-03T10:15:00'),
]

// 관리자 승인함(A1)에 뜨는 미승인 자료 — 아직 일정에 붙지 않았거나 매칭이 추정인 것들.
export const MOCK_PENDING_MATERIALS: Material[] = [
  mat('2026-08-03', 'numpy_실습_최종본.pdf', 'FILE', 'PDF', '3.2MB', '2026-08-03T11:02:00', {
    status: 'PENDING',
    matchConfidence: 'EXACT',
  }),
  mat('2026-08-03', '오늘 수업 보충자료 링크', 'LINK', null, null, '2026-08-03T11:20:00', {
    status: 'PENDING',
    matchConfidence: 'EXACT',
  }),
  mat('2026-07-31', 'w03_회고_양식.docx', 'FILE', 'DOCX', '0.3MB', '2026-08-03T09:05:00', {
    status: 'PENDING',
    matchConfidence: 'GUESS',
  }),
  mat(null, 'IMG_4821.png', 'FILE', 'PNG', '1.9MB', '2026-08-03T08:48:00', {
    status: 'PENDING',
  }),
  mat('2026-08-04', 'Python_2일차_예습.pdf', 'FILE', 'PDF', '1.1MB', '2026-08-02T22:31:00', {
    status: 'PENDING',
    matchConfidence: 'GUESS',
  }),
  mat('2026-07-30', 'JPA_보충설명.pdf', 'FILE', 'PDF', '0.8MB', '2026-08-02T20:10:00', {
    status: 'PENDING',
    matchConfidence: 'EXACT',
  }),
  mat(null, '스터디 모집 공지', 'LINK', null, null, '2026-08-02T19:02:00', { status: 'PENDING' }),
  mat('2026-07-29', 'api_설계_예제.zip', 'FILE', 'ZIP', '5.4MB', '2026-08-01T16:40:00', {
    status: 'PENDING',
    matchConfidence: 'GUESS',
  }),
]

// ── 내 기록 ──────────────────────────────────────────────────────────
// 총 12건 / 과제 5 · 노트 7 · 첨부 4 (M4 요약 스트립과 일치)
let submissionSeq = 0
const sub = (
  date: string,
  type: Submission['type'],
  title: string,
  body: string,
  createdAt: string,
  attachments: Submission['attachments'] = [],
): Submission => ({
  id: ++submissionSeq,
  scheduleId: idOf(date),
  type,
  title,
  body,
  createdAt,
  attachments,
})

export const MOCK_SUBMISSIONS: Submission[] = [
  sub(
    '2026-08-03',
    'NOTE',
    'pandas DataFrame 기본 연산 정리',
    'loc / iloc 차이, groupby 후 agg 조합. 인덱스 재설정 잊지 말 것.',
    '2026-08-03T14:20:00',
    [{ id: 1, name: 'pandas_치트시트.png', size: '340KB' }],
  ),
  sub('2026-07-31', 'ASSIGNMENT', 'W03 주차 회고 제출', '이번 주 Spring 파트에서 DI 개념이 가장 어려웠다.', '2026-07-31T18:02:00'),
  sub(
    '2026-07-30',
    'NOTE',
    'JPA 연관관계 매핑 헷갈리는 부분',
    '@OneToMany 기본이 LAZY, @ManyToOne 기본이 EAGER. 양방향일 때 주인은 FK 가진 쪽.',
    '2026-07-30T21:10:00',
    [{ id: 2, name: '연관관계_다이어그램.png', size: '512KB' }],
  ),
  sub('2026-07-30', 'ASSIGNMENT', 'JPA 실습 과제 제출', '', '2026-07-30T19:35:00', [
    { id: 3, name: 'jpa-practice.zip', size: '1.2MB' },
  ]),
  sub(
    '2026-07-29',
    'NOTE',
    'REST API 설계 원칙 요약',
    '리소스는 명사, 행위는 HTTP 메서드. 복수형 사용. 상태코드 201/204 구분.',
    '2026-07-29T20:44:00',
  ),
  sub('2026-07-28', 'NOTE', 'DI 3가지 주입 방식 정리', '생성자 주입 / 세터 주입 / 필드 주입 비교. 공식 문서 기준 생성자 주입 권장.', '2026-07-28T21:10:00'),
  sub('2026-07-28', 'ASSIGNMENT', 'SpringBoot 기초 과제', '', '2026-07-28T18:50:00'),
  sub('2026-07-27', 'NOTE', '프로젝트 세팅 중 막힌 것', 'Gradle 버전 이슈로 빌드 실패 → wrapper 버전 8.5로 고정하니 해결.', '2026-07-27T22:05:00'),
  sub('2026-07-22', 'NOTE', '기초통계 용어 정리', '분산/표준편차/공분산. 상관계수는 -1~1 범위.', '2026-07-22T20:12:00'),
  sub('2026-07-21', 'ASSIGNMENT', '데이터 전처리 실습 제출', '', '2026-07-21T19:00:00', [
    { id: 4, name: 'preprocess.ipynb', size: '220KB' },
  ]),
  sub('2026-07-16', 'NOTE', 'flex vs grid 언제 쓸지', '1차원 배치는 flex, 2차원은 grid. gap은 둘 다 지원.', '2026-07-16T21:30:00'),
  sub('2026-07-14', 'ASSIGNMENT', 'Git 실습 과제 제출', '', '2026-07-14T18:20:00'),
]
