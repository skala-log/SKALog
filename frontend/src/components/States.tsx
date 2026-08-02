import { TriangleAlert } from 'lucide-react'

/** S1 · 홈 / 로딩 — 카드 형태를 유지한 스켈레톤 */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-full bg-subtle ${className}`} />
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <SkeletonLine className="h-4 w-24" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine key={i} className={'h-3.5 ' + (i === lines - 1 ? 'w-1/2' : 'w-full')} />
        ))}
      </div>
    </div>
  )
}

/**
 * S8 · 홈 / 카드 단위 에러 — 화면 전체가 아니라 실패한 카드만 이 상태가 된다.
 * 나머지 카드는 정상 렌더되고, 여기서만 다시 시도할 수 있다.
 */
export function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <div className="flex items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-warning-bg text-warning">
          <TriangleAlert size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-label font-medium text-ink">{message}</p>
          <p className="mt-0.5 text-meta text-ink-muted">잠시 후 다시 시도해 주세요. 다른 카드는 정상입니다.</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 h-9 w-full rounded-control border border-line text-label font-medium text-ink-muted hover:bg-subtle"
      >
        다시 시도
      </button>
    </div>
  )
}
