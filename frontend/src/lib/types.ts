export type Weekday = '일' | '월' | '화' | '수' | '목' | '금' | '토'

/** 수업 방식 — .pen `ClassMode` */
export type ClassMode = 'ONSITE' | 'REMOTE'

/** 강사 역할 — .pen `RoleTag/전임` · `RoleTag/실습` */
export type InstructorRole = 'FULL_TIME' | 'PRACTICE'

export type Instructor = {
  name: string
  role: InstructorRole
}

export type Schedule = {
  id: number
  date: string // YYYY-MM-DD
  weekday: Weekday
  weekNo: number
  subject: string
  instructors: Instructor[]
  /** 직강 여부 — 이 반이 현장에서 직접 강의를 듣는지, 다른 반 강의를 중계로 보는지 */
  isLive: boolean
}

export type MaterialKind = 'FILE' | 'LINK'
export type MaterialStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type Material = {
  id: number
  scheduleId: number | null
  title: string
  kind: MaterialKind
  ext: string | null // PDF / ZIP / PPTX ...
  url: string | null
  fileSize: string | null // "2.1MB"
  status: MaterialStatus
  sourceRef: string | null // 슬랙 파일 id/메시지 ts — 재수집 중복 방지용 식별자, 링크 아님
  sourceUrl: string | null // 클릭하면 슬랙 메시지로 이동하는 permalink
  postedAt: string // ISO — when it hit the slack channel
  matchConfidence?: 'EXACT' | 'GUESS'
}

export type SubmissionType = 'NOTE' | 'ASSIGNMENT'

export type Attachment = {
  id: number
  name: string
  size: string
  kind?: MaterialKind
}

export type Submission = {
  id: number
  scheduleId: number
  type: SubmissionType
  title: string
  body: string
  createdAt: string // ISO
  attachments: Attachment[]
}

export type User = {
  name: string
  className: string
  campus: string
  role: 'STUDENT' | 'ADMIN'
}

/** GET /api/me 응답 — 로그인한 사용자 */
export type Me = {
  id: number
  name: string
  role: 'STUDENT' | 'ADMIN'
  classId: number
  className: string
  campus: string
}

/** 공지 노출 범위 — .pen `NoticeScope` (우리반 / 4층 / 판교 …) */
export type NoticeScope = 'CLASS' | 'FLOOR' | 'CAMPUS'

/** 슬랙 #공지 채널에서 수집한 공지 */
export type Notice = {
  id: number
  title: string
  scope: NoticeScope
  scopeLabel: string
  postedAt: string // ISO
  url: string // 슬랙 원본
}

/** 주간 식단 — 평일만. 끼니별 메뉴를 항목 배열로 갖는다 (.pen `Detail/8-3`) */
export type MealPlan = {
  date: string // YYYY-MM-DD
  lunch: string[]
  dinner: string[]
}

/** 홈 2층 바로가기 타일. external=false 면 앱 내부 라우트 */
export type QuickLink = {
  id: number
  label: string
  url: string
  external: boolean
  icon: string // lucide 아이콘 이름
}

/** 다른 반 교육생이 만든 서비스 — /showcase */
export type ShowcaseItem = {
  id: number
  name: string
  summary: string
  team: string
  url: string
  createdAt: string
}
