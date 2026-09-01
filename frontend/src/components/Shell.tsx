import { CalendarCog, CalendarDays, ChevronLeft, House, Inbox, LogOut, NotebookText, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { post } from '../lib/api'
import { useMe } from '../lib/auth'

/**
 * AppHeader — .pen `Wz08H` : height 56, bg-surface, border-bottom.
 * 제목은 ink 이고, 브랜드(M1)일 때는 텍스트 대신 SKALog 로고를 띄운다(`brand`).
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
          className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-control text-ink hover:bg-subtle"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-title font-semibold leading-[1.4] text-ink">
        {brand ? <img src="/logo.svg" alt={title} className="h-[22px] w-auto" /> : title}
      </h1>
      {right && <div className="shrink-0 text-meta leading-[1.4] text-ink-muted">{right}</div>}
    </header>
  )
}

const TABS = [
  { to: '/', label: '홈', Icon: House, end: true },
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
      { to: '/', label: '홈', Icon: House, end: true },
      { to: '/timeline', label: '일정표', Icon: CalendarDays, end: false },
      { to: '/records', label: '내 기록', Icon: NotebookText, end: false },
      { to: '/showcase', label: '쇼케이스', Icon: Sparkles, end: false },
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

/**
 * Sidebar — .pen `gvY9H` : width 240, 유저 카드 상단, 학습/관리 두 그룹, 하단 로그아웃.
 *
 * sticky + h-dvh 로 본문이 아무리 길어져도 뷰포트에 붙어 있게 한다.
 * self-start 가 없으면 flex 의 stretch 때문에 높이가 본문만큼 늘어나 sticky 가 걸리지 않는다.
 */
export function Sidebar() {
  const me = useMe()
  const roleLabel = me.role === 'ADMIN' ? '관리자' : '훈련생'
  const className = `${me.campus} ${me.className}`

  async function logout() {
    await post('/auth/logout', {}).catch(() => {})
    window.location.href = '/login'
  }

  return (
    <aside className="hidden w-sidebar shrink-0 flex-col gap-5 self-start overflow-y-auto border-r border-line bg-surface px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-dvh">
      <NavLink to="/" className="flex flex-col gap-0.5">
        <img src="/logo.svg" alt="SKALog" className="h-[26px] w-auto self-start" />
        <span className="text-badge leading-[1.4] text-ink-faint">학습 기록 플랫폼</span>
      </NavLink>

      <div className="flex items-center gap-2 border-y border-line py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-label font-semibold leading-none text-primary">
          {me.name.slice(0, 1)}
        </div>
        <div className="flex min-w-0 flex-col gap-px">
          <p className="truncate text-meta font-semibold leading-[1.3] text-ink">{me.name}</p>
          <p className="truncate text-badge leading-[1.3] text-ink-muted">
            {roleLabel} · {className}
          </p>
        </div>
      </div>

      {NAV_GROUPS.filter((g) => !g.admin || me.role === 'ADMIN').map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-3 py-1 text-badge font-semibold leading-[1.4] tracking-[1px] text-ink-muted">
            {group.label}
          </p>
          {group.items.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                'flex h-10 items-center gap-3 rounded-control px-3 text-label leading-[1.4] transition-colors ' +
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

      <div className="flex-1" />

      <button
        type="button"
        onClick={logout}
        className="flex items-center justify-center gap-2 rounded-control border border-line p-2 text-meta font-medium leading-[1.4] text-danger hover:bg-danger-bg"
      >
        <LogOut size={16} />
        로그아웃
      </button>
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
