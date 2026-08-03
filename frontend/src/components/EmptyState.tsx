import type { LucideIcon } from 'lucide-react'
import { NotebookPen } from 'lucide-react'
import type { ReactNode } from 'react'

type EmptyStateProps = {
  icon?: LucideIcon
  message: string
  alternative?: ReactNode
  action?: ReactNode
  className?: string
}

/**
 * EmptyState — .pen `fgwC7`.
 * 원칙 3: 어떤 화면도 "없습니다" 한 줄로 끝나지 않는다 — 항상 대안과 다음 행동을 같이 준다.
 */
export function EmptyState({ icon: Icon = NotebookPen, message, alternative, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center rounded-card border border-line bg-surface px-4 py-8 text-center ${className}`}
    >
      {/* .pen fgwC7 : 배경 없는 28px 아이콘 (원형 칩 없음) */}
      <Icon size={28} className="mb-3 text-ink-faint" />
      <p className="text-body font-medium text-ink">{message}</p>
      {alternative && (
        <div className="mx-auto mt-1.5 max-w-xs whitespace-pre-line text-meta text-ink-muted">{alternative}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
