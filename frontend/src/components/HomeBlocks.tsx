import * as Icons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { dayLabel, formatMD, isToday, weekdayOf } from '../lib/format'
import type { MealPlan, Notice, QuickLink } from '../lib/types'

/** lucide 아이콘 이름(mock 의 문자열)을 컴포넌트로 해석한다. 못 찾으면 링크 아이콘. */
function iconOf(name: string): LucideIcon {
  const pascal = name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
  return ((Icons as unknown as Record<string, LucideIcon>)[pascal] ?? Icons.Link) as LucideIcon
}

/**
 * 홈 2층 · 바로가기 레일 — .pen `N0TLx` LinkTile.
 * 카드 목록이 아니라 **가로 스크롤 레일**이다. 모바일에선 넘치는 만큼 스크롤된다.
 */
export function LinkRail({ links }: { links: QuickLink[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex w-max gap-2 lg:w-full lg:gap-3">
        {links.map((l) => {
          const Icon = iconOf(l.icon)
          const inner = (
            <>
              <Icon size={22} className="text-primary" />
              <span className="flex-1" />
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
            'group flex h-22 w-28 shrink-0 flex-col gap-2 rounded-card border border-line bg-surface p-3 transition-colors hover:border-primary-tint hover:bg-primary-soft lg:w-full'
          return (
            <li key={l.id} className="lg:flex-1">
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
  )
}

/** 라벨 + 오른쪽으로 이어지는 헤어라인. 카드 대신 쓰는 섹션 머리 (.pen 홈 3층) */
export function BlockHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <p className="shrink-0 text-label font-semibold text-ink">{title}</p>
      <span className="h-px flex-1 bg-line" />
      {action}
    </div>
  )
}

/** 홈 3층 · 공지 목록 — .pen `g9a9A` NoticeRow. 카드가 아니라 행 목록이다. */
export function NoticeList({ notices, max = 3 }: { notices: Notice[]; max?: number }) {
  const shown = notices.slice(0, max)
  return (
    <section className="flex flex-col gap-2">
      <BlockHead
        title="공지"
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
        {shown.map((n) => (
          <li key={n.id}>
            <a
              href={n.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex min-h-listitem items-center gap-3 rounded-control px-2 transition-colors hover:bg-subtle"
            >
              <span className="size-1.5 shrink-0 rounded-full bg-primary" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body font-medium text-ink transition-colors group-hover:text-primary">
                  {n.title}
                </span>
                <span className="block text-badge text-ink-muted">
                  {n.channel} · {dayLabel(n.postedAt)}
                </span>
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
 * 홈 3층 · 주간 식단 — .pen `ldXjX` MealCol.
 * 5열 스트립. 열을 누르면 그날 중·석식이 펼쳐진다(일정표 자료 아코디언과 같은 패턴).
 */
export function MealStrip({
  meals,
  openDate,
  onToggle,
}: {
  meals: MealPlan[]
  openDate: string | null
  onToggle: (date: string) => void
}) {
  const open = meals.find((m) => m.date === openDate)
  return (
    <section className="flex flex-col gap-2">
      <BlockHead title="이번 주 식단" />
      <div className="flex gap-1">
        {meals.map((m) => {
          const today = isToday(m.date)
          return (
            <button
              key={m.date}
              type="button"
              onClick={() => onToggle(m.date)}
              aria-expanded={openDate === m.date}
              className={
                'flex flex-1 flex-col items-center gap-2 rounded-control py-2 transition-colors ' +
                (today ? 'bg-today-soft ' : openDate === m.date ? 'bg-subtle ' : 'hover:bg-subtle ')
              }
            >
              <span className={'text-badge font-semibold ' + (today ? 'text-today' : 'text-ink-muted')}>
                {weekdayOf(m.date)}
              </span>
              <span className={'text-badge tabular-nums ' + (today ? 'text-today' : 'text-ink-faint')}>
                {formatMD(m.date)}
              </span>
              <span className="w-full truncate px-1 text-center text-badge text-ink">{m.lunch.split(',')[0]}</span>
            </button>
          )
        })}
      </div>
      {open && (
        <div className="rounded-control bg-subtle px-3 py-2.5 text-meta text-ink-muted">
          <p>중식 12:00 · {open.lunch}</p>
          <p className="mt-0.5">석식 18:00 · {open.dinner}</p>
        </div>
      )}
    </section>
  )
}
