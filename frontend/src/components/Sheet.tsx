import type { LucideIcon } from 'lucide-react'
import { TriangleAlert, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

type SheetProps = {
  open: boolean
  onClose: () => void
  title?: string
  /** 데스크톱 폭. 액션 목록은 기본(320px), 폼은 wide(440px) — .pen `A1-b` Dialog 기준 */
  wide?: boolean
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
export function Sheet({ open, onClose, title, wide, children }: SheetProps) {
  useEscape(open, onClose)
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button type="button" aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div
        role="dialog"
        aria-modal="true"
        className={
          'relative max-h-[85dvh] w-full overflow-y-auto rounded-t-sheet border border-line bg-surface p-4 shadow-lg lg:rounded-card ' +
          (wide ? 'lg:w-[440px] lg:p-6' : 'lg:w-80')
        }
      >
        <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-line lg:hidden" aria-hidden />
        {title && (
          <div className="mb-2 flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-heading leading-[1.4] font-semibold text-ink">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="flex size-touch shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-subtle"
            >
              <X size={20} />
            </button>
          </div>
        )}
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
        className="relative w-full max-w-[400px] rounded-sheet border border-line bg-surface p-6 shadow-[0_12px_32px_rgba(17,24,39,0.2)]"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-danger-bg text-danger">
            <TriangleAlert size={20} />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-heading font-semibold text-ink">{title}</p>
            <div className="text-label leading-[1.6] text-ink-muted">{description}</div>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-touch items-center rounded-control border border-line px-5 text-label leading-[1.4] font-semibold text-ink-muted hover:bg-subtle"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex h-touch items-center rounded-control bg-danger px-5 text-label leading-[1.4] font-semibold text-on-primary hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
