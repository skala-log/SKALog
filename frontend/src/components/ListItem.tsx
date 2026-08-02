import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AttachmentCount, RecordDot, TypeBadge } from './Badge'
import { formatMD, isToday } from '../lib/format'
import type { Schedule, Submission } from '../lib/types'

/**
 * 일정 한 줄 — .pen `CxxDW` ListItem : height 56, 요일 / 날짜 / 과목 / 첨부수 / 기록점.
 * 오늘 행은 왼쪽 3px 핑크 바 + today-soft 배경.
 */
export function ScheduleRow({
  schedule,
  materialCount,
  hasRecord,
  className = '',
}: {
  schedule: Schedule
  materialCount: number
  hasRecord: boolean
  className?: string
}) {
  const today = isToday(schedule.date)
  return (
    <Link
      to={`/timeline/${schedule.id}`}
      className={
        'flex min-h-listitem items-center gap-3 rounded-control px-3 py-2 transition-colors hover:bg-subtle ' +
        (today ? 'border-l-[3px] border-today-vivid bg-today-soft pl-[9px] ' : '') +
        className
      }
    >
      <span className={'w-4 shrink-0 text-meta ' + (today ? 'font-semibold text-today' : 'text-ink-muted')}>
        {schedule.weekday}
      </span>
      <span
        className={'w-10 shrink-0 text-meta tabular-nums ' + (today ? 'font-semibold text-today' : 'text-ink-muted')}
      >
        {formatMD(schedule.date)}
      </span>
      <span className="min-w-0 flex-1 truncate text-body text-ink">{schedule.subject}</span>
      <AttachmentCount count={materialCount} />
      {hasRecord && <RecordDot />}
    </Link>
  )
}

/**
 * 기록 한 줄 — .pen M1 "내 최근 기록": 배지 + 제목 / `과목 · 어제` + 오른쪽 첨부 수.
 * M1·D1 목록에는 chevron 이 없고, M4 카드형 목록에만 붙는다(`chevron`).
 */
export function RecordRow({
  submission,
  subtitle,
  chevron = false,
  className = '',
}: {
  submission: Submission
  subtitle: string
  chevron?: boolean
  className?: string
}) {
  return (
    <Link
      to={`/timeline/${submission.scheduleId}`}
      className={'flex items-center gap-2.5 rounded-control px-3 py-2.5 transition-colors hover:bg-subtle ' + className}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <TypeBadge type={submission.type} />
          <span className="min-w-0 flex-1 truncate text-label font-medium text-ink">{submission.title}</span>
        </span>
        <span className="mt-0.5 block truncate text-meta text-ink-muted">{subtitle}</span>
      </span>
      <AttachmentCount count={submission.attachments.length} />
      {chevron && <ChevronRight size={16} className="shrink-0 text-ink-faint" />}
    </Link>
  )
}
