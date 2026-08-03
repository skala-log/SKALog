import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const CLASSES = ['판교 1반', '판교 2반', '판교 3반', '역삼 1반', '역삼 2반']

/** M6 · 반 선택 (최초 1회) */
export default function ClassSelect() {
  const navigate = useNavigate()
  const [value, setValue] = useState(CLASSES[0])

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-display font-semibold text-ink">어느 반이신가요?</h1>

        <div className="relative mt-6">
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label="반 선택"
            className="h-14 w-full appearance-none rounded-control border border-line bg-surface px-4 pr-10 text-heading font-medium text-ink focus:border-primary focus:outline-none"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={20}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted"
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-control bg-primary text-heading font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          시작하기
        </button>

        <p className="mt-6 text-center text-meta text-ink-muted">나중에 설정에서 바꿀 수 있습니다</p>
      </div>
    </div>
  )
}
