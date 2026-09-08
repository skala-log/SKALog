import { ChevronDown, Ellipsis, FilePlus2, Link as LinkIcon, Paperclip, Pencil, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AttachmentCount, InstructorList, TodayBadge, TypeBadge, WeekBadge } from '../components/Badge'
import { SectionHeader } from '../components/Card'
import { SubmissionDetail } from '../components/SubmissionDetail'
import { InlineComposer, MAX_FILES, MAX_FILE_BYTES } from '../components/InlineComposer'
import { MaterialEmpty, MaterialRow } from '../components/MaterialRow'
import { AppHeader, BackLink } from '../components/Shell'
import { Sheet, SheetAction } from '../components/Sheet'
import { SkeletonCard } from '../components/States'
import { dateTimeLabel, formatFileSize, instructorNames, isToday, weekdayFullLabel } from '../lib/format'
import { materialsFor, submissionsFor } from '../lib/selectors'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Attachment, Submission } from '../lib/types'

export default function ScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { schedules, schedulesLoaded, materials, submissions, removeSubmission, restoreSubmission } = useStore()
  const toast = useToast()
  const [menuFor, setMenuFor] = useState<Submission | null>(null)
  const [editFor, setEditFor] = useState<Submission | null>(null)
  const [attachFor, setAttachFor] = useState<Submission | null>(null)
  const [justSavedId, setJustSavedId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const schedule = schedules.find((s) => s.id === Number(id))
  if (!schedule) {
    // 일정 목록이 아직 서버에서 안 왔을 수 있다 — 로딩 전에 "없음"으로 단정해 튕기지 않는다.
    if (!schedulesLoaded) {
      return (
        <div className="mx-auto w-full max-w-5xl space-y-3 px-4 pt-4 lg:px-8 lg:pt-8">
          <SkeletonCard />
        </div>
      )
    }
    return <Navigate to="/timeline" replace />
  }

  const scheduleMaterials = materialsFor(materials, schedule.id)
  const records = submissionsFor(submissions, schedule.id)

  function handleDelete(submission: Submission) {
    setMenuFor(null)
    removeSubmission(submission.id)
    toast.show('삭제했습니다', { undo: () => restoreSubmission(submission) })
  }

  return (
    <>
      <AppHeader title="일정표" back onBack={() => navigate('/timeline')} />

      <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        <BackLink to="/timeline">일정표</BackLink>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <WeekBadge weekNo={schedule.weekNo} tone="primary" />
            <span className="text-meta leading-[1.4] text-ink-muted">{weekdayFullLabel(schedule.date)}</span>
            {isToday(schedule.date) && <span className="ml-auto"><TodayBadge /></span>}
          </div>
          <h1 className="mt-2 text-display font-semibold text-ink">{schedule.subject}</h1>
          {/* 데스크톱(D3)만 역할 배지가 붙는다(.pen `Professors`) — 모바일(M4)은 이름만 */}
          <div className="mt-2 hidden lg:block">
            <InstructorList instructors={schedule.instructors} nameClassName="text-label leading-[1.4] font-medium text-ink" />
          </div>
          {schedule.instructors.length > 0 && (
            <p className="mt-2 text-label leading-[1.4] text-ink-muted lg:hidden">{instructorNames(schedule.instructors)}</p>
          )}
        </div>

        {/* D2 는 강의자료 / 내 기록 2단, 모바일(M3)은 위아래로 쌓인다 */}
        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          {/* 강의자료 — 섹션 헤더 + 헤어라인, 카드 테두리 없음 (.pen M3) */}
          <section>
            <SectionHeader title="강의자료" count={scheduleMaterials.length} />
            <div className="mt-2.5 space-y-1.5">
              {/* S5 · 자료 없음 */}
              {scheduleMaterials.length === 0 ? (
                <MaterialEmpty />
              ) : (
                scheduleMaterials.map((m) => (
                  <MaterialRow key={m.id} material={m} variant="card" by={instructorNames(schedule.instructors)} />
                ))
              )}
            </div>
          </section>

          <section>
            <SectionHeader title="내 기록" count={records.length} />
            <div className="mt-2.5 space-y-2.5">
              {/* S3 · 컴포저 펼침 */}
              <InlineComposer schedule={schedule} onSaved={setJustSavedId} />

              {records.map((r) => {
                const isExpanded = expandedId === r.id
                return (
                  <div
                    key={r.id}
                    className={
                      'rounded-card border bg-surface px-4 py-3 transition-colors ' +
                      // S4 · 저장 직후: 방금 저장한 기록을 잠깐 강조
                      (justSavedId === r.id ? 'border-primary bg-primary-soft' : 'border-line')
                    }
                  >
                    <div className="flex items-start gap-3">
                      {/* 클릭하면 카드가 아래로 확장돼 세부 내용(내용·파일·링크)을 보여준다 */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        aria-expanded={isExpanded}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <TypeBadge type={r.type} />
                            <span className="min-w-0 flex-1 truncate text-label font-medium text-ink">{r.title}</span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-meta leading-[1.4] text-ink-muted">
                            <span>{dateTimeLabel(r.createdAt)}</span>
                            <AttachmentCount count={r.attachments.length} />
                          </div>
                        </div>
                        {/* 두 줄(제목+메타) 블록 옆에서 세로 중앙 정렬 */}
                        <ChevronDown
                          size={16}
                          className={`shrink-0 text-ink-faint transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuFor(r)}
                        aria-label="기록 메뉴"
                        className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-subtle"
                      >
                        <Ellipsis size={18} />
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="mt-2.5 border-t border-line pt-2.5">
                        <SubmissionDetail submission={r} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

      </div>

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.title}>
        <SheetAction
          icon={Pencil}
          onClick={() => {
            setEditFor(menuFor)
            setMenuFor(null)
          }}
        >
          수정
        </SheetAction>
        <SheetAction
          icon={FilePlus2}
          onClick={() => {
            setAttachFor(menuFor)
            setMenuFor(null)
          }}
        >
          파일/링크 추가
        </SheetAction>
        <SheetAction icon={Trash2} danger onClick={() => menuFor && handleDelete(menuFor)}>
          삭제
        </SheetAction>
      </Sheet>

      {/* 조건부 렌더로 열 때마다 폼 상태가 새로 시작된다 */}
      {editFor && <EditRecordSheet submission={editFor} onClose={() => setEditFor(null)} />}
      {attachFor && <AttachSheet submission={attachFor} onClose={() => setAttachFor(null)} />}
    </>
  )
}

/** 기록 수정 시트 — 제목·내용만 (.pen 컴포저와 같은 입력 스타일) */
function EditRecordSheet({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const { updateSubmission } = useStore()
  const toast = useToast()
  const [title, setTitle] = useState(submission.title)
  const [body, setBody] = useState(submission.body)

  function save() {
    if (!title.trim()) return
    updateSubmission(submission.id, { title: title.trim(), body: body.trim() })
    onClose()
    toast.show('수정했습니다')
  }

  return (
    <Sheet open onClose={onClose} title="기록 수정" wide>
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              save()
            }
          }}
          placeholder="제목"
          autoFocus
          className="h-touch w-full rounded-control bg-subtle px-3 text-label leading-[1.4] text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="내용 (선택)"
          rows={4}
          className="w-full resize-none rounded-control bg-subtle p-3 text-label text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-touch rounded-control px-3 text-meta font-medium text-ink-muted hover:bg-subtle"
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!title.trim()}
            className="h-touch rounded-control bg-primary px-5 text-meta font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
          >
            저장
          </button>
        </div>
      </div>
    </Sheet>
  )
}

/** 파일/링크 추가 시트 — 컴포저의 첨부 UI와 같은 규칙(최대 5개 · 20MB) */
function AttachSheet({ submission, onClose }: { submission: Submission; onClose: () => void }) {
  const { addAttachments } = useStore()
  const toast = useToast()
  const [pending, setPending] = useState<Attachment[]>([])
  const [linkValue, setLinkValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    if (submission.attachments.length + pending.length + files.length > MAX_FILES) {
      setError(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`)
      return
    }
    const oversized = files.find((f) => f.size > MAX_FILE_BYTES)
    if (oversized) {
      setError(`${oversized.name}은(는) 20MB를 초과합니다.`)
      return
    }
    setError(null)
    // id는 화면 키 용도 — 세션 내 첨부와 안 겹치게 큰 음수 사용
    const base = -Date.now()
    setPending((prev) => [
      ...prev,
      ...files.map((f, i) => ({ id: base - i, name: f.name, size: formatFileSize(f.size), kind: 'FILE' as const })),
    ])
  }

  function addLink() {
    const value = linkValue.trim()
    if (!value) return
    setPending((prev) => [...prev, { id: -Date.now(), name: value, size: '링크', kind: 'LINK' as const }])
    setLinkValue('')
  }

  function save() {
    if (pending.length === 0) return
    addAttachments(submission.id, pending)
    onClose()
    toast.show('첨부했습니다')
  }

  return (
    <Sheet open onClose={onClose} title="파일/링크 추가" wide>
      <div className="space-y-3">
        {pending.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {pending.map((a) => (
              <li
                key={a.id}
                className="flex h-touch items-center gap-2 rounded-control bg-primary-soft px-3 text-meta leading-[1.4] text-primary"
              >
                {a.kind === 'LINK' ? <LinkIcon size={14} /> : <Paperclip size={14} />}
                <span className="max-w-40 truncate">{a.name}</span>
                {a.kind !== 'LINK' && <span>{a.size}</span>}
                <button
                  type="button"
                  onClick={() => setPending((prev) => prev.filter((p) => p.id !== a.id))}
                  aria-label={`${a.name} 제거`}
                  className="text-primary hover:text-danger"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && <p className="text-meta text-danger">{error}</p>}

        <div className="flex gap-1.5">
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addLink()
              }
            }}
            placeholder="https://…"
            className="w-full rounded-control border border-line bg-surface px-3 py-1.5 text-meta text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={addLink}
            className="shrink-0 rounded-control bg-primary px-3 text-meta font-medium text-on-primary hover:bg-primary-hover"
          >
            추가
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex h-touch cursor-pointer items-center gap-1 rounded-control px-2 text-meta font-medium text-ink-muted hover:text-ink">
            <Paperclip size={16} />
            파일 선택
            <input type="file" multiple className="hidden" onChange={handleFiles} />
          </label>
          <span className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="h-touch rounded-control px-3 text-meta font-medium text-ink-muted hover:bg-subtle"
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={pending.length === 0}
            className="h-touch rounded-control bg-primary px-5 text-meta font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
          >
            저장
          </button>
        </div>
      </div>
    </Sheet>
  )
}
