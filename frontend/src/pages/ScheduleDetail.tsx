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

type Material = {
  id: number
  title: string
  kind: 'FILE' | 'LINK'
  url: string | null
}

export default function ScheduleDetail() {
  const { id } = useParams()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSchedule(null)
    setError(null)
    get<Schedule>(`/schedules/${id}`).then(setSchedule).catch((e) => setError(String(e)))
    get<Material[]>(`/materials?scheduleId=${id}`).then(setMaterials).catch(() => setMaterials([]))
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

          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-2 text-sm text-neutral-500">강의자료</p>
            {materials.length === 0 && <p className="text-sm text-neutral-400">등록된 자료가 없습니다.</p>}
            <ul className="space-y-1">
              {materials.map((m) => (
                <li key={m.id}>
                  <a
                    href={m.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {m.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}
