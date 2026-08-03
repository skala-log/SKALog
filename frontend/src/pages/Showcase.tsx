import { ArrowUpRight } from 'lucide-react'
import { AppHeader, PageTitle } from '../components/Shell'
import { MOCK_SHOWCASE } from '../lib/mock'

/** M8 / D5 · 쇼케이스 — 다른 반 교육생이 만든 서비스 아카이브 */
export default function Showcase() {
  const items = [...MOCK_SHOWCASE].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <>
      <AppHeader title="쇼케이스" right={`${items.length}개`} />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        <div>
          <PageTitle>쇼케이스</PageTitle>
          <p className="mt-1 text-meta text-ink-muted lg:text-label">
            다른 반 교육생들이 만든 서비스를 모아뒀습니다 · {items.length}개
          </p>
        </div>

        {/* 카드 그리드 대신 데스크톱 2열 · 모바일 1열 타일 (.pen `yVFVu` ShowcaseTile) */}
        <ul className="grid gap-2 lg:grid-cols-2 lg:gap-4">
          {items.map((s) => (
            <li key={s.id} className="min-w-0">
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="group flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-4 transition-colors hover:border-primary-tint"
              >
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-heading font-semibold text-ink transition-colors group-hover:text-primary">
                    {s.name}
                  </span>
                  <ArrowUpRight
                    size={16}
                    className="shrink-0 text-ink-muted transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                  />
                </span>
                <span className="text-meta text-ink-muted">{s.summary}</span>
                <span className="text-badge text-ink-faint">{s.team}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
