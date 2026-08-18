import { ArrowUpRight, Check, FileText, Link as LinkIcon, Plus, RefreshCw, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { AppHeader, PageTitle } from '../components/Shell'
import { post } from '../lib/api'
import { dateTimeLabel, formatMD, instructorNames, weekTag } from '../lib/format'
import { TODAY_ISO } from '../lib/mock'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Material } from '../lib/types'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

/** A1 · 관리자 / 자료 승인함 */
export default function AdminMaterials() {
  const { schedules, materials, pendingMaterials, approveMaterials, rejectMaterials, relinkMaterial, refreshPendingMaterials } =
    useStore()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('PENDING')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rejected, setRejected] = useState<Material[]>([])
  const [collecting, setCollecting] = useState(false)

  async function collectNow() {
    setCollecting(true)
    try {
      await post('/admin/materials/collect', {})
      await refreshPendingMaterials()
      toast.show('슬랙에서 새 자료를 확인했습니다')
    } catch (e) {
      console.error('슬랙 수집 실패', e)
      toast.show('수집에 실패했습니다')
    } finally {
      setCollecting(false)
    }
  }

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

        <div className="flex items-center gap-4 border-b border-line">
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
                '-mb-px flex h-11 items-center border-b-2 px-2 text-label leading-[1.4] transition-colors ' +
                (tab === value
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent font-medium text-ink-muted hover:text-ink')
              }
            >
              {count !== null && count > 0 ? `${label} ${count}` : label}
            </button>
          ))}
        </div>

        {/* 일괄 선택 바 — .pen `wUdta` BulkBar */}
        {selected.size > 0 && (
          <div className="flex h-14 items-center gap-3 rounded-control border border-primary bg-primary-soft px-4">
            <Check size={18} className="shrink-0 text-primary" />
            <p className="text-label leading-[1.4] font-semibold text-primary tabular-nums">{selected.size}건 선택</p>
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
                className="flex h-9 items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-meta leading-[1.4] font-semibold text-danger hover:bg-danger-bg"
              >
                <X size={15} />
                반려
              </button>
              <button
                type="button"
                onClick={bulkApprove}
                className="flex h-9 items-center gap-1.5 rounded-control bg-primary px-4 text-meta leading-[1.4] font-semibold text-on-primary hover:bg-primary-hover"
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
                    'rounded-card border bg-surface p-4 ' +
                    (selected.has(m.id) ? 'border-primary' : 'border-line')
                  }
                >
                  <div className="flex items-start gap-4">
                    {isPending && (
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => toggle(m.id)}
                        aria-label={`${m.title} 선택`}
                        className="mt-1 size-5 shrink-0 rounded-[6px] accent-[var(--color-primary)]"
                      />
                    )}

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="shrink-0 text-primary">
                          {m.kind === 'FILE' ? <FileText size={16} /> : <LinkIcon size={16} />}
                        </span>
                        <span className="min-w-0 truncate text-body leading-[1.4] font-semibold text-ink">{m.title}</span>
                        <Badge>{m.kind === 'FILE' ? (m.ext ?? 'FILE') : 'LINK'}{m.fileSize ? ` · ${m.fileSize}` : ''}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-meta leading-[1.4] text-ink-muted">
                        <span>
                          {schedule && schedule.instructors.length > 0 ? `${instructorNames(schedule.instructors)} · ` : ''}
                          {dateTimeLabel(m.postedAt)}
                        </span>
                        <a
                          href="#"
                          className="flex h-7 items-center gap-1 rounded-control bg-subtle px-2 text-badge leading-[1.4] font-semibold text-primary hover:underline"
                        >
                          슬랙 원본
                          <ArrowUpRight size={12} />
                        </a>
                      </div>

                      {/* 매칭 드롭다운 */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-meta leading-[1.4] text-ink-muted">매칭</span>
                        <select
                          value={m.scheduleId ?? ''}
                          onChange={(e) => relinkMaterial(m.id, e.target.value ? Number(e.target.value) : null)}
                          disabled={!isPending}
                          aria-label="일정 매칭"
                          className={
                            'h-9 max-w-full rounded-control border bg-surface px-3 text-meta leading-[1.4] font-medium text-ink disabled:bg-subtle disabled:text-ink-muted ' +
                            (isPending && (m.matchConfidence === 'GUESS' || !schedule)
                              ? 'border-today'
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
                          <span className="flex h-7 items-center gap-1 rounded-full bg-today-soft px-2 text-badge leading-[1.4] font-semibold text-today">
                            <TriangleAlert size={12} />
                            추정
                          </span>
                        )}
                        {isPending && !schedule && (
                          <span className="flex h-7 items-center gap-1 rounded-full bg-danger-bg px-2 text-badge leading-[1.4] font-semibold text-danger">
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
                          className="flex h-9 items-center rounded-control bg-primary px-4 text-meta leading-[1.4] font-semibold text-on-primary hover:bg-primary-hover"
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
                          className="flex h-9 items-center rounded-control border border-line px-4 text-meta leading-[1.4] font-semibold text-danger hover:bg-danger-bg"
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toast.show('준비 중입니다')}
            className="flex h-touch items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-label font-medium text-primary hover:bg-primary-soft"
          >
            <Plus size={16} />
            수동 등록
          </button>
          <button
            type="button"
            onClick={collectNow}
            disabled={collecting}
            className="flex h-touch items-center gap-1.5 rounded-control border border-line bg-surface px-4 text-label font-medium text-primary hover:bg-primary-soft disabled:opacity-50"
          >
            <RefreshCw size={16} className={collecting ? 'animate-spin' : ''} />
            {collecting ? '수집 중…' : '지금 수집'}
          </button>
        </div>
      </div>
    </>
  )
}
