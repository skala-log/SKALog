export type Weekday = '일' | '월' | '화' | '수' | '목' | '금' | '토'

export type Schedule = {
  id: number
  date: string // YYYY-MM-DD
  weekday: Weekday
  weekNo: number
  subject: string
  instructor: string | null
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
  sourceRef: string | null // slack permalink label
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

/** 슬랙 #공지 채널에서 수집한 공지 — 홈 3층 */
export type Notice = {
  id: number
  title: string
  channel: string
  postedAt: string // ISO
  url: string // 슬랙 원본
}

/** 주간 식단 — 홈 3층. 평일만 있다 */
export type MealPlan = {
  date: string // YYYY-MM-DD
  lunch: string
  dinner: string
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
