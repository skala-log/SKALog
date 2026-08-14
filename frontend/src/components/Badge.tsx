import { Paperclip } from 'lucide-react'
import type { ReactNode } from 'react'
import { weekTag } from '../lib/format'
import type { Instructor, SubmissionType } from '../lib/types'

/** Badge — .pen `zWNLL` : bg-subtle, pill, padding [2,8], 12px semibold */
export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: 'neutral' | 'today' | 'primary' | 'note' | 'assignment' | 'success' | 'danger' | 'warning'
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-subtle text-ink-muted',
    today: 'bg-today-soft text-today',
    primary: 'bg-primary-soft text-primary',
    note: 'bg-note-bg text-note',
    assignment: 'bg-assignment-bg text-assignment',
    success: 'bg-success-bg text-success',
    danger: 'bg-danger-bg text-danger',
    warning: 'bg-warning-bg text-warning',
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-badge leading-[1.33] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function WeekBadge({ weekNo, tone = 'neutral' }: { weekNo: number; tone?: 'neutral' | 'primary' | 'today' }) {
  return (
    <Badge tone={tone} className="tabular-nums">
      {weekTag(weekNo)}
    </Badge>
  )
}

/** `solid` 는 .pen A2 표에서 쓰는 진한 핑크 변형 */
export function TodayBadge({ solid = false }: { solid?: boolean }) {
  return solid ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-today-vivid px-2 py-0.5 text-badge font-semibold text-on-primary">
      오늘
    </span>
  ) : (
    <Badge tone="today">오늘</Badge>
  )
}

export function TypeBadge({ type }: { type: SubmissionType }) {
  const isNote = type === 'NOTE'
  return <Badge tone={isNote ? 'note' : 'assignment'}>{isNote ? '노트' : '과제'}</Badge>
}

/** 첨부 개수 — .pen `t2ns28` BadgeIcon : bg-subtle pill, padding [2,8], gap 4, 12px semibold */
export function AttachmentCount({ count }: { count: number }) {
  if (count <= 0) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-badge leading-[1.33] font-semibold text-ink-muted tabular-nums">
      <Paperclip size={12} />
      {count}
    </span>
  )
}

export function RecordDot({ label = '내 기록 있음' }: { label?: string }) {
  return <span className="inline-block size-1.5 shrink-0 rounded-full bg-primary" role="img" aria-label={label} />
}

const ROLE_LABEL: Record<Instructor['role'], string> = { FULL_TIME: '전임', PRACTICE: '실습' }

/**
 * 강사 목록 — .pen `Professors` : RoleTag(전임=violet · 실습=teal) + 이름, 여러 명이면 `·`로 이어붙는다.
 * 직강 반처럼 전임=실습이 동일인이면 배지만 나란히 붙이고 이름은 한 번만 보여준다.
 */
export function InstructorList({ instructors, nameClassName = 'text-meta text-ink-muted' }: { instructors: Instructor[]; nameClassName?: string }) {
  if (instructors.length === 0) return null

  const groups: { name: string; roles: Instructor['role'][] }[] = []
  for (const ins of instructors) {
    const group = groups.find((g) => g.name === ins.name)
    if (group) group.roles.push(ins.role)
    else groups.push({ name: ins.name, roles: [ins.role] })
  }
  // .pen 예시("전임 박창렴 · 실습 이서준")대로 전임이 항상 먼저 오게 정렬 — API 응답 순서와 무관하게
  for (const g of groups) g.roles.sort((a, b) => (a === b ? 0 : a === 'FULL_TIME' ? -1 : 1))

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {groups.map((g, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-meta text-ink-faint">·</span>}
          {g.roles.map((role) => (
            <Badge key={role} tone={role === 'FULL_TIME' ? 'primary' : 'note'}>{ROLE_LABEL[role]}</Badge>
          ))}
          <span className={nameClassName}>{g.name}</span>
        </span>
      ))}
    </span>
  )
}
