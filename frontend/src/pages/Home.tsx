import { useEffect, useState } from 'react'
import { get } from '../lib/api'

type Health = { status: string; db: string; time: string }

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    get<Health>('/health').then(setHealth).catch((e) => setError(String(e)))
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="text-lg font-medium">오늘</h1>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <p className="mb-2 text-neutral-500">연결 확인</p>
        {error && <p className="text-red-600">서버에 연결하지 못했습니다. {error}</p>}
        {!error && !health && <p className="text-neutral-400">확인 중…</p>}
        {health && (
          <p>
            서버 {health.status} · DB {health.db}
          </p>
        )}
      </div>
    </section>
  )
}
