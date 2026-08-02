import type { LucideIcon } from 'lucide-react'
import { TriangleAlert } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

/** Sheet — .pen `BiAQO` : 모바일은 바텀시트, 데스크톱은 가운데 패널 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full rounded-t-sheet border border-line bg-surface p-4 shadow-lg lg:w-80 lg:rounded-card"
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-line lg:hidden" aria-hidden />
        {title && <p className="mb-2 truncate text-label font-medium text-ink">{title}</p>}
        {children}
      </div>
    </div>
  )
}

export function SheetAction({
  children,
  icon: Icon,
  onClick,
  danger,
}: {
  children: ReactNode
  icon?: LucideIcon
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'flex h-11 w-full items-center gap-2.5 rounded-control px-2 text-left text-body hover:bg-subtle ' +
        (danger ? 'text-danger' : 'text-ink')
      }
    >
      {Icon && <Icon size={17} />}
      {children}
    </button>
  )
}

/** ConfirmDialog — .pen `A2-b · 일정 관리 / 삭제 경고` */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '삭제',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  useEscape(open, onCancel)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="닫기" onClick={onCancel} className="absolute inset-0 bg-ink/40" />
      <div
        role="alertdialog"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-card border border-line bg-surface p-5 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
            <TriangleAlert size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-heading font-semibold text-ink">{title}</p>
            <div className="mt-1 text-meta text-ink-muted">{description}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-touch rounded-control border border-line px-4 text-label font-medium text-ink-muted hover:bg-subtle"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-touch rounded-control bg-danger px-4 text-label font-medium text-on-primary hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
