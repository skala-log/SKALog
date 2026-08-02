import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { MOCK_MATERIALS, MOCK_PENDING_MATERIALS, MOCK_SCHEDULES, MOCK_SUBMISSIONS, TODAY_ISO } from './mock'
import type { Attachment, Material, Schedule, Submission, SubmissionType } from './types'

type NewSubmissionInput = {
  scheduleId: number
  type: SubmissionType
  title: string
  body: string
  attachments?: Attachment[]
}

export type ScheduleDraft = Pick<Schedule, 'date' | 'weekNo' | 'subject' | 'instructor'>

type StoreValue = {
  schedules: Schedule[]
  materials: Material[]
  pendingMaterials: Material[]
  submissions: Submission[]
  addSubmission: (input: NewSubmissionInput) => Submission
  removeSubmission: (id: number) => void
  restoreSubmission: (submission: Submission) => void
  approveMaterials: (ids: number[]) => void
  rejectMaterials: (ids: number[]) => void
  relinkMaterial: (id: number, scheduleId: number | null) => void
  updateSchedule: (id: number, patch: Partial<ScheduleDraft>) => void
  removeSchedule: (id: number) => void
  restoreSchedule: (schedule: Schedule) => void
}

const StoreContext = createContext<StoreValue | null>(null)

let nextSubmissionId = MOCK_SUBMISSIONS.reduce((max, s) => Math.max(max, s.id), 0) + 1

/** 새 기록의 작성 시각. 날짜는 프로토타입 기준일(TODAY_ISO)로 고정하고 시각만 실제 로컬 시간을 쓴다. */
function nowLocalISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${TODAY_ISO}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES)
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS)
  const [materials, setMaterials] = useState<Material[]>(MOCK_MATERIALS)
  const [pendingMaterials, setPendingMaterials] = useState<Material[]>(MOCK_PENDING_MATERIALS)

  const addSubmission = useCallback((input: NewSubmissionInput) => {
    const submission: Submission = {
      id: nextSubmissionId++,
      scheduleId: input.scheduleId,
      type: input.type,
      title: input.title,
      body: input.body,
      createdAt: nowLocalISO(),
      attachments: input.attachments ?? [],
    }
    setSubmissions((prev) => [submission, ...prev])
    return submission
  }, [])

  const removeSubmission = useCallback((id: number) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const restoreSubmission = useCallback((submission: Submission) => {
    setSubmissions((prev) => [submission, ...prev])
  }, [])

  const approveMaterials = useCallback((ids: number[]) => {
    const set = new Set(ids)
    setPendingMaterials((prev) => {
      const approved = prev.filter((m) => set.has(m.id)).map((m) => ({ ...m, status: 'APPROVED' as const }))
      setMaterials((cur) => [...approved, ...cur])
      return prev.filter((m) => !set.has(m.id))
    })
  }, [])

  const rejectMaterials = useCallback((ids: number[]) => {
    const set = new Set(ids)
    setPendingMaterials((prev) => prev.filter((m) => !set.has(m.id)))
  }, [])

  const relinkMaterial = useCallback((id: number, scheduleId: number | null) => {
    setPendingMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, scheduleId, matchConfidence: 'EXACT' as const } : m)),
    )
  }, [])

  const updateSchedule = useCallback((id: number, patch: Partial<ScheduleDraft>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }, [])

  const removeSchedule = useCallback((id: number) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const restoreSchedule = useCallback((schedule: Schedule) => {
    setSchedules((prev) => [...prev, schedule].sort((a, b) => a.date.localeCompare(b.date)))
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      schedules,
      materials,
      pendingMaterials,
      submissions,
      addSubmission,
      removeSubmission,
      restoreSubmission,
      approveMaterials,
      rejectMaterials,
      relinkMaterial,
      updateSchedule,
      removeSchedule,
      restoreSchedule,
    }),
    [
      schedules,
      materials,
      pendingMaterials,
      submissions,
      addSubmission,
      removeSubmission,
      restoreSubmission,
      approveMaterials,
      rejectMaterials,
      relinkMaterial,
      updateSchedule,
      removeSchedule,
      restoreSchedule,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
