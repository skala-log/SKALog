import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type CardProps = {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  variant?: 'default' | 'placeholder'
  /** 히어로 존 안에 놓일 때 카드 껍데기(테두리·배경·패딩)를 벗긴다 */
  bare?: boolean
  className?: string
}

/** Card — .pen `phV74` : bg-surface, 1px border, radius 12 */
export function Card({ title, action, children, variant = 'default', bare = false, className = '' }: CardProps) {
  if (variant === 'placeholder') {
    return (
      <div
        className={
          // .pen 은 점선이 아니라 옅은 단색 판으로 자리만 잡아둔다
          'flex items-center justify-center rounded-card bg-primary-soft/60 p-4 text-center text-meta text-ink-faint ' +
          className
        }
      >
        {children}
      </div>
    )
  }

  // bare : 히어로 존 안에 들어갈 때는 카드 테두리/배경/패딩을 벗는다 (카드 안의 카드 방지)
  return (
    <div className={(bare ? '' : 'rounded-card border border-line bg-surface p-4 ') + className}>
      {(title || action) && (
        <div className="mb-3 flex items-center gap-2">
          {title && <h2 className="text-heading font-semibold text-ink">{title}</h2>}
          {action && <div className="ml-auto flex items-center gap-1.5">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * SectionHeader — .pen M3/M4 패턴: `강의자료 2 ————————` 처럼
 * 제목 오른쪽으로 헤어라인이 끝까지 이어진다. 카드 테두리는 쓰지 않는다.
 */
export function SectionHeader({
  title,
  count,
  icon: Icon,
  muted = false,
  action,
  className = '',
}: {
  title: string
  count?: number
  icon?: LucideIcon
  /** .pen M1 "📎 강의자료 2" — 카드 안에서는 muted 한 메타 라인으로 쓴다 */
  muted?: boolean
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={'flex items-center gap-3 ' + className}>
      <h2
        className={
          'flex shrink-0 items-center gap-1.5 ' +
          (muted ? 'text-meta font-medium text-ink-muted' : 'text-label font-semibold text-ink')
        }
      >
        {Icon && <Icon size={14} />}
        {title}
        {count !== undefined && <span className={muted ? 'tabular-nums' : 'text-ink-muted tabular-nums'}>{count}</span>}
      </h2>
      <span className="h-px min-w-4 flex-1 bg-line" />
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
