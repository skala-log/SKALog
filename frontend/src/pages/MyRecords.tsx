import { ArrowUpDown, ChevronRight, ClipboardList, NotebookPen, Paperclip, StickyNote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AttachmentCount, TypeBadge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { AppHeader, PageTitle } from '../components/Shell'
import { formatMD, weekTag } from '../lib/format'
import { TOTAL_WEEKS, USER_NAME } from '../lib/mock'
import { getCurrentWeekNo, getTodaySchedule, scheduleById } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Submission, SubmissionType } from '../lib/types'

type TypeFilter = 'ALL' | SubmissionType
type SortMode = 'RECENT' | 'WEEK'

const PAGE_SIZE = 10

export default function MyRecords() {
  const { schedules, submissions: allSubmissions } = useStore()
  const [params] = useSearchParams()
  // S6 · 내 기록 / 빈 상태 — ?state=empty 로 바로 확인
  const submissions = params.get('state') === 'empty' ? [] : allSubmissions

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('RECENT')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const currentWeekNo = getCurrentWeekNo(schedules)
  const todaySchedule = getTodaySchedule(schedules)

  const total = submissions.length
  const assignmentCount = submissions.filter((s) => s.type === 'ASSIGNMENT').length
  const noteCount = submissions.filter((s) => s.type === 'NOTE').length
  const attachmentCount = submissions.reduce((sum, s) => sum + s.attachments.length, 0)
  const progressPct = Math.round((currentWeekNo / TOTAL_WEEKS) * 100)

  const filtered = useMemo(
    () => (typeFilter === 'ALL' ? submissions : submissions.filter((s) => s.type === typeFilter)),
    [submissions, typeFilter],
  )

  const groups = useMemo(() => {
    const byWeek = new Map<number, Submission[]>()
    for (const s of filtered) {
      const weekNo = scheduleById(schedules, s.scheduleId)?.weekNo ?? 0
      const list = byWeek.get(weekNo) ?? []
      list.push(s)
      byWeek.set(weekNo, list)
    }
    for (const list of byWeek.values()) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return [...byWeek.entries()].sort(([a], [b]) => (sort === 'WEEK' ? a - b : b - a))
  }, [filtered, schedules, sort])

  const visible = new Set<number>()
  let counted = 0
  for (const [, items] of groups) {
    for (const item of items) {
      if (counted >= visibleCount) break
      visible.add(item.id)
      counted++
    }
  }

  return (
    <>
      <AppHeader title="내 기록" right={USER_NAME} />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        <PageTitle>내 기록</PageTitle>

        {/* D3 · 데스크톱: 통계 카드 4장 + 진행바 (모바일 요약 스트립과 완전히 다른 레이아웃) */}
        <div className="hidden gap-3 lg:grid lg:grid-cols-4">
          <StatCard icon={ClipboardList} label="총 기록" value={total} tone="primary" />
          <StatCard icon={NotebookPen} label="과제" value={assignmentCount} tone="assignment" />
          <StatCard icon={StickyNote} label="노트" value={noteCount} tone="note" />
          <StatCard icon={Paperclip} label="첨부" value={attachmentCount} tone="neutral" />
        </div>
        {/* .pen D4 `ProgressWrap` : `3 / 23주차 진행 중` 라벨 + 같은 줄에 진행바 한 줄 */}
        <div className="hidden items-center gap-3 rounded-card border border-line bg-surface px-4 py-2.5 lg:flex">
          <p className="shrink-0 text-meta leading-[1.4] font-medium text-ink tabular-nums">
            {currentWeekNo} / {TOTAL_WEEKS}주차 진행 중
          </p>
          <ProgressBar pct={progressPct} className="flex-1" />
        </div>

        {/* M5 · 모바일 요약 스트립 */}
        <div className="flex flex-col gap-2 rounded-card border border-line bg-surface p-4 lg:hidden">
          <div className="flex items-center gap-2">
            <p className="text-title font-semibold text-ink tabular-nums">총 {total}건</p>
            <span className="flex-1" />
            <p className="text-meta leading-[1.4] text-ink-muted tabular-nums">
              {currentWeekNo} / {TOTAL_WEEKS}주차 진행 중
            </p>
          </div>
          <p className="text-meta leading-[1.4] text-ink-muted tabular-nums">
            과제 {assignmentCount} · 노트 {noteCount} · 첨부 {attachmentCount}
          </p>
          <ProgressBar pct={progressPct} />
        </div>

        {/* 필터 칩 — .pen M5/D4 : 빈 상태(S8)에도 칩 줄은 그대로 남는다 */}
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            {(
              [
                ['ALL', '전체'],
                ['ASSIGNMENT', '과제'],
                ['NOTE', '노트'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                aria-pressed={typeFilter === value}
                className={
                  'flex h-8 items-center rounded-full px-3 text-meta leading-[1.4] font-semibold transition-colors ' +
                  (typeFilter === value
                    ? 'bg-primary text-on-primary'
                    : 'border border-line bg-surface text-ink-muted hover:border-primary-tint hover:text-primary')
                }
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSort((s) => (s === 'RECENT' ? 'WEEK' : 'RECENT'))}
            className="ml-auto flex h-8 shrink-0 items-center gap-1 rounded-control px-2 text-meta leading-[1.4] font-medium text-ink-muted hover:bg-subtle"
          >
            {sort === 'RECENT' ? '최신순' : '주차순'}
            <ArrowUpDown size={14} />
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            message={total === 0 ? '아직 기록이 없습니다' : '이 조건에 맞는 기록이 없습니다'}
            alternative={
              total === 0
                ? todaySchedule
                  ? `오늘 강의는 ${todaySchedule.subject}입니다.\n한 줄만 남겨도 포트폴리오가 됩니다`
                  : '한 줄만 남겨도 포트폴리오가 됩니다'
                : '필터를 바꾸면 다른 기록을 볼 수 있습니다.'
            }
            action={
              total === 0 ? (
                <Link
                  to="/#composer"
                  className="flex h-touch items-center rounded-control bg-primary px-4 text-label font-medium text-on-primary hover:bg-primary-hover"
                >
                  오늘 강의에 첫 기록 남기기
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setTypeFilter('ALL')}
                  className="flex h-touch items-center rounded-control border border-line px-4 text-label font-medium text-ink-muted hover:bg-subtle"
                >
                  전체 보기
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-5">
            {groups.map(([weekNo, items]) => {
              const shown = items.filter((i) => visible.has(i.id))
              if (shown.length === 0) return null
              return (
                <div key={weekNo}>
                  {/* 주차 헤더 + 오른쪽으로 이어지는 헤어라인 (.pen M4) */}
                  <div className="sticky top-header z-10 -mx-4 flex items-center gap-3 bg-app px-4 py-1.5 lg:top-0 lg:mx-0 lg:px-0">
                    <p className="shrink-0 text-meta font-semibold text-ink-muted">{weekTag(weekNo)}</p>
                    <span className="h-px min-w-4 flex-1 bg-line" />
                  </div>

                  {/* 개별 카드 — 구분선 리스트가 아니라 카드가 하나씩 (.pen M4) */}
                  <ul className="mt-2 space-y-2">
                    {shown.map((r) => {
                      const schedule = scheduleById(schedules, r.scheduleId)
                      return (
                        <li key={r.id}>
                          <Link
                            to={`/timeline/${r.scheduleId}`}
                            className="group flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3 transition-colors hover:border-primary-tint"
                          >
                            {/* .pen M4 : 배지와 제목이 같은 줄, 메타는 배지 왼쪽 끝에 맞춰 아래 줄 */}
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-2">
                                <TypeBadge type={r.type} />
                                <span className="min-w-0 flex-1 truncate text-label font-medium text-ink group-hover:text-primary">
                                  {r.title}
                                </span>
                              </span>
                              {/* .pen M4 는 상대 날짜가 아니라 `7/30` 같은 절대 날짜를 쓴다 */}
                              <span className="mt-0.5 block truncate text-meta leading-[1.4] text-ink-muted">
                                {schedule?.subject} · {formatMD(r.createdAt)}
                              </span>
                            </span>
                            <AttachmentCount count={r.attachments.length} />
                            <ChevronRight size={16} className="shrink-0 text-ink-faint" />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}

            {visibleCount < filtered.length && (
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="flex h-touch w-full items-center justify-center rounded-card border border-line bg-surface text-label font-medium text-primary hover:bg-primary-soft"
              >
                더 보기
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function ProgressBar({ pct, className = '' }: { pct: number; className?: string }) {
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-subtle ${className}`}>
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-mint))' }}
      />
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: number
  tone: 'primary' | 'assignment' | 'note' | 'neutral'
}) {
  const tones: Record<string, string> = {
    primary: 'bg-primary-soft text-primary',
    assignment: 'bg-assignment-bg text-assignment',
    note: 'bg-note-bg text-note',
    neutral: 'bg-subtle text-ink-muted',
  }
  return (
    <div className="rounded-card bg-surface p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_6px_16px_-4px_rgba(15,23,42,0.08)]">
      <span className={`flex size-8.5 items-center justify-center rounded-[10px] ${tones[tone]}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 text-display leading-[1.2] font-semibold text-ink tabular-nums">{value}</p>
      <p className="mt-0.5 text-meta leading-[1.4] text-ink-muted">{label}</p>
    </div>
  )
}
