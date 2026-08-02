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
