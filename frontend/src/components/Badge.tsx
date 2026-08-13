import { Paperclip } from 'lucide-react'
import type { ReactNode } from 'react'
import { weekTag } from '../lib/format'
import type { SubmissionType } from '../lib/types'

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
