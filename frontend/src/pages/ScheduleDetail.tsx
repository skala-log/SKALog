import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get, post } from '../lib/api'

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

type SubmissionType = 'NOTE' | 'ASSIGNMENT'

export default function ScheduleDetail() {
  const { id } = useParams()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])
  const [error, setError] = useState<string | null>(null)

  const [recordType, setRecordType] = useState<SubmissionType>('NOTE')
  const [recordTitle, setRecordTitle] = useState('')
  const [recordBody, setRecordBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSchedule(null)
    setError(null)
    get<Schedule>(`/schedules/${id}`).then(setSchedule).catch((e) => setError(String(e)))
    get<Material[]>(`/materials?scheduleId=${id}`).then(setMaterials).catch(() => setMaterials([]))
  }, [id])

  async function submitRecord() {
    setSaving(true)
    setSaveError(null)
    try {
      await post('/submissions', { scheduleId: Number(id), type: recordType, title: recordTitle, body: recordBody })
      setRecordTitle('')
      setRecordBody('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setSaveError(String(e))
    } finally {
      setSaving(false)
    }
  }

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

          <div className="mt-4 border-t border-neutral-100 pt-4">
            <p className="mb-2 text-sm text-neutral-500">내 기록 남기기</p>
            <div className="space-y-2">
              <div className="flex gap-2">
                {(['NOTE', 'ASSIGNMENT'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRecordType(t)}
                    className={`rounded-full px-3 py-1 text-xs ${
                      recordType === t ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    {t === 'NOTE' ? '노트' : '과제'}
                  </button>
                ))}
              </div>
              <input
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                placeholder="제목"
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                rows={3}
                placeholder="내용 (선택)"
                value={recordBody}
                onChange={(e) => setRecordBody(e.target.value)}
              />
              {saveError && <p className="text-sm text-red-600">{saveError}</p>}
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                  disabled={saving || !recordTitle.trim()}
                  onClick={submitRecord}
                >
                  등록
                </button>
                {saved && <span className="text-sm text-neutral-500">등록됐습니다 · 내 기록 탭에서 확인</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
