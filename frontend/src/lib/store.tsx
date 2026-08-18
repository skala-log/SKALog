import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { del, get, patch, post } from './api'
import { weekdayOf } from './format'
import { TODAY_ISO } from './mock'
import type { Attachment, Instructor, Material, Schedule, Submission, SubmissionType } from './types'

type NewSubmissionInput = {
  scheduleId: number
  type: SubmissionType
  title: string
  body: string
  attachments?: Attachment[]
}

export type ScheduleDraft = Pick<Schedule, 'date' | 'weekNo' | 'subject' | 'instructors'>

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
  refreshPendingMaterials: () => Promise<void>
  updateSchedule: (id: number, patch: Partial<ScheduleDraft>) => void
  removeSchedule: (id: number) => void
  restoreSchedule: (schedule: Schedule) => void
}

const StoreContext = createContext<StoreValue | null>(null)

// ponytail: 로그인(6단계) 전까지 반/사용자를 고정. 로그인 붙으면 세션에서 꺼내도록 교체.
const CLASS_ID = 1
const USER_ID = 1

export type ApiSchedule = { id: number; date: string; weekNo: number; subject: string; instructors?: Instructor[]; isLive?: boolean }
type ApiMaterial = {
  id: number
  scheduleId: number | null
  title: string
  kind: Material['kind']
  url: string | null
  status: Material['status']
  sourceRef: string | null
}
type ApiSubmission = {
  id: number
  scheduleId: number
  type: SubmissionType
  title: string
  body: string | null
  createdAt: string
}

export function toSchedule(s: ApiSchedule): Schedule {
  return {
    id: s.id,
    date: s.date,
    weekday: weekdayOf(s.date) as Schedule['weekday'],
    weekNo: s.weekNo,
    subject: s.subject,
    instructors: s.instructors ?? [],
    isLive: s.isLive ?? false,
  }
}

// ponytail: ext/fileSize/postedAt은 백엔드가 아직 안 내려줌(수동 입력 자료라 파일 메타·수집 시각이 없음). 승인함(4단계)에서 채워지면 여기도 채운다.
function toMaterial(m: ApiMaterial): Material {
  return {
    id: m.id,
    scheduleId: m.scheduleId,
    title: m.title,
    kind: m.kind,
    ext: null,
    url: m.url,
    fileSize: null,
    status: m.status,
    sourceRef: m.sourceRef,
    postedAt: '',
  }
}

function toSubmission(s: ApiSubmission): Submission {
  return { id: s.id, scheduleId: s.scheduleId, type: s.type, title: s.title, body: s.body ?? '', createdAt: s.createdAt, attachments: [] }
}

/** 새 기록의 작성 시각(낙관적 표시용). 서버 응답이 오면 서버 createdAt으로 교체된다. */
function nowLocalISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${TODAY_ISO}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [pendingMaterials, setPendingMaterials] = useState<Material[]>([])

  const refreshPendingMaterials = useCallback(async () => {
    const raw = await get<ApiMaterial[]>('/materials/pending')
    setPendingMaterials(raw.map(toMaterial))
  }, [])

  useEffect(() => {
    get<ApiSchedule[]>(`/schedules?classId=${CLASS_ID}`).then(async (raw) => {
      const list = raw.map(toSchedule)
      setSchedules(list)
      // ponytail: 자료 조회가 scheduleId 단위라 일정 수만큼 N+1 호출. 부담되면 GET /materials?classId= 벌크 엔드포인트 추가.
      const perSchedule = await Promise.all(
        list.map((s) => get<ApiMaterial[]>(`/materials?scheduleId=${s.id}`).catch(() => [] as ApiMaterial[])),
      )
      setMaterials(perSchedule.flat().map(toMaterial))
    })
    get<ApiSubmission[]>(`/submissions?userId=${USER_ID}`).then((raw) => setSubmissions(raw.map(toSubmission)))
    refreshPendingMaterials()
  }, [refreshPendingMaterials])

  // ponytail: 화면에 보이는 id는 생성 시점에 고정하고, 실제 서버 id는 realIdRef에서 별도로 추적한다.
  // (toast의 "실행 취소"가 submission.id를 클로저로 들고 있는데, 저장 응답이 오면서 id를 바꿔치기하면
  //  그 사이 취소를 눌러도 더는 못 찾는 버그가 생긴다.)
  const realIdRef = useRef(new Map<number, number>())
  const resolveRealId = (id: number) => realIdRef.current.get(id) ?? id

  const addSubmission = useCallback((input: NewSubmissionInput) => {
    const localId = -Date.now()
    const optimistic: Submission = {
      id: localId,
      scheduleId: input.scheduleId,
      type: input.type,
      title: input.title,
      body: input.body,
      createdAt: nowLocalISO(),
      attachments: input.attachments ?? [],
    }
    setSubmissions((prev) => [optimistic, ...prev])

    post<ApiSubmission>(`/submissions?userId=${USER_ID}`, {
      scheduleId: input.scheduleId,
      type: input.type,
      title: input.title,
      body: input.body,
    })
      .then((saved) => {
        // ponytail: 저장 직후 응답의 createdAt은 DB 기본값이 반영되기 전이라 null로 온다. 낙관적 타임스탬프를 그대로 둔다.
        realIdRef.current.set(localId, saved.id)
      })
      .catch((e) => {
        console.error('submission 저장 실패', e)
        setSubmissions((prev) => prev.filter((s) => s.id !== localId))
      })

    return optimistic
  }, [])

  const removeSubmission = useCallback((id: number) => {
    setSubmissions((prev) => prev.filter((s) => s.id !== id))
    const realId = resolveRealId(id)
    if (realId < 0) return // 아직 서버 저장이 끝나지 않은 항목 — 저장 완료 후에도 정리는 안 되지만 드문 경합이라 무시
    del(`/submissions/${realId}?userId=${USER_ID}`).catch((e) => console.error('submission 삭제 실패', e))
  }, [])

  // ponytail: 백엔드에 복원 API가 없어(soft delete만 있음) 재생성으로 대체한다. id는 그대로 유지하고
  // 새로 생긴 서버 id만 realIdRef에 기록 — 진짜 복원이 필요하면 PATCH /submissions/{id}/restore 추가.
  const restoreSubmission = useCallback((submission: Submission) => {
    setSubmissions((prev) => [submission, ...prev])
    post<ApiSubmission>(`/submissions?userId=${USER_ID}`, {
      scheduleId: submission.scheduleId,
      type: submission.type,
      title: submission.title,
      body: submission.body,
    })
      .then((saved) => {
        realIdRef.current.set(submission.id, saved.id)
      })
      .catch((e) => console.error('submission 복원 실패', e))
  }, [])

  const approveMaterials = useCallback((ids: number[]) => {
    const set = new Set(ids)
    setPendingMaterials((prev) => {
      const approved = prev.filter((m) => set.has(m.id)).map((m) => ({ ...m, status: 'APPROVED' as const }))
      setMaterials((cur) => [...approved, ...cur])
      return prev.filter((m) => !set.has(m.id))
    })
    post('/materials/approve', { ids }).catch((e) => console.error('자료 승인 실패', e))
  }, [])

  const rejectMaterials = useCallback((ids: number[]) => {
    const set = new Set(ids)
    setPendingMaterials((prev) => prev.filter((m) => !set.has(m.id)))
    post('/materials/reject', { ids }).catch((e) => console.error('자료 반려 실패', e))
  }, [])

  const relinkMaterial = useCallback((id: number, scheduleId: number | null) => {
    setPendingMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, scheduleId, matchConfidence: 'EXACT' as const } : m)),
    )
    patch(`/materials/${id}/relink`, { scheduleId }).catch((e) => console.error('자료 매칭 실패', e))
  }, [])

  const updateSchedule = useCallback((id: number, draft: Partial<ScheduleDraft>) => {
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, ...draft } : s)))
    patch(`/schedules/${id}`, { subject: draft.subject, instructors: draft.instructors }).catch((e) =>
      console.error('일정 수정 실패', e),
    )
  }, [])

  const removeSchedule = useCallback((id: number) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id))
    del(`/schedules/${id}`).catch((e) => console.error('일정 삭제 실패', e))
  }, [])

  // ponytail: 일정 생성 API가 없어 실행취소는 화면에만 되돌린다. 삭제가 이미 서버에 반영된 뒤라면
  // 새로고침하면 다시 사라짐 — 진짜 복원이 필요하면 POST /schedules 추가.
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
      refreshPendingMaterials,
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
      refreshPendingMaterials,
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
