import { Hash, TriangleAlert } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'

const ERROR_MESSAGES: Record<string, string> = {
  display_name_format:
    '슬랙 표시 이름이 "캠퍼스_반_이름" 형식이 아니에요 (예: 판교_1반_홍길동). 슬랙 프로필에서 표시 이름을 바꾼 뒤 다시 시도해주세요.',
}

/** M7 · 로그인 */
export default function Login() {
  const [params] = useSearchParams()
  const error = params.get('error')
  const errorMessage = error ? (ERROR_MESSAGES[error] ?? '로그인에 실패했어요. 다시 시도해주세요.') : null

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6">
      <div className="mx-auto w-full max-w-sm text-center">
        <p className="text-[34px] font-semibold leading-[1.2] text-primary">SKALog</p>
        <p className="mt-2 text-body text-ink-muted">설정 없이 바로 쓰는 학습 기록장</p>

        {errorMessage && (
          <p className="mt-4 flex items-start gap-1.5 rounded-control bg-danger-bg px-3 py-2.5 text-left text-meta leading-[1.4] text-danger">
            <TriangleAlert size={16} className="mt-0.5 shrink-0" />
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={() => (window.location.href = '/api/auth/slack/authorize')}
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
