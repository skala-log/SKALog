import { ChevronDown, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { RecordDot, TodayBadge, WeekBadge } from '../components/Badge'
import { MaterialRow } from '../components/MaterialRow'
import { AppHeader, PageTitle } from '../components/Shell'
import { formatMD, isToday, monthGrid, monthLabel, weekRangeLabel, weekTag, weekdayFullLabel, WEEKDAY_NAMES } from '../lib/format'
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

            <div className="ml-auto flex shrink-0 rounded-full bg-subtle p-0.5">
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
                    'h-8 rounded-full px-3.5 text-meta font-semibold transition-colors ' +
                    (view === value ? 'bg-surface text-primary shadow-sm' : 'text-ink-muted')
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
              <p className={'text-heading font-semibold ' + (isPastWeek ? 'text-ink-muted' : 'text-ink')}>
                {weekTag(weekNo)}{' '}
                <span className="text-label font-normal text-ink-muted">
                  {weekRangeLabel(items.map((i) => i.date))}
                </span>
              </p>
              <span className="flex-1" />
              {weekNo === currentWeekNo ? (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-today-vivid px-2.5 py-1 text-badge font-semibold text-on-primary">
                  <span className="size-1.5 rounded-full bg-on-primary" />
                  이번 주
                </span>
              ) : (
                !weekOpen && <span className="shrink-0 text-meta text-ink-faint tabular-nums">{items.length}일</span>
              )}
            </button>

            {/* .pen M2 `CgVER` : 카드 안쪽에 행을 쌓되 행 사이 구분선은 없다 (간격으로만 나눈다) */}
            {weekOpen && (
            <div className="overflow-hidden rounded-card border border-line bg-surface p-2">
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
                        'flex min-h-listitem items-center gap-3 rounded-control px-3 py-2 ' +
                        (today ? 'border-l-[3px] border-today-vivid bg-today-soft pl-[9px] ' : '') +
                        (past ? 'opacity-55' : '')
                      }
                    >
                      <Link to={`/timeline/${s.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
                        <span className={'w-4 shrink-0 text-meta ' + (today ? 'font-semibold text-today' : 'text-ink-muted')}>
                          {s.weekday}
                        </span>
                        <span
                          className={
                            'w-10 shrink-0 text-meta tabular-nums ' + (today ? 'font-semibold text-today' : 'text-ink-muted')
                          }
                        >
                          {formatMD(s.date)}
                        </span>
                        <span className={'min-w-0 flex-1 truncate text-body ' + (past ? 'text-ink-muted' : 'text-ink')}>
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
                    {isOpen && (
                      <div className="space-y-1.5 border-t border-line bg-app px-3 py-2.5">
                        {scheduleMaterials.map((m) => (
                          <MaterialRow key={m.id} material={m} />
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

function MonthView({ year, month }: { year: number; month: number }) {
  const { schedules, materials, submissions } = useStore()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string>(TODAY_ISO)

  const byDate = useMemo(() => new Map(schedules.map((s) => [s.date, s])), [schedules])
  const recordDates = useMemo(
    () => new Set(submissions.map((r) => schedules.find((s) => s.id === r.scheduleId)?.date).filter(Boolean) as string[]),
    [submissions, schedules],
  )

  const grid = monthGrid(year, month)
  const selectedSchedule = byDate.get(selected) ?? null

  function openDay(iso: string) {
    setSelected(iso)
    // .pen D4 : "날짜를 클릭하면 해당 일정 상세로 이동합니다" — 모바일은 아래 상세 카드로 대신한다
    const schedule = byDate.get(iso)
    if (schedule && window.matchMedia('(min-width: 1024px)').matches) navigate(`/timeline/${schedule.id}`)
  }

  return (
    <div className="pt-2">
      {/* .pen M7 은 그리드가 화면 폭을 꽉 채우는 흰 판, D4 는 테두리 있는 카드 */}
      <div className="-mx-4 bg-surface lg:mx-0 lg:overflow-hidden lg:rounded-card lg:border lg:border-line">
        <div className="grid grid-cols-7 border-b border-line lg:bg-subtle">
          {WEEKDAY_NAMES.map((d) => (
            <div
              key={d}
              className={
                'py-2.5 text-center text-meta font-semibold ' + (d === '일' ? 'text-today' : 'text-ink-muted')
              }
            >
              {d}
            </div>
          ))}
        </div>

        {grid.map((week, wi) => (
          <div key={wi} className={'grid grid-cols-7 ' + (wi < grid.length - 1 ? 'lg:border-b lg:border-line' : '')}>
            {week.map((iso) => {
              const inMonth = Number(iso.slice(5, 7)) === month
              const schedule = byDate.get(iso)
              const today = isToday(iso)
              const hasRecord = recordDates.has(iso)
              const isSelected = iso === selected
              // 주간 뷰와 같은 규칙 — 지난 날짜는 흐리게
              const past = iso < TODAY_ISO
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => openDay(iso)}
                  aria-pressed={isSelected}
                  aria-label={`${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일${schedule ? ` · ${schedule.subject}` : ''}`}
                  className={
                    'flex min-h-14 flex-col items-center gap-1 p-1.5 transition-colors lg:min-h-28 lg:items-stretch lg:text-left ' +
                    (inMonth ? (past ? 'opacity-55 ' : '') : 'opacity-40 ') +
                    // 모바일(M7)은 오늘 날짜에 동그라미만, 데스크톱(D4)은 셀 전체를 물들인다
                    (today ? 'lg:bg-today-soft ' : isSelected ? 'bg-primary-soft lg:bg-transparent ' : 'hover:bg-subtle ')
                  }
                >
                  <span className="flex w-full items-center justify-center lg:justify-start">
                    <span
                      className={
                        'flex size-6 items-center justify-center rounded-full text-meta tabular-nums ' +
                        (today
                          ? 'bg-today-vivid font-semibold text-on-primary'
                          : schedule
                            ? 'font-medium text-ink'
                            : 'font-medium text-ink-muted')
                      }
                    >
                      {Number(iso.slice(8, 10))}
                    </span>
                    <span className="hidden flex-1 lg:block" />
                    {hasRecord && <span className="hidden lg:inline-flex"><RecordDot /></span>}
                  </span>

                  {/* 모바일(M7)은 점 하나가 강의 유무 + 기록 유무를 함께 나타낸다 */}
                  {schedule && (
                    <span
                      className={
                        'block size-1.5 rounded-full lg:hidden ' + (hasRecord ? 'bg-primary' : 'bg-primary-tint')
                      }
                    />
                  )}

                  {/* 데스크톱(D4)은 과목 카드 */}
                  {schedule && (
                    <span
                      className={
                        'hidden min-w-0 flex-col gap-0.5 rounded-control px-2 py-1 lg:flex ' +
                        (today ? 'bg-surface' : 'bg-primary-soft')
                      }
                    >
                      <span className="line-clamp-2 text-badge font-medium text-ink">{schedule.subject}</span>
                      <span className="text-micro font-semibold text-primary">{weekTag(schedule.weekNo)}</span>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* 선택한 날짜 상세 — .pen M7 전용(D4 는 셀 자체가 상세로 이어진다) */}
      <div className="mt-4 lg:hidden">
        <div className="mb-2 flex items-center gap-2">
          <p className="text-label font-semibold text-ink">{weekdayFullLabel(selected)}</p>
          {isToday(selected) && <TodayBadge />}
          {selectedSchedule && (
            <span className="ml-auto">
              <WeekBadge weekNo={selectedSchedule.weekNo} tone="primary" />
            </span>
          )}
        </div>

        {selectedSchedule ? (
          <Link
            to={`/timeline/${selectedSchedule.id}`}
            className="group flex items-center gap-3 rounded-card border border-line bg-surface px-3 py-3"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body font-medium text-ink group-hover:text-primary">
                {selectedSchedule.subject}
              </span>
              {selectedSchedule.instructor && (
                <span className="mt-0.5 block text-meta text-ink-muted">{selectedSchedule.instructor}</span>
              )}
            </span>
            {materialsFor(materials, selectedSchedule.id).length > 0 && (
              <span className="flex shrink-0 items-center gap-1 text-meta text-ink-muted tabular-nums">
                <Paperclip size={13} />
                {materialsFor(materials, selectedSchedule.id).length}
              </span>
            )}
            <ChevronRight size={16} className="shrink-0 text-ink-faint" />
          </Link>
        ) : (
          <p className="rounded-card border border-line bg-surface px-3 py-4 text-center text-meta text-ink-muted">
            이 날은 강의가 없습니다
          </p>
        )}
      </div>

      {/* 범례 — .pen M7 은 점 2개, D4 는 오늘/강의/기록 3개 + 오른쪽 안내문 */}
      <div className="mt-4 flex items-center gap-x-5 gap-y-2 text-meta text-ink-muted">
        <span className="hidden items-center gap-2 lg:flex">
          <span className="size-3.5 rounded-full bg-today-vivid" />
          오늘
        </span>
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary-tint lg:size-3.5 lg:rounded-sm lg:bg-primary-soft" />
          <span className="lg:hidden">강의 있음</span>
          <span className="hidden lg:inline">강의 있는 날</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-primary" />
          내 기록 있음
        </span>
        <span className="ml-auto hidden text-primary lg:block">날짜를 클릭하면 해당 일정 상세로 이동합니다</span>
      </div>
    </div>
  )
}
