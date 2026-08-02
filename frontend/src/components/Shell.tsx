import { CalendarCog, CalendarDays, ChevronLeft, CircleUser, House, Inbox, NotebookText } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { CLASS_NAME, CURRENT_USER, USER_NAME } from '../lib/mock'

/**
 * AppHeader — .pen `Wz08H` : height 56, bg-surface, border-bottom.
 * 제목은 ink 이고, 브랜드(M1 "SKALog")일 때만 violet 이다(`brand`).
 */
export function AppHeader({
  title,
  right,
  back,
  brand = false,
  onBack,
}: {
  title: string
  right?: ReactNode
  back?: boolean
  brand?: boolean
  onBack?: () => void
}) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-30 flex h-header shrink-0 items-center gap-2 border-b border-line bg-surface px-4 lg:hidden">
      {back && (
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => (onBack ? onBack() : navigate(-1))}
          className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-subtle"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className={'min-w-0 flex-1 truncate text-title font-semibold ' + (brand ? 'text-primary' : 'text-ink')}>
        {title}
      </h1>
      {right && <div className="shrink-0 text-meta text-ink-muted">{right}</div>}
    </header>
  )
}

const TABS = [
  { to: '/', label: '오늘', Icon: House, end: true },
  { to: '/timeline', label: '일정표', Icon: CalendarDays, end: false },
  { to: '/records', label: '내 기록', Icon: NotebookText, end: false },
]

/** TabBar — .pen `tnWL6` : height 56, border-top, 22px lucide 아이콘 + 11px 라벨 */
export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-tabbar border-t border-line bg-surface lg:hidden">
      {TABS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            'flex flex-1 flex-col items-center justify-center gap-[3px] ' +
            (isActive ? 'text-primary' : 'text-ink-muted')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
              <span className={'text-micro ' + (isActive ? 'font-semibold' : 'font-medium')}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

const NAV_GROUPS = [
  {
    label: '학습',
    items: [
      { to: '/', label: '오늘', Icon: House, end: true },
      { to: '/timeline', label: '일정표', Icon: CalendarDays, end: false },
      { to: '/records', label: '내 기록', Icon: NotebookText, end: false },
    ],
  },
  {
    label: '관리',
    admin: true,
    items: [
      { to: '/admin/materials', label: '자료 승인함', Icon: Inbox, end: false },
      { to: '/admin/schedules', label: '일정 관리', Icon: CalendarCog, end: false },
    ],
  },
]

/** Sidebar — .pen `ckNFx` : width 240, 학습/관리 두 그룹 + 하단 아바타 칩 */
export function Sidebar() {
  return (
    <aside className="hidden w-sidebar shrink-0 flex-col gap-6 border-r border-line bg-surface px-4 py-5 lg:flex">
      <NavLink to="/" className="px-2 text-title font-semibold text-primary">
        SKALog
      </NavLink>

      {NAV_GROUPS.filter((g) => !g.admin || CURRENT_USER.role === 'ADMIN').map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 pb-1 text-badge font-semibold tracking-wide text-ink-muted">{group.label}</p>
          {group.items.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'flex h-11 items-center gap-2.5 rounded-control px-3 text-label transition-colors ' +
                (isActive
                  ? 'bg-primary-soft font-semibold text-primary'
                  : 'font-medium text-ink-muted hover:bg-subtle hover:text-ink')
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="mt-auto flex items-center gap-2 rounded-control bg-subtle px-3 py-2.5 text-meta text-ink-muted">
        <CircleUser size={18} />
        <span className="truncate">
          {USER_NAME} · {CLASS_NAME}
        </span>
      </div>
    </aside>
  )
}

/** 데스크톱 본문 상단의 되돌아가기 링크 — .pen D2 `‹ 일정표` (모바일은 AppHeader 가 대신한다) */
export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="hidden w-fit items-center gap-1 text-label text-ink-muted hover:text-primary lg:flex">
      <ChevronLeft size={16} />
      {children}
    </Link>
  )
}

/** 데스크톱 본문 상단 타이틀 바 (사이드바가 헤더를 대신하므로 모바일에선 감춘다) */
export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="hidden items-center gap-3 lg:flex">
      <h1 className="text-display font-semibold text-ink">{children}</h1>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </div>
  )
}
