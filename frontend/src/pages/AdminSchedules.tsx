import { Check, ChevronDown, Ellipsis, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TodayBadge } from '../components/Badge'
import { AppHeader } from '../components/Shell'
import { ConfirmDialog, Sheet, SheetAction } from '../components/Sheet'
import { formatMD, isToday, weekTag } from '../lib/format'
import { CLASS_NAME } from '../lib/mock'
import { weekNumbers } from '../lib/selectors'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Schedule } from '../lib/types'

const CLASSES = ['판교 1반', '판교 2반', '판교 3반']

/** A2 · 관리자 / 일정 관리 (A2-a 행 인라인 편집, A2-b 삭제 경고 포함) */
export default function AdminSchedules() {
  const { schedules, updateSchedule, removeSchedule, restoreSchedule } = useStore()
  const toast = useToast()

  const [className, setClassName] = useState(CLASS_NAME)
  // .pen A2 는 `주차 전체` 로 열린다
  const [weekFilter, setWeekFilter] = useState<number | 'ALL'>('ALL')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState<{ subject: string; instructor: string }>({ subject: '', instructor: '' })
  const [menuFor, setMenuFor] = useState<Schedule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null)

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
    setDraft({ subject: s.subject, instructor: s.instructor ?? '' })
  }

  function commitEdit(id: number) {
    updateSchedule(id, { subject: draft.subject.trim(), instructor: draft.instructor.trim() || null })
    setEditingId(null)
    toast.show('일정을 수정했습니다')
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const target = deleteTarget
    removeSchedule(target.id)
    setDeleteTarget(null)
    toast.show('일정을 삭제했습니다', { undo: () => restoreSchedule(target) })
  }

  return (
    <>
      <AppHeader title="일정 관리" />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        {/* .pen A2 : 제목 오른쪽에 반·주차 셀렉트가 바로 붙고, 추가 버튼은 우측 끝 */}
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="hidden text-display font-semibold text-ink lg:block">일정 관리</h1>
          <FilterSelect
            value={className}
            onChange={setClassName}
            label="반 선택"
            options={CLASSES.map((c) => [c, c])}
          />
          <FilterSelect
            value={String(weekFilter)}
            onChange={(v) => setWeekFilter(v === 'ALL' ? 'ALL' : Number(v))}
            label="주차 선택"
            options={[['ALL', '주차 전체'], ...weekNumbers(schedules).map((w) => [String(w), weekTag(w)] as [string, string])]}
          />
          <button
            type="button"
            onClick={() => toast.show('준비 중입니다')}
            className="ml-auto flex h-9 items-center gap-1.5 rounded-control bg-primary px-3.5 text-label font-medium text-on-primary hover:bg-primary-hover"
          >
            <Plus size={15} />
            추가
          </button>
        </div>

        <div className="overflow-x-auto rounded-card border border-line bg-surface">
          <table className="w-full min-w-160 border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-subtle text-meta text-ink-muted">
                <th className="px-3 py-2.5 font-semibold">주차</th>
                <th className="px-3 py-2.5 font-semibold">날짜</th>
                <th className="px-3 py-2.5 font-semibold">과목</th>
                <th className="px-3 py-2.5 font-semibold">강사</th>
                <th className="w-12 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => {
                const today = isToday(s.date)
                const editing = editingId === s.id
                return (
                  <tr
                    key={s.id}
                    className={'border-b border-line last:border-b-0 ' + (today ? 'bg-today-soft' : '')}
                  >
                    {/* .pen A2 : 주차는 칩이 아니라 그냥 글자다 */}
                    <td
                      className={
                        'px-3 py-2.5 align-middle text-meta font-semibold tabular-nums ' +
                        (today ? 'text-today' : 'text-ink-muted')
                      }
                    >
                      {weekTag(s.weekNo)}
                    </td>
                    {/* .pen A2 는 날짜를 `2026-07-30` 형태로 전부 보여준다 */}
                    <td
                      className={
                        'whitespace-nowrap px-3 py-2.5 align-middle text-label tabular-nums ' +
                        (today ? 'font-semibold text-today' : 'text-ink')
                      }
                    >
                      <span className="flex items-center gap-1.5">
                        {s.date}
                        {today && <TodayBadge solid />}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
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
                          className="h-9 w-full rounded-control border border-primary bg-surface px-2 text-label text-ink focus:outline-none"
                        />
                      ) : (
                        <span className="text-label text-ink">{s.subject}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      {editing ? (
                        <input
                          value={draft.instructor}
                          onChange={(e) => setDraft((d) => ({ ...d, instructor: e.target.value }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(s.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          aria-label="강사"
                          className="h-9 w-32 rounded-control border border-primary bg-surface px-2 text-label text-ink focus:outline-none"
                        />
                      ) : (
                        <span className="text-label text-ink-muted">{s.instructor ?? '—'}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      {editing ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => commitEdit(s.id)}
                            aria-label="저장"
                            className="flex size-8 items-center justify-center rounded-control bg-primary text-on-primary hover:bg-primary-hover"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            aria-label="취소"
                            className="flex size-8 items-center justify-center rounded-control border border-line text-ink-muted hover:bg-subtle"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setMenuFor(s)}
                          aria-label="행 메뉴"
                          className="flex size-8 items-center justify-center rounded-control text-ink-muted hover:bg-subtle"
                        >
                          <Ellipsis size={16} />
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

      {/* A2-b · 삭제 경고 */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="이 일정을 삭제할까요?"
        description={
          <>
            <span className="block font-medium text-ink">
              {deleteTarget && `${weekTag(deleteTarget.weekNo)} ${formatMD(deleteTarget.date)} · ${deleteTarget.subject}`}
            </span>
            <span className="mt-1 block">
              연결된 강의자료와 수강생 기록은 삭제되지 않지만, 일정에서 분리됩니다.
            </span>
          </>
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
        className="h-9 appearance-none rounded-control border border-line bg-surface pl-2.5 pr-7 text-label text-ink"
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
