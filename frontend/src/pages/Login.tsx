import { Hash } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

/** M7 · 로그인 */
export default function Login() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm text-center">
        <p className="text-[34px] font-semibold leading-[1.2] text-primary">SKALog</p>
        <p className="mt-2 text-body text-ink-muted">설정 없이 바로 쓰는 학습 기록장</p>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-control bg-primary text-heading font-semibold text-on-primary transition-colors hover:bg-primary-hover"
        >
          <Hash size={20} />
          슬랙으로 시작하기
        </button>

        <p className="mt-4 text-meta leading-[1.5] text-ink-muted">SKALA 슬랙 워크스페이스 구성원만 이용할 수 있습니다</p>
      </div>
    </div>
  )
}
