import { ArrowUpDown, CalendarDays, Check, ChevronDown, ClipboardList, NotebookPen, Paperclip, StickyNote } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AttachmentCount, Badge, TypeBadge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { InlineComposer } from '../components/InlineComposer'
import { AppHeader, PageTitle } from '../components/Shell'
import { SubmissionDetail } from '../components/SubmissionDetail'
import { formatMD, weekTag } from '../lib/format'
import { useMe } from '../lib/auth'
import { TODAY_ISO, TOTAL_WEEKS } from '../lib/mock'
import { getCurrentWeekNo, scheduleById } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Schedule, Submission, SubmissionType } from '../lib/types'

type TypeFilter = 'ALL' | SubmissionType
type SortMode = 'RECENT' | 'WEEK'

const PAGE_SIZE = 10

export default function MyRecords() {
  const me = useMe()
  const { schedules, submissions: allSubmissions } = useStore()
  const [params] = useSearchParams()
  // S6 · 내 기록 / 빈 상태 — ?state=empty 로 바로 확인
  const submissions = params.get('state') === 'empty' ? [] : allSubmissions

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [sort, setSort] = useState<SortMode>('RECENT')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  // 기록 작성 — 날짜(=수업일)를 수동으로 골라 기록. 기록이 scheduleId 기반이라 수업일만 선택 가능 (.pen M5-a/D4-a)
  const pickableSchedules = useMemo(
    () => schedules.filter((s) => s.date <= TODAY_ISO).sort((a, b) => b.date.localeCompare(a.date)),
    [schedules],
  )
  const [pickedScheduleId, setPickedScheduleId] = useState<number | null>(null)
  const pickedSchedule = pickableSchedules.find((s) => s.id === pickedScheduleId) ?? pickableSchedules[0] ?? null
  const [composerOpenSignal, setComposerOpenSignal] = useState(0)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const currentWeekNo = getCurrentWeekNo(schedules)

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
      <AppHeader title="내 기록" right={me.name} />

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
                  'flex h-10 items-center rounded-full px-4 text-meta leading-[1.4] font-semibold transition-colors ' +
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

        {/* .pen M5-a/D4-a — 필터 아래 인라인 컴포저. 확인 라벨 자리에 날짜 선택 줄이 들어간다.
            기록이 0건이면 숨기고, 빈 상태의 "첫 기록 남기기" 버튼이 열 때만 나타난다 */}
        {pickedSchedule && (total > 0 || composerOpenSignal > 0) && (
          <InlineComposer
            schedule={pickedSchedule}
            collapsedLabel="기록 남기기"
            openSignal={composerOpenSignal}
            contextSlot={
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ScheduleDatePicker
                    options={pickableSchedules}
                    selected={pickedSchedule}
                    onSelect={(s) => setPickedScheduleId(s.id)}
                  />
                  <Badge tone="primary" className="shrink-0 tabular-nums">
                    {weekTag(pickedSchedule.weekNo)}
                  </Badge>
                  <p className="hidden min-w-0 flex-1 truncate text-meta leading-[1.4] font-semibold text-ink lg:block">
                    {pickedSchedule.subject}
                  </p>
                </div>
                {/* 모바일도 어느 수업에 저장되는지 항상 보여야 한다 — 데스크톱은 윗줄에 이미 있음 */}
                <p className="truncate text-meta leading-[1.4] text-ink-muted lg:hidden">
                  {pickedSchedule.subject}에 저장됩니다
                </p>
              </div>
            }
          />
        )}

        {filtered.length === 0 ? (
          <EmptyState
            message={total === 0 ? '아직 기록이 없습니다' : '이 조건에 맞는 기록이 없습니다'}
            alternative={total === 0 ? '한 줄만 남겨도 포트폴리오가 됩니다' : '필터를 바꾸면 다른 기록을 볼 수 있습니다.'}
            action={
              total === 0 ? (
                pickedSchedule ? (
                  // 이 페이지의 컴포저를 바로 연다 — 홈으로 보내지 않는다
                  <button
                    type="button"
                    onClick={() => setComposerOpenSignal((n) => n + 1)}
                    className="flex h-touch items-center rounded-control bg-primary px-4 text-label font-medium text-on-primary hover:bg-primary-hover"
                  >
                    첫 기록 남기기
                  </button>
                ) : null
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
                      const isExpanded = expandedId === r.id
                      return (
                        <li key={r.id}>
                          {/* 클릭하면 일정표로 가는 대신 카드가 아래로 확장돼 세부 내용(내용·파일·링크)을 보여준다 */}
                          <div className="rounded-card border border-line bg-surface px-4 py-3 transition-colors hover:border-primary-tint">
                            <button
                              type="button"
                              onClick={() => setExpandedId(isExpanded ? null : r.id)}
                              aria-expanded={isExpanded}
                              className="group flex w-full items-center gap-3 text-left"
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
                              <ChevronDown
                                size={16}
                                className={`shrink-0 text-ink-faint transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </button>
                            {isExpanded && (
                              <div className="mt-2.5 border-t border-line pt-2.5">
                                <SubmissionDetail submission={r} />
                              </div>
                            )}
                          </div>
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

/** 날짜 드롭다운 — 각 날짜에 무슨 수업이었는지를 함께, 수업명이 주인공 (.pen M5-a Dropdown) */
function ScheduleDatePicker({
  options,
  selected,
  onSelect,
}: {
  options: Schedule[]
  selected: Schedule
  onSelect: (s: Schedule) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div
      ref={rootRef}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
      className="relative min-w-0 flex-1 lg:max-w-70 lg:flex-none lg:basis-70"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-touch w-full items-center gap-2 rounded-control bg-subtle px-3 text-label leading-[1.4] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <CalendarDays size={16} className="shrink-0 text-ink-muted" />
        <span className="truncate tabular-nums">
          {selected.date} ({selected.weekday})
        </span>
        <ChevronDown
          size={16}
          className={`ml-auto shrink-0 text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-20 max-h-64 w-full min-w-64 overflow-y-auto rounded-card border border-line bg-surface p-1 shadow-[0_8px_24px_rgba(17,24,39,0.12)]"
        >
          {options.map((s) => {
            const isSelected = s.id === selected.id
            return (
              <li key={s.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(s)
                    setOpen(false)
                  }}
                  className={
                    'flex h-10 w-full items-center gap-2 rounded-control px-3 text-left ' +
                    (isSelected ? 'bg-primary-soft' : 'hover:bg-subtle')
                  }
                >
                  <span
                    className={
                      'w-16 shrink-0 text-meta leading-[1.4] tabular-nums ' +
                      (isSelected ? 'text-primary' : 'text-ink-muted')
                    }
                  >
                    {formatMD(s.date)} ({s.weekday})
                  </span>
                  <span
                    className={
                      'min-w-0 flex-1 truncate text-label leading-[1.4] font-semibold ' +
                      (isSelected ? 'text-primary' : 'text-ink')
                    }
                  >
                    {s.subject}
                  </span>
                  {isSelected && <Check size={16} className="shrink-0 text-primary" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
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
