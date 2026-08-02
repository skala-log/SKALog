import { ArrowUpRight, Check, FileText, Link as LinkIcon, Plus, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { AppHeader, PageTitle } from '../components/Shell'
import { dateTimeLabel, formatMD, weekTag } from '../lib/format'
import { TODAY_ISO } from '../lib/mock'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Material } from '../lib/types'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

/** A1 · 관리자 / 자료 승인함 */
export default function AdminMaterials() {
  const { schedules, materials, pendingMaterials, approveMaterials, rejectMaterials, relinkMaterial } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('PENDING')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rejected, setRejected] = useState<Material[]>([])

  const list = tab === 'PENDING' ? pendingMaterials : tab === 'APPROVED' ? materials : rejected
  const collectedToday = pendingMaterials.filter((m) => m.postedAt.slice(0, 10) === TODAY_ISO).length
  const scheduleOptions = useMemo(
    () => [...schedules].sort((a, b) => a.date.localeCompare(b.date)),
    [schedules],
  )

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function bulkApprove() {
    const ids = [...selected]
    approveMaterials(ids)
    setSelected(new Set())
    toast.show(`${ids.length}건 승인했습니다`)
  }

  function bulkReject() {
    const ids = [...selected]
    setRejected((prev) => [...pendingMaterials.filter((m) => selected.has(m.id)), ...prev])
    rejectMaterials(ids)
    setSelected(new Set())
    toast.show(`${ids.length}건 반려했습니다`)
  }

  const TABS: Array<[Tab, string, number | null]> = [
    ['PENDING', '대기', pendingMaterials.length],
    ['APPROVED', '승인됨', null],
    ['REJECTED', '반려됨', null],
  ]

  return (
    <>
      <AppHeader title="자료 승인함" right={`대기 ${pendingMaterials.length}`} />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        <PageTitle
          right={
            <p className="text-meta text-ink-muted tabular-nums">
              대기 {pendingMaterials.length} · 오늘 수집 {collectedToday}
            </p>
          }
        >
          자료 승인함
        </PageTitle>

        <div className="flex items-center gap-1 border-b border-line">
          {TABS.map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTab(value)
                setSelected(new Set())
              }}
              aria-pressed={tab === value}
              className={
                '-mb-px flex h-10 items-center gap-1.5 border-b-2 px-3 text-label transition-colors ' +
                (tab === value
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent font-medium text-ink-muted hover:text-ink')
              }
            >
              {label}
              {count !== null && count > 0 && <Badge tone={tab === value ? 'primary' : 'neutral'}>{count}</Badge>}
            </button>
          ))}
        </div>

        {/* 일괄 선택 바 */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2 rounded-control bg-primary-soft px-3 py-2.5">
            <p className="text-label font-medium text-primary tabular-nums">{selected.size}건 선택</p>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-meta text-ink-muted hover:text-ink"
            >
              선택 해제
            </button>
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={bulkReject}
                className="flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-3 text-label font-medium text-danger hover:bg-danger-bg"
              >
                <X size={15} />
                일괄 반려
              </button>
              <button
                type="button"
                onClick={bulkApprove}
                className="flex h-9 items-center gap-1.5 rounded-control bg-primary px-3 text-label font-medium text-on-primary hover:bg-primary-hover"
              >
                <Check size={15} />
                일괄 승인
              </button>
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={Check}
            message={tab === 'PENDING' ? '대기 중인 자료가 없습니다' : '해당 자료가 없습니다'}
            alternative={
              tab === 'PENDING' ? '슬랙 채널에 새 자료가 올라오면 여기에 모입니다.' : '다른 탭을 확인해 보세요.'
            }
          />
        ) : (
          <ul className="space-y-2">
            {list.map((m) => {
              const schedule = schedules.find((s) => s.id === m.scheduleId) ?? null
              const isPending = tab === 'PENDING'
              return (
                /*
                  .pen A1 카드 구조 — 3줄:
                  1) [체크박스] [아이콘] 제목 [종류 배지] ······ [승인][반려]
                  2)            업로더 · 수집 시각  [슬랙 원본 ↗]
                  3)            매칭  [일정 select]  [⚠ 추정]
                */
                <li
                  key={m.id}
                  className={
                    'rounded-card border bg-surface p-3 ' +
                    (selected.has(m.id) ? 'border-primary' : 'border-line')
                  }
                >
                  <div className="flex items-start gap-2.5">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggle(m.id)}
                        aria-label={`${m.title} 선택`}
                        className="mt-1 size-4 shrink-0 accent-[var(--color-primary)]"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="shrink-0 text-primary">
                          {m.kind === 'FILE' ? <FileText size={16} /> : <LinkIcon size={16} />}
                        </span>
                        <span className="min-w-0 truncate text-label font-semibold text-ink">{m.title}</span>
                        <Badge>{m.kind === 'FILE' ? (m.ext ?? 'FILE') : 'LINK'}{m.fileSize ? ` · ${m.fileSize}` : ''}</Badge>
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-meta text-ink-muted">
                        <span>
                          {schedule?.instructor ? `${schedule.instructor} · ` : ''}
                          {dateTimeLabel(m.postedAt)}
                        </span>
                        <a
                          href="#"
                          className="flex items-center gap-0.5 rounded-full bg-subtle px-2 py-0.5 hover:text-primary"
                        >
                          슬랙 원본
                          <ArrowUpRight size={12} />
                        </a>
                      </div>

                      {/* 매칭 드롭다운 */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-meta text-ink-muted">매칭</span>
                        <select
                          value={m.scheduleId ?? ''}
                          onChange={(e) => relinkMaterial(m.id, e.target.value ? Number(e.target.value) : null)}
                          disabled={!isPending}
                          aria-label="일정 매칭"
                          className={
                            'h-9 max-w-full rounded-control border bg-surface px-2 text-meta text-ink disabled:bg-subtle disabled:text-ink-muted ' +
                            (isPending && (m.matchConfidence === 'GUESS' || !schedule)
                              ? 'border-today-vivid'
                              : 'border-line')
                          }
                        >
                          <option value="">일정 미지정</option>
                          {scheduleOptions.map((s) => (
                            <option key={s.id} value={s.id}>
                              {weekTag(s.weekNo)} {formatMD(s.date)} · {s.subject}
                            </option>
                          ))}
                        </select>
                        {isPending && m.matchConfidence === 'GUESS' && schedule && (
                          <span className="flex items-center gap-1 rounded-full bg-today-soft px-2 py-0.5 text-badge font-medium text-today">
                            <TriangleAlert size={12} />
                            추정
                          </span>
                        )}
                        {isPending && !schedule && (
                          <span className="flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-badge font-medium text-danger">
                            <TriangleAlert size={12} />
                            매칭 없음
                          </span>
                        )}
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            approveMaterials([m.id])
                            toast.show('승인했습니다')
                          }}
                          className="flex h-9 items-center rounded-control bg-primary px-3.5 text-label font-medium text-on-primary hover:bg-primary-hover"
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRejected((prev) => [m, ...prev])
                            rejectMaterials([m.id])
                            toast.show('반려했습니다')
                          }}
                          className="flex h-9 items-center rounded-control border border-line px-3.5 text-label font-medium text-danger hover:bg-danger-bg"
                        >
                          반려
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {/* .pen A1 : 수동 등록은 목록 아래 왼쪽에 놓인 보조 버튼 */}
        <button
          type="button"
          onClick={() => toast.show('준비 중입니다')}
          className="flex h-touch items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-label font-medium text-primary hover:bg-primary-soft"
        >
          <Plus size={16} />
          수동 등록
        </button>
      </div>
    </>
  )
}
