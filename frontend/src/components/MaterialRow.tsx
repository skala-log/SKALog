import { ArrowUpRight, Download, FileText, Link as LinkIcon } from 'lucide-react'
import type { Material } from '../lib/types'

/**
 * 강의자료 한 줄 — 아이콘(테두리 없는 보라 글리프) + 2줄(파일명 / `PDF · 2.1MB`), 오른쪽 다운로드·열기.
 *
 * .pen 은 두 가지 바탕을 쓴다:
 * - `fill`  — M1 "강의자료", M2 아코디언 : 옅은 회색 박스
 * - `card`  — M3 일정 상세 : 흰 배경 + 테두리 카드
 */
export function MaterialRow({
  material,
  variant = 'fill',
  by,
}: {
  material: Material
  variant?: 'fill' | 'card'
  /** M3 는 메타 끝에 강사명을 덧붙인다 (`PDF · 2.1MB · 권기창`) */
  by?: string | null
}) {
  const isFile = material.kind === 'FILE'
  const meta = (isFile ? [material.ext, material.fileSize] : ['링크', material.sourceRef])
    .concat(by ?? [])
    .filter(Boolean)
    .join(' · ')

  return (
    <a
      href={material.url ?? undefined}
      target="_blank"
      rel="noreferrer"
      className={
        'flex items-center gap-3 rounded-control px-3 py-2.5 transition-colors ' +
        (variant === 'card'
          ? 'border border-line bg-surface hover:border-primary-tint'
          : 'bg-subtle hover:bg-primary-soft')
      }
    >
      <span className="shrink-0 text-primary">{isFile ? <FileText size={18} /> : <LinkIcon size={18} />}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-label font-medium text-ink">{material.title}</span>
        <span className="mt-0.5 block truncate text-meta text-ink-muted">{meta}</span>
      </span>
      <span className="shrink-0 text-ink-muted" aria-label={isFile ? '다운로드' : '새 탭에서 열기'}>
        {isFile ? <Download size={16} /> : <ArrowUpRight size={16} className="text-primary" />}
      </span>
    </a>
  )
}

/** S5 · 자료 없음 — .pen `T4ZBCB` : 흰 카드 + 1px 테두리, 제목/부제 2줄 */
export function MaterialEmpty() {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="text-body font-medium text-ink">자료가 아직 올라오지 않았습니다</p>
      <p className="mt-1 text-meta text-ink-muted">보통 수업 후 3시간 내 반영됩니다</p>
    </div>
  )
}
