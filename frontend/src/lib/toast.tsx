import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type ToastState = {
  id: number
  message: string
  undo?: () => void
} | null

type ToastValue = {
  show: (message: string, options?: { undo?: () => void }) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const DURATION_MS = 3000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)
  const timerRef = useRef<number | null>(null)
  const idRef = useRef(0)

  const show = useCallback((message: string, options?: { undo?: () => void }) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    const id = ++idRef.current
    setToast({ id, message, undo: options?.undo })
    timerRef.current = window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, DURATION_MS)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div className="fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-6 lg:justify-end lg:pr-8">
          <div className="flex items-center gap-3 rounded-control bg-ink px-4 py-2.5 text-label text-white shadow-lg">
            <span>{toast.message}</span>
            {toast.undo && (
              <button
                type="button"
                className="font-medium text-primary-tint underline-offset-2 hover:underline"
                onClick={() => {
                  toast.undo?.()
                  setToast(null)
                }}
              >
                실행 취소
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
