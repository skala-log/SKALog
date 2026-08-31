import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUp, ArrowUpRight, ChevronRight, MapPin, Megaphone, Monitor } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { dayLabel, formatMD, isToday, weekdayOf } from '../lib/format'
import { TODAY_ISO } from '../lib/mock'
import { materialsFor, schedulesInWeek, submissionsFor } from '../lib/selectors'
import type { ClassMode, MealPlan, Material, Notice, QuickLink, Schedule, Submission } from '../lib/types'
import { WeekBadge } from './Badge'
import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { ScheduleRow } from './ListItem'

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
      <p className="shrink-0 text-heading font-semibold text-ink">{title}</p>
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
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-badge leading-[1.33] font-semibold ' +
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
    <span className={'w-13 shrink-0 rounded-full px-1.5 py-0.5 text-center text-badge leading-[1.33] font-semibold ' + tone}>
      {notice.scopeLabel}
    </span>
  )
}

/**
 * 바로가기 레일 — .pen `LinkTile`. 모바일은 가로 스크롤, 데스크톱은 2열 그리드.
 * 제목은 .pen D1 `Sec/바로가기` 에만 있고 M1 `LinkRail` 에는 없다.
 */
export function LinkRail({ links, showHeader = false }: { links: QuickLink[]; showHeader?: boolean }) {
  return (
    <section className="flex flex-col gap-2">
      {showHeader && <BlockHead title="바로가기" />}
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
              'group flex h-22 w-28 shrink-0 flex-col justify-between rounded-card border border-line bg-surface p-3 transition-colors hover:border-primary-tint hover:bg-primary-soft lg:w-full'
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

/**
 * 공지 — .pen 에서 카드(흰 배경 + 1px 테두리)로 바뀌었다. 범위 배지가 앞에 붙는다.
 * 세 줄 높이(max-h-44)까지만 보이고 그 아래는 스크롤 — 오래된 공지도 잘리지 않고 남는다.
 */
export function NoticeList({ notices }: { notices: Notice[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4">
      <BlockHead title="공지" hairline={false} />
      {notices.length === 0 && (
        <EmptyState
          icon={Megaphone}
          message="아직 수집된 공지가 없습니다"
          alternative="슬랙 공지 채널을 10분마다 확인해 한 줄로 요약해 드려요."
          className="border-0 py-6"
        />
      )}
      <ul className="flex max-h-44 flex-col gap-1 overflow-y-auto">
        {notices.map((n) => (
          <li key={n.id}>
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex items-center gap-2 rounded-control p-2 transition-colors hover:bg-subtle"
            >
              <NoticeScopeBadge notice={n} />
              <span className="min-w-0 flex-1">
                {/*
                  요약이 카드 폭을 넘으면 잘리므로, 마우스를 올리면 전문이 보이게 한다.
                  ponytail: 떠 있는 툴팁 대신 그 자리에서 펼친다 — 이 목록은 overflow-y-auto 라
                  absolute 툴팁이 컨테이너에 잘린다. 대신 행이 커지며 아래가 밀린다.
                  레이아웃이 흔들리는 게 거슬리면 그때 포탈 툴팁으로.
                */}
                <span className="block truncate text-body leading-[1.4] font-medium text-ink transition-colors group-hover:overflow-visible group-hover:whitespace-normal group-hover:text-primary">
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

/** 이번 주 일정 카드 — .pen M1 `Card/이번주`. 데스크톱의 스크롤형 `Sec/일정` 과 달리 이번 주만 고정으로 보여준다. */
export function ThisWeekCard({
  schedules,
  materials,
  submissions,
  weekNo,
}: {
  schedules: Schedule[]
  materials: Material[]
  submissions: Submission[]
  weekNo: number
}) {
  const rows = schedulesInWeek(schedules, weekNo)
  return (
    <Card title="이번 주" action={<WeekBadge weekNo={weekNo} tone="primary" />}>
      <ul className="-mx-2 flex flex-col gap-0.5">
        {rows.map((s) => (
          <li key={s.id}>
            <ScheduleRow
              schedule={s}
              materialCount={materialsFor(materials, s.id).length}
              hasRecord={submissionsFor(submissions, s.id).length > 0}
            />
          </li>
        ))}
      </ul>
    </Card>
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

const MEAL_API = 'https://skala-lunch.ewkimhyunsu11.workers.dev/api/menus/current'

type MenuDay = { date: string; lunch?: { dishes: { name: string }[] }; dinner?: { dishes: { name: string }[] } }

/**
 * 외부 식단 워커의 이번 주 식단. CORS가 열려 있어 백엔드를 거치지 않고 직접 부른다.
 * ponytail: 워커가 죽으면 섹션이 빈 채로 남는다 — 캐시·폴백이 필요해지면 백엔드 프록시로 옮길 것.
 */
/** 홈에서 한 번만 호출해 모바일·데스크톱 두 MealSection에 내려준다 — 둘 다 마운트돼 있어서 각자 부르면 요청이 두 번 나간다. */
export function useMeals(): MealPlan[] {
  const [meals, setMeals] = useState<MealPlan[]>([])
  useEffect(() => {
    fetch(MEAL_API)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { days: MenuDay[] }) =>
        setMeals(
          d.days.map((day) => ({
            date: day.date,
            lunch: day.lunch?.dishes.map((x) => x.name) ?? [],
            dinner: day.dinner?.dishes.map((x) => x.name) ?? [],
          })),
        ),
      )
      .catch(() => setMeals([]))
  }, [])
  return meals
}

/**
 * 주간 식단 — .pen `Sec/식단`.
 * 요일 칩(날짜 없이 요일만) + 점심/저녁 탭 + 선택한 끼니의 메뉴 상세.
 */
export function MealSection({ meals }: { meals: MealPlan[] }) {
  const [picked, setPicked] = useState<string>()
  const [slot, setSlot] = useState<'lunch' | 'dinner'>('lunch')
  // 식단은 비동기로 도착하므로 기본 선택은 state 초기값이 아니라 렌더에서 폴백한다
  const date = picked ?? meals.find((m) => isToday(m.date))?.date ?? meals[0]?.date
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
              onClick={() => setPicked(m.date)}
              aria-pressed={active}
              className={
                'flex-1 rounded-control border py-1.5 text-badge font-semibold transition-colors ' +
                // 선택이 오늘 표시보다 우선. 아니면 오늘(월) 칩이 다른 요일을 눌러도 계속 강조된 채 남는다
                (active
                  ? 'border-primary bg-primary-soft text-primary'
                  : today
                    ? 'border-today bg-surface text-today hover:bg-today-soft'
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
