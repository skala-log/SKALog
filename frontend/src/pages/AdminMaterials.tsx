import { ArrowUpRight, Check, FileText, Info, Link as LinkIcon, Plus, RefreshCw, TriangleAlert, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../components/Badge'
import { EmptyState } from '../components/EmptyState'
import { Sheet } from '../components/Sheet'
import { AppHeader, PageTitle } from '../components/Shell'
import { post } from '../lib/api'
import { dateTimeLabel, instructorNames, scheduleOptionLabel } from '../lib/format'
import { TODAY_ISO } from '../lib/mock'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Material, MaterialKind, Schedule } from '../lib/types'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'
const PAGE_SIZE = 20

/** A1 · 관리자 / 자료 승인함 */
export default function AdminMaterials() {
  const { schedules, materials, pendingMaterials, approveMaterials, rejectMaterials, relinkMaterial, refreshPendingMaterials } =
    useStore()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>('PENDING')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [rejected, setRejected] = useState<Material[]>([])
  const [collecting, setCollecting] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)

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
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
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
                setPage(1)
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
            {pageItems.map((m) => {
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
                          {m.postedAt ? dateTimeLabel(m.postedAt) : '수집 시각 미상'}
                        </span>
                        {m.sourceUrl && (
                          <a
                            href={m.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-7 items-center gap-1 rounded-control bg-subtle px-2 text-badge leading-[1.4] font-semibold text-primary hover:underline"
                          >
                            슬랙 원본
                            <ArrowUpRight size={12} />
                          </a>
                        )}
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
                              {scheduleOptionLabel(s)}
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

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-9 items-center rounded-control border border-line bg-surface px-3 text-meta font-medium text-ink hover:bg-primary-soft disabled:opacity-40"
            >
              이전
            </button>
            <span className="text-meta text-ink-muted tabular-nums">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex h-9 items-center rounded-control border border-line bg-surface px-3 text-meta font-medium text-ink hover:bg-primary-soft disabled:opacity-40"
            >
              다음
            </button>
          </div>
        )}

        {/* .pen A1 : 수동 등록은 목록 아래 왼쪽에 놓인 보조 버튼 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setManualOpen(true)}
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

      {/* 닫을 때마다 언마운트 — 다시 열면 항상 빈 폼에서 시작한다(이전 선택이 남아 엉뚱한 일정에 게시되는 것 방지) */}
      {manualOpen && (
        <ManualRegisterSheet onClose={() => setManualOpen(false)} scheduleOptions={scheduleOptions} />
      )}
    </>
  )
}

const KIND_OPTIONS: Array<[MaterialKind, string]> = [
  ['FILE', '문서'],
  ['LINK', '링크'],
]

const fieldLabel = 'text-meta leading-[1.4] font-semibold text-ink-muted'
const fieldInput =
  'h-11 w-full rounded-control border border-line bg-surface px-3 text-label leading-[1.4] text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none'

/** A1-b · 승인함 / 자료 수동 등록 — 승인 큐 없이 등록 즉시 일정 상세에 게시된다 */
function ManualRegisterSheet({
  onClose,
  scheduleOptions,
}: {
  onClose: () => void
  scheduleOptions: Schedule[]
}) {
  const { addMaterial } = useStore()
  const toast = useToast()
  const [scheduleId, setScheduleId] = useState('')
  const [title, setTitle] = useState('')
  const [kind, setKind] = useState<MaterialKind>('FILE')
  const [url, setUrl] = useState('')
  const [saving, setSaving] = useState(false)

  const valid = scheduleId !== '' && title.trim() !== '' && url.trim() !== ''

  // 저장 요청이 나간 뒤에는 닫지 못하게 — 결과를 모른 채 닫으면 중복 등록으로 이어진다.
  function close() {
    if (!saving) onClose()
  }

  async function submit() {
    if (!valid || saving) return
    setSaving(true)
    try {
      await addMaterial({ scheduleId: Number(scheduleId), title: title.trim(), kind, url: url.trim() })
      toast.show('등록했습니다 — 일정 상세에 바로 게시됩니다')
      onClose()
    } catch (e) {
      console.error('자료 수동 등록 실패', e)
      toast.show('등록에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open onClose={close} title="자료 수동 등록" wide>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col gap-4 pt-2"
      >
        <label className="flex flex-col gap-2">
          <span className={fieldLabel}>일정</span>
          <select value={scheduleId} onChange={(e) => setScheduleId(e.target.value)} required className={fieldInput}>
            <option value="">일정을 선택하세요</option>
            {scheduleOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {scheduleOptionLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className={fieldLabel}>제목</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Spring DI 보충자료"
            className={fieldInput}
          />
        </label>

        <div className="flex flex-col gap-2">
          <span className={fieldLabel}>종류</span>
          <div className="flex gap-2">
            {KIND_OPTIONS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={kind === value}
                onClick={() => setKind(value)}
                className={
                  'flex h-11 flex-1 items-center justify-center rounded-control border text-label leading-[1.4] ' +
                  (kind === value
                    ? 'border-primary bg-primary-soft font-semibold text-primary'
                    : 'border-line bg-surface font-medium text-ink-muted hover:bg-subtle')
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className={fieldLabel}>URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            placeholder="https://drive.google.com/…"
            className={fieldInput}
          />
        </label>

        <div className="flex items-center gap-2 rounded-control bg-subtle p-3">
          <Info size={16} className="shrink-0 text-ink-muted" />
          <p className="text-meta leading-[1.6] text-ink-muted">승인 절차 없이 등록 즉시 일정 상세에 게시됩니다.</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="flex h-touch items-center rounded-control border border-line bg-surface px-5 text-label leading-[1.4] font-semibold text-ink-muted hover:bg-subtle"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!valid || saving}
            className="flex h-touch items-center rounded-control bg-primary px-5 text-label leading-[1.4] font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? '등록 중…' : '등록'}
          </button>
        </div>
      </form>
    </Sheet>
  )
}
