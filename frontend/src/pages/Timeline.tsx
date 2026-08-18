import { ChevronDown, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AttachmentCount, Badge, RecordDot } from '../components/Badge'
import { MaterialRow } from '../components/MaterialRow'
import { AppHeader, PageTitle } from '../components/Shell'
import { formatMD, isToday, monthGrid, monthLabel, weekRangeLabel, weekTag, WEEKDAY_NAMES } from '../lib/format'
import { CLASS_NAME, TODAY_ISO } from '../lib/mock'
import { getCurrentWeekNo, materialsFor, submissionsFor, weekNumbers } from '../lib/selectors'
import { useStore } from '../lib/store'
import type { Schedule } from '../lib/types'

type ViewMode = 'week' | 'month'

export default function Timeline() {
  const { schedules } = useStore()
  const [params, setParams] = useSearchParams()
  const view: ViewMode = params.get('view') === 'month' ? 'month' : 'week'
  const currentWeekNo = getCurrentWeekNo(schedules)
  const weekRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const chipStrip = useRef<HTMLDivElement>(null)
  const [cursor, setCursor] = useState(() => ({
    year: Number(TODAY_ISO.slice(0, 4)),
    month: Number(TODAY_ISO.slice(5, 7)),
  }))

  function setView(next: ViewMode) {
    const p = new URLSearchParams(params)
    if (next === 'month') p.set('view', 'month')
    else p.delete('view')
    setParams(p, { replace: true })
  }

  function shiftMonth(delta: number) {
    setCursor(({ year, month }) => {
      const m = month + delta
      if (m < 1) return { year: year - 1, month: 12 }
      if (m > 12) return { year: year + 1, month: 1 }
      return { year, month: m }
    })
  }

  // 23주차까지 있어서 이번 주차 칩이 스트립 밖으로 밀려나기 쉽다.
  useEffect(() => {
    const strip = chipStrip.current
    const chip = strip?.querySelector<HTMLElement>('[data-current="true"]')
    if (strip && chip) strip.scrollLeft = chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2
  }, [currentWeekNo, view])

  return (
    <>
      <AppHeader title="일정표" right={CLASS_NAME} />
      <div className="mx-auto w-full max-w-5xl px-4 pb-24 lg:px-8 lg:pb-10">
        {/*
          목록이 마운트 직후 이번 주차로 스크롤되므로, 보기 전환과 주차 칩은
          헤더 바로 아래 고정해 두어야 계속 손에 닿는다.
        */}
        <div
          className={
            'sticky top-header z-20 -mx-4 space-y-2 px-4 pb-2 pt-4 lg:top-0 lg:mx-0 lg:bg-app lg:px-0 lg:pt-8 ' +
            // 월간은 흰 달력판과 이어지므로 컨트롤 바도 흰 바탕이다 (.pen M7)
            (view === 'month' ? 'bg-surface' : 'bg-app')
          }
        >
          <div className="flex items-center gap-3">
            <PageTitle>일정표</PageTitle>

            {/* .pen M7 / D4 : 월 이동은 보기 전환과 같은 줄에 놓인다 */}
            {view === 'month' && (
              <div className="flex items-center gap-1">
                <MonthStep label="이전 달" onClick={() => shiftMonth(-1)}>
                  <ChevronLeft size={16} />
                </MonthStep>
                <p className="text-heading font-semibold text-ink tabular-nums">
                  {monthLabel(cursor.year, cursor.month)}
                </p>
                <MonthStep label="다음 달" onClick={() => shiftMonth(1)}>
                  <ChevronRight size={16} />
                </MonthStep>
              </div>
            )}

            <div className="ml-auto flex shrink-0 gap-0.5 rounded-control bg-subtle p-[3px]">
              {(
                [
                  ['week', '주간'],
                  ['month', '월간'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  aria-pressed={view === value}
                  className={
                    'rounded-control px-2.5 py-1.5 text-badge transition-colors ' +
                    (view === value ? 'bg-surface font-semibold text-primary shadow-sm' : 'font-medium text-ink-muted')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 주차 칩 — .pen M2 : 선택 칩은 solid violet + 흰 글씨 */}
          {view === 'week' && (
            <div ref={chipStrip} className="no-scrollbar -mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
              <div className="flex gap-1.5">
                {weekNumbers(schedules).map((weekNo) => (
                  <button
                    key={weekNo}
                    type="button"
                    data-current={weekNo === currentWeekNo}
                    onClick={() => weekRefs.current.get(weekNo)?.scrollIntoView({ block: 'start', behavior: 'smooth' })}
                    className={
                      'flex h-8 shrink-0 items-center rounded-full px-3 text-meta font-semibold transition-colors ' +
                      (weekNo === currentWeekNo
                        ? 'bg-primary text-on-primary'
                        : 'bg-subtle text-ink-muted hover:bg-primary-soft hover:text-primary')
                    }
                  >
                    {weekTag(weekNo)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {view === 'month' ? <MonthView year={cursor.year} month={cursor.month} /> : <WeekView weekRefs={weekRefs} />}
      </div>
    </>
  )
}

/** 월 이동 화살표 — .pen M7 은 테두리 없는 아이콘, D4 는 테두리 있는 버튼 */
function MonthStep({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-8 items-center justify-center rounded-control text-ink-muted hover:bg-subtle lg:border lg:border-line lg:bg-surface"
    >
      {children}
    </button>
  )
}

/* ── M2 · 주간(주차 아코디언) ─────────────────────────────────────── */

function WeekView({ weekRefs }: { weekRefs: RefObject<Map<number, HTMLDivElement>> }) {
  const { schedules, materials, submissions } = useStore()
  const currentWeekNo = getCurrentWeekNo(schedules)
  const [params] = useSearchParams()
  // S7 · 일정표 / 아코디언 닫힘 — 기본은 이번 주 첨부 있는 항목만 펼침
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    if (params.get('state') === 'collapsed') return new Set()
    return new Set(
      schedules.filter((s) => s.weekNo === currentWeekNo && materialsFor(materials, s.id).length > 0).map((s) => s.id),
    )
  })

  // 주차 아코디언 — 23주가 한 번에 펼쳐져 있으면 훑기가 어렵다. 이번 주만 열어둔다.
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(() => new Set([currentWeekNo]))

  function toggleWeek(weekNo: number) {
    setOpenWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(weekNo)) next.delete(weekNo)
      else next.add(weekNo)
      return next
    })
  }

  const weeks = useMemo(() => {
    const byWeek = new Map<number, Schedule[]>()
    for (const s of schedules) {
      const list = byWeek.get(s.weekNo) ?? []
      list.push(s)
      byWeek.set(s.weekNo, list)
    }
    return [...byWeek.entries()]
      .sort(([a], [b]) => a - b)
      .map(([weekNo, items]) => ({ weekNo, items: items.sort((a, b) => a.date.localeCompare(b.date)) }))
  }, [schedules])

  useEffect(() => {
    weekRefs.current.get(currentWeekNo)?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior })
  }, [currentWeekNo, weekRefs])

  function toggle(scheduleId: number) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(scheduleId)) next.delete(scheduleId)
      else next.add(scheduleId)
      return next
    })
  }

  return (
    <div className="space-y-6 pt-2">
      {weeks.map(({ weekNo, items }) => {
        const weekOpen = openWeeks.has(weekNo)
        // 지난 주차는 흐리게 — 오늘 이후 일정이 하나도 없으면 지난 주차로 본다
        const isPastWeek = items.every((i) => i.date < TODAY_ISO)
        return (
          <div
            key={weekNo}
            ref={(el) => {
              if (el) weekRefs.current.set(weekNo, el)
            }}
            /* 상단 고정 컨트롤 바(헤더 56 + 보기 전환/칩) 아래로 내려오도록 */
            className="scroll-mt-38 lg:scroll-mt-28"
          >
            {/* 주차 헤더 = 아코디언 트리거. `W03 7/28 – 8/1` 좌측, `이번 주` 배지는 우측 끝 */}
            <button
              type="button"
              onClick={() => toggleWeek(weekNo)}
              aria-expanded={weekOpen}
              /* 주차 헤더 전체가 아코디언 트리거다 — 탭 타깃 44px 이상 확보 */
              className="mb-2 flex min-h-touch w-full items-center gap-2 rounded-control px-2 py-2 text-left transition-colors hover:bg-subtle"
            >
              <ChevronDown
                size={18}
                className={
                  'shrink-0 text-ink-muted transition-transform ' + (weekOpen ? 'rotate-0' : '-rotate-90')
                }
              />
              <p className={'text-label leading-[1.4] font-semibold ' + (isPastWeek ? 'text-ink-muted' : 'text-ink')}>
                {weekTag(weekNo)}{' '}
                <span className="text-meta leading-[1.4] font-normal text-ink-muted">
                  {weekRangeLabel(items.map((i) => i.date))}
                </span>
              </p>
              <span className="flex-1" />
              {weekNo === currentWeekNo ? (
                <Badge tone="primary">이번 주</Badge>
              ) : (
                !weekOpen && <span className="shrink-0 text-meta text-ink-faint tabular-nums">{items.length}일</span>
              )}
            </button>

            {/* .pen M2 `CgVER` : 카드 안쪽에 행을 쌓되 행 사이 구분선은 없다 (간격으로만 나눈다) */}
            {weekOpen && (
            <div className="flex flex-col gap-0.5 rounded-card border border-line bg-surface p-2">
              {items.map((s) => {
                const scheduleMaterials = materialsFor(materials, s.id)
                const hasRecord = submissionsFor(submissions, s.id).length > 0
                const today = isToday(s.date)
                const isOpen = expanded.has(s.id)
                // 지난 수업은 흐리게 — 오늘/앞으로 남은 일정에 먼저 눈이 가게 한다
                const past = s.date < TODAY_ISO
                return (
                  <div key={s.id}>
                    <div
                      className={
                        'flex h-11 items-center gap-2 rounded-control px-2 ' +
                        (today ? 'border-l-[3px] border-today-vivid bg-today-soft pl-[5px] ' : '') +
                        (past ? 'opacity-55' : '')
                      }
                    >
                      <Link to={`/timeline/${s.id}`} className="flex min-w-0 flex-1 items-center gap-2 hover:opacity-80">
                        <span className={'w-[14px] shrink-0 text-meta font-semibold ' + (today ? 'text-today' : 'text-ink-muted')}>
                          {s.weekday}
                        </span>
                        <span
                          className={'w-[34px] shrink-0 text-meta tabular-nums ' + (today ? 'text-today' : 'text-ink-muted')}
                        >
                          {formatMD(s.date)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-label leading-[1.4] font-medium text-ink">
                          {s.subject}
                        </span>
                      </Link>
                      {scheduleMaterials.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggle(s.id)}
                          aria-expanded={isOpen}
                          aria-label={`강의자료 ${scheduleMaterials.length}건 ${isOpen ? '접기' : '펼치기'}`}
                          className={
                            'flex h-8 shrink-0 items-center gap-1 rounded-full px-2 text-meta tabular-nums transition-colors ' +
                            (isOpen ? 'bg-primary-soft text-primary' : 'bg-subtle text-ink-muted hover:text-primary')
                          }
                        >
                          <Paperclip size={13} />
                          {scheduleMaterials.length}
                          <ChevronDown size={13} className={isOpen ? 'rotate-180 transition-transform' : 'transition-transform'} />
                        </button>
                      )}
                      {hasRecord && <RecordDot />}
                    </div>
                    {/* .pen `Grp/W03` Accordion : subtle 배경 + subject 칼럼과 맞춘 좌측 들여쓰기(34px) */}
                    {isOpen && (
                      <div className="flex flex-col gap-1.5 py-2 pr-2 pl-[34px]">
                        {scheduleMaterials.map((m) => (
                          <MaterialRow key={m.id} material={m} variant="card" />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── M7 / D4 · 월간 캘린더 ────────────────────────────────────────── */

/** .pen M3/D2 의 월간 캘린더는 평일(월~금) 5칸이다 — 주말엔 수업이 없다. */
function MonthView({ year, month }: { year: number; month: number }) {
  const { schedules, materials, submissions } = useStore()
  const navigate = useNavigate()

  const byDate = useMemo(() => new Map(schedules.map((s) => [s.date, s])), [schedules])
  const recordDates = useMemo(
    () => new Set(submissions.map((r) => schedules.find((s) => s.id === r.scheduleId)?.date).filter(Boolean) as string[]),
    [submissions, schedules],
  )

  const grid = monthGrid(year, month).map((week) => week.slice(1, 6))
  const weekdayLabels = WEEKDAY_NAMES.slice(1, 6)

  return (
    <div className="pt-2">
      {/* .pen M3/D2 `WeekdayHead` + `Grid` : 요일 5칸, 셀은 .pen `aFUiO` DayCell(64px, 테두리 카드) */}
      <div className="grid grid-cols-5 gap-1.5">
        {weekdayLabels.map((d) => (
          <div key={d} className="pb-1 text-center text-meta font-semibold text-ink-muted">
            {d}
          </div>
        ))}
      </div>

      {grid.map((week, wi) => (
        <div key={wi} className="mt-1.5 grid grid-cols-5 gap-1.5">
          {week.map((iso) => {
            const inMonth = Number(iso.slice(5, 7)) === month
            const schedule = byDate.get(iso)
            const today = isToday(iso)
            const hasRecord = recordDates.has(iso)
            const past = iso < TODAY_ISO
            const materialCount = schedule ? materialsFor(materials, schedule.id).length : 0
            return (
              <button
                key={iso}
                type="button"
                onClick={() => schedule && navigate(`/timeline/${schedule.id}`)}
                aria-label={`${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일${schedule ? ` · ${schedule.subject}` : ''}`}
                className={
                  'flex h-16 flex-col gap-0.5 rounded-control border p-2 text-left transition-colors ' +
                  (inMonth ? (past ? 'opacity-55 ' : '') : 'opacity-40 ') +
                  (today ? 'border-today-vivid bg-today-soft ' : 'border-line bg-surface hover:border-primary-tint ')
                }
              >
                <span className={'text-badge font-semibold tabular-nums ' + (today ? 'text-today' : 'text-ink')}>
                  {Number(iso.slice(8, 10))}
                </span>
                {schedule && <span className="line-clamp-1 text-badge text-ink-muted">{schedule.subject}</span>}
                <span className="mt-auto flex items-center gap-1">
                  {materialCount > 0 && <AttachmentCount count={materialCount} />}
                  {hasRecord && <RecordDot />}
                </span>
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
