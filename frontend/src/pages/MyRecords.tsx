import { useEffect, useState } from 'react'
import { del, get, patch } from '../lib/api'

type Submission = {
  id: number
  scheduleId: number
  type: 'ASSIGNMENT' | 'NOTE'
  title: string
  body: string | null
  createdAt: string
}

const typeLabel: Record<Submission['type'], string> = {
  ASSIGNMENT: '과제',
  NOTE: '노트',
}

function RecordItem({
  record,
  onChanged,
}: {
  record: Submission
  onChanged: (updated: Submission | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(record.title)
  const [body, setBody] = useState(record.body ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const updated = await patch<Submission>(`/submissions/${record.id}`, { title, body })
      onChanged(updated)
      setEditing(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!confirm('이 기록을 삭제할까요?')) return
    setSaving(true)
    setError(null)
    try {
      await del(`/submissions/${record.id}`)
      onChanged(null)
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2">
        <input
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
            disabled={saving || !title.trim()}
            onClick={save}
          >
            저장
          </button>
          <button
            className="rounded-lg px-3 py-1.5 text-sm text-neutral-500 hover:text-neutral-900"
            disabled={saving}
            onClick={() => setEditing(false)}
          >
            취소
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-neutral-400">
            {typeLabel[record.type]} · {new Date(record.createdAt).toLocaleDateString()}
          </p>
          <p className="mt-1 font-medium">{record.title}</p>
          {record.body && <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-600">{record.body}</p>}
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          <button className="text-neutral-500 hover:text-neutral-900" onClick={() => setEditing(true)}>
            수정
          </button>
          <button className="text-red-500 hover:text-red-700" onClick={remove}>
            삭제
          </button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </li>
  )
}

export default function MyRecords() {
  const [records, setRecords] = useState<Submission[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    get<Submission[]>('/submissions').then(setRecords).catch((e) => setError(String(e)))
  }, [])

  function handleChanged(id: number, updated: Submission | null) {
    setRecords((prev) => {
      if (!prev) return prev
      if (updated === null) return prev.filter((r) => r.id !== id)
      return prev.map((r) => (r.id === id ? updated : r))
    })
  }

  return (
    <section className="space-y-4">
      <h1 className="text-lg font-medium">내 기록</h1>
      {error && <p className="text-sm text-red-600">불러오지 못했습니다. {error}</p>}
      {!error && !records && <p className="text-sm text-neutral-400">불러오는 중…</p>}
      {records && records.length === 0 && (
        <p className="text-sm text-neutral-400">아직 등록한 기록이 없습니다. 일정 상세에서 기록을 남겨보세요.</p>
      )}
      {records && records.length > 0 && (
        <ul className="space-y-3">
          {records.map((r) => (
            <RecordItem key={r.id} record={r} onChanged={(updated) => handleChanged(r.id, updated)} />
          ))}
        </ul>
      )}
    </section>
  )
}
