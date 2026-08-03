import { CloudOff } from 'lucide-react'

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
 * S8 · 카드 단위 에러 — .pen `K6cN1D` (ErrorState).
 * 카드를 통째로 대체하는 게 아니라 **카드 본문만** 이 상태가 된다.
 * 카드 제목/배지는 그대로 남고, 나머지 카드도 정상 렌더된다.
 */
export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-5">
      <CloudOff size={24} className="text-ink-muted" />
      <p className="text-body text-ink">불러오지 못했습니다</p>
      <button
        type="button"
        onClick={onRetry}
        className="flex h-touch items-center rounded-control border border-line bg-surface px-5 text-label font-medium text-primary hover:bg-subtle"
      >
        다시 시도
      </button>
    </div>
  )
}
