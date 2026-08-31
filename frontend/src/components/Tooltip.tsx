import type { ReactNode } from 'react'

/**
 * 즉시 뜨는 툴팁. 브라우저 기본 `title` 은 1초쯤 지연이 있어서 직접 그린다.
 * CSS group-hover/focus 만 쓰고 상태/라이브러리는 없다. 래퍼가 포커스를 받으니 키보드·터치(탭)에서도 뜨고,
 * 스크린리더는 aria-label 로 한 번만 읽는다(시각용 말풍선은 aria-hidden).
 * 툴팁 내용은 항상 '있으면 좋은' 부가 정보여야 한다.
 */
export function Tooltip({
  label,
  children,
  className = '',
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <span tabIndex={0} aria-label={label} className={`group/tip relative inline-flex outline-none ${className}`}>
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-control bg-ink px-2 py-1 text-badge font-medium text-surface opacity-0 shadow-lg transition-opacity duration-100 group-hover/tip:opacity-100 group-focus-visible/tip:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
