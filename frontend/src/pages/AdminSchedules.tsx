import { ChevronDown, Ellipsis, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { TodayBadge } from '../components/Badge'
import { AppHeader } from '../components/Shell'
import { ConfirmDialog, Sheet, SheetAction } from '../components/Sheet'
import { del, get, patch } from '../lib/api'
import { isToday, weekTag } from '../lib/format'
import { materialsFor, submissionsFor, weekNumbers } from '../lib/selectors'
import { toSchedule, useStore, type ApiSchedule } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Instructor, Schedule } from '../lib/types'

type ClassOption = { id: number; name: string }

/** A2 · 관리자 / 일정 관리 (A2-a 행 인라인 편집, A2-b 삭제 경고 포함) */
export default function AdminSchedules() {
  // ponytail: 자료/기록 건수는 로그인 사용자 반(useStore)만 미리 불러와 있어서, 다른 반을 볼 땐
  // 삭제 경고에 0건으로 뜬다. 반별 자료·기록까지 다 끌어오려면 별도 API가 필요해서 보류.
  const { materials, submissions } = useStore()
  const toast = useToast()

  const [classes, setClasses] = useState<ClassOption[]>([])
  const [classId, setClassId] = useState<number | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])

  // .pen A2 는 `주차 전체` 로 열린다
  const [weekFilter, setWeekFilter] = useState<number | 'ALL'>('ALL')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<{ subject: string; fullTime: string; practice: string }>({
    subject: '',
    fullTime: '',
    practice: '',
  })
  const [menuFor, setMenuFor] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

  useEffect(() => {
    get<ClassOption[]>('/classes').then((list) => {
      setClasses(list)
      setClassId((cur) => cur ?? (list.find((c) => c.name === '1반') ?? list[0])?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (classId == null) return
    get<ApiSchedule[]>(`/schedules?classId=${classId}`).then((raw) => setSchedules(raw.map(toSchedule)))
  }, [classId])

  const rows = useMemo(
    () =>
      schedules
        .filter((s) => weekFilter === 'ALL' || s.weekNo === weekFilter)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [schedules, weekFilter],
  )

  function startEdit(s: Schedule) {
    setMenuFor(null)
    setEditingId(s.id)
    setDraft({
      subject: s.subject,
      fullTime: s.instructors.find((i) => i.role === 'FULL_TIME')?.name ?? '',
      practice: s.instructors.find((i) => i.role === 'PRACTICE')?.name ?? '',
    })
  }

  function commitEdit(id: number) {
    const instructors: Instructor[] = [
      ...(draft.fullTime.trim() ? [{ name: draft.fullTime.trim(), role: 'FULL_TIME' as const }] : []),
      ...(draft.practice.trim() ? [{ name: draft.practice.trim(), role: 'PRACTICE' as const }] : []),
    ]
    const subject = draft.subject.trim()
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, subject, instructors } : s)))
    patch(`/schedules/${id}`, { subject, instructors }).catch((e) => console.error('일정 수정 실패', e))
    setEditingId(null)
    toast.show('일정을 수정했습니다')
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    setSchedules((prev) => prev.filter((s) => s.id !== target.id))
    setDeleteTarget(null)
    del(`/schedules/${target.id}`)
      .then(() => toast.show('일정을 삭제했습니다', { undo: () => setSchedules((prev) => [...prev, target].sort((a, b) => a.date.localeCompare(b.date))) }))
      .catch((e) => {
        console.error('일정 삭제 실패', e)
        setSchedules((prev) => [...prev, target].sort((a, b) => a.date.localeCompare(b.date)))
        toast.show('삭제하지 못했습니다 — 연결된 자료나 기록이 있는지 확인해주세요')
      })
  }

  return (
    <>
      <AppHeader title="일정 관리" />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        {/* .pen A2 : 제목 오른쪽에 반·주차 셀렉트가 바로 붙는다. 신규 일정은 SQL로 넣는다(추가 버튼 없음) */}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="hidden text-display font-semibold text-ink lg:block">일정 관리</h1>
          <FilterSelect
            value={classId == null ? '' : String(classId)}
            onChange={(v) => setClassId(Number(v))}
            label="반 선택"
            options={classes.map((c) => [String(c.id), c.name])}
          />
          <FilterSelect
            value={String(weekFilter)}
            onChange={(v) => setWeekFilter(v === 'ALL' ? 'ALL' : Number(v))}
            label="주차 선택"
            options={[['ALL', '주차 전체'], ...weekNumbers(schedules).map((w) => [String(w), weekTag(w)] as [string, string])]}
          />
        </div>

        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-180 border-collapse text-left">
            <thead>
              <tr className="whitespace-nowrap border-b border-line bg-subtle text-meta text-ink-muted">
                <th className="px-5 py-2 font-semibold">주차</th>
                <th className="px-5 py-2 font-semibold">날짜</th>
                <th className="px-5 py-2 font-semibold">과목</th>
                <th className="px-5 py-2 font-semibold">전임교수</th>
                <th className="px-5 py-2 font-semibold">실습교수</th>
                <th className="w-16 px-5 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const today = isToday(s.date)
                const editing = editingId === s.id
                const fullTime = s.instructors.find((i) => i.role === 'FULL_TIME')?.name
                const practice = s.instructors.find((i) => i.role === 'PRACTICE')?.name
                return (
                  <tr
                    key={s.id}
                    className={'border-b border-line last:border-b-0 ' + (today ? 'bg-today-soft' : editing ? 'bg-primary-soft' : '')}
                  >
                    {/* .pen A2 : 주차는 칩이 아니라 그냥 글자다 */}
                    <td
                      className={
                        'px-5 py-2 align-middle text-label leading-[1.4] font-semibold tabular-nums ' +
                        (today ? 'text-today' : 'text-ink-muted')
                      }
                    >
                      {weekTag(s.weekNo)}
                    </td>
                    {/* .pen A2 는 날짜를 `2026-07-30` 형태로 전부 보여준다 */}
                    <td
                      className={
                        'whitespace-nowrap px-5 py-2 align-middle text-label leading-[1.4] tabular-nums ' +
                        (today ? 'font-semibold text-today' : 'text-ink')
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {s.date}
                        {today && <TodayBadge solid />}
                      </span>
                    </td>
                    <td className="px-5 py-2 align-middle">
                      {/* A2-a · 행 인라인 편집 */}
                      {editing ? (
                        <input
                          value={draft.subject}
                          onChange={(e) => setDraft((d) => ({ ...d, subject: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(s.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          aria-label="과목"
                          className="h-10 w-full rounded-control border border-primary bg-surface px-3 text-label leading-[1.4] text-ink focus:outline-none"
                        />
                      ) : (
                        <span className="text-label leading-[1.4] text-ink">{s.subject}</span>
                      )}
                    </td>
                    <td className="px-5 py-2 align-middle">
                      {editing ? (
                        <input
                          value={draft.fullTime}
                          onChange={(e) => setDraft((d) => ({ ...d, fullTime: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(s.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          aria-label="전임교수"
                          className="h-10 w-28 rounded-control border border-primary bg-surface px-3 text-label leading-[1.4] text-ink focus:outline-none"
                        />
                      ) : (
                        <span className="text-label leading-[1.4] text-ink-muted">{fullTime ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-2 align-middle">
                      {editing ? (
                        <input
                          value={draft.practice}
                          onChange={(e) => setDraft((d) => ({ ...d, practice: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(s.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          aria-label="실습교수"
                          className="h-10 w-28 rounded-control border border-primary bg-surface px-3 text-label leading-[1.4] text-ink focus:outline-none"
                        />
                      ) : (
                        <span className="text-label leading-[1.4] text-ink-muted">{practice ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-5 py-2 align-middle">
                      {editing ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => commitEdit(s.id)}
                            aria-label="저장"
                            className="flex h-10 items-center rounded-control bg-primary px-4 text-meta leading-[1.4] font-semibold text-on-primary hover:bg-primary-hover"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="취소"
                            className="flex h-10 items-center rounded-control border border-line px-4 text-meta leading-[1.4] font-semibold text-ink-muted hover:bg-subtle"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMenuFor(s)}
                          aria-label="행 메뉴"
                          className="flex size-9 items-center justify-center rounded-control text-ink-muted hover:bg-subtle"
                        >
                          <Ellipsis size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.subject}>
        <SheetAction icon={Pencil} onClick={() => menuFor && startEdit(menuFor)}>
          수정
        </SheetAction>
        <SheetAction
          icon={Trash2}
          danger
          onClick={() => {
            setDeleteTarget(menuFor)
            setMenuFor(null)
          }}
        >
          삭제
        </SheetAction>
      </Sheet>

      {/* A2-b · 삭제 경고 — 문구는 .pen 대로("함께 사라집니다") 표기하지만, 실제 삭제 동작은 지금처럼
          연결된 자료/기록을 건드리지 않고 일정만 분리한다(스키마상 안전한 기존 동작 유지). */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 일정을 삭제할까요?"
        description={
          deleteTarget && (
            <>
              <span>
                기록 {submissionsFor(submissions, deleteTarget.id).length}건, 자료{' '}
                {materialsFor(materials, deleteTarget.id).length}건이 연결되어 있습니다. 삭제하면 함께 사라집니다.
              </span>
              <span className="mt-3 flex items-center gap-2 rounded-control bg-subtle p-3 text-meta leading-[1.4]">
                <span className="font-semibold text-ink-muted">{weekTag(deleteTarget.weekNo)}</span>
                <span className="text-ink">
                  {deleteTarget.date} · {deleteTarget.subject}
                </span>
              </span>
            </>
          )
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

/** .pen A2 의 필터 셀렉트 — 네이티브 화살표 대신 lucide chevron 을 얹는다 */
function FilterSelect({
  value,
  onChange,
  label,
  options,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  options: Array<[string, string]>
}) {
  return (
    <span className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-9 appearance-none rounded-control border border-line bg-surface pl-3 pr-7 text-meta leading-[1.4] font-medium text-ink"
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted"
      />
    </span>
  )
}
