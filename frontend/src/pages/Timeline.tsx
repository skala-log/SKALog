import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../lib/api'

type Schedule = {
  id: number
  date: string
  weekNo: number
  subject: string
  instructor: string | null
}

export default function Timeline() {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    get<Schedule[]>('/schedules').then(setSchedules).catch((e) => setError(String(e)))
  }, [])

  return (
    <section className="space-y-4">
      <h1 className="text-lg font-medium">일정표</h1>
      {error && <p className="text-sm text-red-600">불러오지 못했습니다. {error}</p>}
      {!error && !schedules && <p className="text-sm text-neutral-400">불러오는 중…</p>}
      <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white">
        {schedules?.map((s) => (
          <li key={s.id}>
            <Link to={`/timeline/${s.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-neutral-50">
              <span className="text-neutral-500">W{String(s.weekNo).padStart(2, '0')}</span>
              <span className="flex-1 px-3">{s.subject}</span>
              <span className="text-neutral-400">{s.date}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
