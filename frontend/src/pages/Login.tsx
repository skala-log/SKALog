import { Hash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** M5 · 로그인 */
export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 pb-16">
      <div className="mx-auto w-full max-w-sm text-center">
        <p className="text-display font-semibold text-primary">SKALog</p>
        <p className="mt-2 text-body text-ink-muted">설정 없이 바로 쓰는 학습 기록장</p>

        <button
          type="button"
          onClick={() => navigate('/onboarding/class')}
          className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-control bg-primary text-body font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          <Hash size={18} />
          슬랙으로 시작하기
        </button>

        <p className="mt-4 text-meta text-ink-muted">SKALA 슬랙 워크스페이스 구성원만 이용할 수 있습니다</p>
      </div>
    </div>
  )
}
