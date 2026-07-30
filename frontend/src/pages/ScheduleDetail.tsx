import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../lib/api'

type Schedule = {
  id: number
  date: string
  weekNo: number
  subject: string
  instructor: string | null
}

export default function ScheduleDetail() {
  const { id } = useParams()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSchedule(null)
    setError(null)
    get<Schedule>(`/schedules/${id}`).then(setSchedule).catch((e) => setError(String(e)))
  }, [id])

  return (
    <section className="space-y-4">
      <Link to="/timeline" className="text-sm text-neutral-500 hover:text-neutral-900">
        ← 일정표
      </Link>
      {error && <p className="text-sm text-red-600">불러오지 못했습니다. {error}</p>}
      {!error && !schedule && <p className="text-sm text-neutral-400">불러오는 중…</p>}
      {schedule && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-500">
            W{String(schedule.weekNo).padStart(2, '0')} · {schedule.date}
          </p>
          <h1 className="mt-1 text-lg font-medium">{schedule.subject}</h1>
          {schedule.instructor && <p className="mt-2 text-sm text-neutral-500">강사 {schedule.instructor}</p>}
          <p className="mt-4 text-sm text-neutral-400">3단계에서 강의자료가 이 아래에 붙습니다.</p>
        </div>
      )}
    </section>
  )
}
