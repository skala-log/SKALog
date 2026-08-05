import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUp, ArrowUpRight, ChevronRight, MapPin, Monitor } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dayLabel, formatMD, isToday, weekdayOf } from '../lib/format'
import { TODAY_ISO } from '../lib/mock'
import type { ClassMode, MealPlan, Notice, QuickLink, Schedule } from '../lib/types'

/** mock 의 lucide 아이콘 이름 문자열을 컴포넌트로 해석한다. 못 찾으면 링크 아이콘. */
function iconOf(name: string): LucideIcon {
  const pascal = name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  return ((Icons as unknown as Record<string, LucideIcon>)[pascal] ?? Icons.Link) as LucideIcon
}

/** 섹션 머리 — 라벨 + 오른쪽으로 이어지는 헤어라인 (+ 선택 액션). 카드가 아닌 블록에 쓴다. */
export function BlockHead({
  title,
  action,
  hairline = true,
}: {
  title: string
  action?: React.ReactNode
  hairline?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="shrink-0 text-label font-semibold text-ink">{title}</p>
      <span className={'h-px flex-1 ' + (hairline ? 'bg-line' : 'bg-transparent')} />
      {action}
    </div>
  )
}

/** 수업 방식 배지 — .pen `ClassMode` (현강 = 핑크, 온라인 = 블루) */
export function ClassModeBadge({ mode }: { mode: ClassMode }) {
  const onsite = mode === 'ONSITE'
  const Icon = onsite ? MapPin : Monitor
  return (
    <span
      className={
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-badge font-semibold ' +
        (onsite ? 'bg-onsite-bg text-onsite' : 'bg-remote-bg text-remote')
      }
    >
      <Icon size={12} />
      {onsite ? '현강' : '온라인'}
    </span>
  )
}

/** 공지 노출 범위 배지 — .pen `NoticeScope`. 폭 52 고정이라 세로로 줄이 맞는다. */
export function NoticeScopeBadge({ notice }: { notice: Notice }) {
  const tone =
    notice.scope === 'CLASS'
      ? 'bg-primary-soft text-primary'
      : notice.scope === 'FLOOR'
        ? 'bg-note-bg text-note'
        : 'bg-subtle text-ink-muted'
  return (
    <span className={'w-13 shrink-0 rounded-full px-1.5 py-0.5 text-center text-badge font-semibold ' + tone}>
      {notice.scopeLabel}
    </span>
  )
}

/** 바로가기 레일 — .pen `LinkTile`. 모바일은 가로 스크롤, 데스크톱은 2열 그리드. */
export function LinkRail({ links }: { links: QuickLink[] }) {
  return (
    <section className="flex flex-col gap-2">
      <BlockHead title="바로가기" />
      <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
        <ul className="flex w-max gap-2 lg:grid lg:w-full lg:grid-cols-2">
          {links.map((l) => {
            const Icon = iconOf(l.icon)
            const inner = (
              <>
                <Icon size={22} className="text-primary" />
                <span className="flex w-full items-center gap-1">
                  <span className="min-w-0 flex-1 truncate text-badge font-semibold text-ink transition-colors group-hover:text-primary">
                    {l.label}
                  </span>
                  {l.external ? (
                    <ArrowUpRight
                      size={12}
                      className="shrink-0 text-ink-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  ) : (
                    <ChevronRight
                      size={12}
                      className="shrink-0 text-ink-muted transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                    />
                  )}
                </span>
              </>
            )
            const cls =
              'group flex h-15 w-28 shrink-0 flex-col justify-between rounded-card border border-line bg-surface p-3 transition-colors hover:border-primary-tint hover:bg-primary-soft lg:w-full'
            return (
              <li key={l.id}>
                {l.external ? (
                  <a href={l.url} target="_blank" rel="noreferrer noopener" className={cls}>
                    {inner}
                  </a>
                ) : (
                  <Link to={l.url} className={cls}>
                    {inner}
                  </Link>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/** 공지 — .pen 에서 카드(흰 배경 + 1px 테두리)로 바뀌었다. 범위 배지가 앞에 붙는다. */
export function NoticeList({ notices, max = 3 }: { notices: Notice[]; max?: number }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <BlockHead
        title="공지"
        hairline={false}
        action={
          <a
            href="https://theskala.slack.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="shrink-0 text-meta font-medium text-primary hover:underline"
          >
            더보기 ›
          </a>
        }
      />
      <ul className="flex flex-col gap-1">
        {notices.slice(0, max).map((n) => (
          <li key={n.id}>
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center gap-2.5 rounded-control px-1 py-1.5 transition-colors hover:bg-subtle"
            >
              <NoticeScopeBadge notice={n} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-label font-medium text-ink transition-colors group-hover:text-primary">
                  {n.title}
                </span>
                <span className="block text-badge text-ink-muted">{dayLabel(n.postedAt)}</span>
              </span>
              <ArrowUpRight
                size={16}
                className="shrink-0 text-ink-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * 일정 — .pen `Sec/일정`.
 * 고정된 이번 주 목록이 아니라 위아래로 스크롤되는 일정 목록이다.
 * 오늘은 흰 배경 + primary 테두리 + 좌측 액센트 바, 지난 수업은 흐리게.
 * 오늘 행이 화면 밖으로 나가면 `오늘로 이동` 알약이 뜬다.
 */
export function ScheduleScroll({ schedules }: { schedules: Schedule[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLLIElement>(null)
  const [todayVisible, setTodayVisible] = useState(true)

  // 오늘 앞뒤로만 잘라서 보여준다 — 23주 전체를 DOM 에 올릴 이유가 없다
  const rows = useMemo(() => {
    const idx = schedules.findIndex((s) => s.date >= TODAY_ISO)
    const from = Math.max(0, (idx === -1 ? schedules.length : idx) - 2)
    return schedules.slice(from, from + 14)
  }, [schedules])

  const scrollToToday = () => todayRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })

  useEffect(() => {
    const el = todayRef.current
    const root = scrollRef.current
    if (!el || !root) return
    const io = new IntersectionObserver(([e]) => setTodayVisible(e.isIntersecting), { root, threshold: 0.6 })
    io.observe(el)
    // 처음엔 오늘이 보이도록 맞춰 둔다 (원칙 4)
    root.scrollTop = Math.max(0, el.offsetTop - root.clientHeight / 2 + el.clientHeight / 2)
    return () => io.disconnect()
  }, [rows])

  return (
    <section className="relative flex flex-col gap-2">
      <BlockHead
        title="일정"
        action={
          <Link to="/timeline" className="shrink-0 text-meta font-medium text-primary hover:underline">
            일정표 ›
          </Link>
        }
      />
      <div ref={scrollRef} className="max-h-58 overflow-y-auto pr-1">
        <ul className="flex flex-col gap-1">
          {rows.map((s) => {
            const today = isToday(s.date)
            const past = s.date < TODAY_ISO
            return (
              <li
                key={s.id}
                ref={today ? todayRef : undefined}
                className={past ? 'opacity-45' : undefined}
              >
                <Link
                  to={`/timeline/${s.id}`}
                  className={
                    'flex items-center gap-2.5 rounded-control px-2.5 py-2 transition-colors ' +
                    (today ? 'border border-primary bg-surface' : 'hover:bg-subtle')
                  }
                >
                  <span className={'h-5 w-[3px] shrink-0 rounded-full ' + (today ? 'bg-primary' : 'bg-transparent')} />
                  <span
                    className={
                      'w-8 shrink-0 text-badge tabular-nums ' +
                      (today ? 'font-semibold text-primary' : 'text-ink-faint')
                    }
                  >
                    {formatMD(s.date)}
                  </span>
                  <span className="min-w-0 flex-1">
                    {today && <span className="block text-badge font-semibold text-primary">오늘</span>}
                    <span
                      className={'block truncate text-meta ' + (today ? 'font-semibold text-ink' : 'font-medium text-ink')}
                    >
                      {s.subject}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {!todayVisible && (
        <button
          type="button"
          onClick={scrollToToday}
          className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-badge font-semibold text-on-primary shadow-[0_2px_8px_rgba(17,24,39,0.15)] transition-colors hover:bg-primary-hover"
        >
          <ArrowUp size={14} />
          오늘로 이동
        </button>
      )}
    </section>
  )
}

/**
 * 주간 식단 — .pen `Sec/식단`.
 * 요일 칩(날짜 없이 요일만) + 점심/저녁 탭 + 선택한 끼니의 메뉴 상세.
 */
export function MealSection({ meals }: { meals: MealPlan[] }) {
  const [date, setDate] = useState(() => meals.find((m) => isToday(m.date))?.date ?? meals[0]?.date)
  const [slot, setSlot] = useState<'lunch' | 'dinner'>('lunch')
  const selected = meals.find((m) => m.date === date)

  return (
    <section className="flex flex-col gap-2">
      <BlockHead title="주간 식단" />

      <div className="flex gap-1.5">
        {meals.map((m) => {
          const today = isToday(m.date)
          const active = m.date === date
          return (
            <button
              key={m.date}
              type="button"
              onClick={() => setDate(m.date)}
              aria-pressed={active}
              className={
                'flex-1 rounded-control border py-1.5 text-badge font-semibold transition-colors ' +
                (today
                  ? 'border-today bg-today-soft text-today'
                  : active
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-surface text-ink-muted hover:border-primary-tint hover:text-primary')
              }
            >
              {weekdayOf(m.date)}
            </button>
          )
        })}
      </div>

      <div className="flex gap-0.5 rounded-control bg-subtle p-0.5">
        {(
          [
            ['lunch', '점심'],
            ['dinner', '저녁'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSlot(key)}
            aria-pressed={slot === key}
            className={
              'flex-1 rounded-control py-1.5 text-badge font-semibold transition-colors ' +
              (slot === key ? 'bg-surface text-ink' : 'text-ink-muted hover:text-ink')
            }
          >
            {label}
          </button>
        ))}
      </div>

      {selected && (
        <ul className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-3">
          {selected[slot].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="size-1 shrink-0 rounded-full bg-today" />
              <span className="min-w-0 flex-1 truncate text-label font-semibold text-ink">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
