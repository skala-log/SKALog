import { Link as LinkIcon, Paperclip, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from './Badge'
import { formatFileSize, weekTag } from '../lib/format'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Attachment, Schedule, SubmissionType } from '../lib/types'

const MAX_FILES = 5
const MAX_FILE_BYTES = 20 * 1024 * 1024

type Draft = { type: SubmissionType; title: string; body: string }

function draftKey(scheduleId: number) {
  return `draft:schedule:${scheduleId}`
}

function readDraft(scheduleId: number): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(scheduleId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Draft
    if (!parsed.title && !parsed.body) return null
    return parsed
  } catch {
    return null
  }
}

type InlineComposerProps = {
  schedule: Schedule
  onSaved?: (submissionId: number) => void
  /** 접힘 상태 문구 override — S2 처럼 "최근 강의(7/30)에 기록 남기기" 로 바꿔야 할 때 */
  collapsedLabel?: string
}

export function InlineComposer({ schedule, onSaved, collapsedLabel }: InlineComposerProps) {
  const { addSubmission, removeSubmission } = useStore()
  const toast = useToast()

  const [open, setOpen] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [type, setType] = useState<SubmissionType>('NOTE')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [linkFieldOpen, setLinkFieldOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)
  const attachmentId = useRef(0)
  const formTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setHasDraft(readDraft(schedule.id) !== null)
  }, [schedule.id])

  useEffect(() => {
    if (!open) return
    const handle = window.setTimeout(() => {
      if (title || body) {
        localStorage.setItem(draftKey(schedule.id), JSON.stringify({ type, title, body }))
      } else {
        localStorage.removeItem(draftKey(schedule.id))
      }
    }, 300)
    return () => window.clearTimeout(handle)
  }, [open, type, title, body, schedule.id])

  function resetFields() {
    setType('NOTE')
    setTitle('')
    setBody('')
    setAttachments([])
    setLinkFieldOpen(false)
    setLinkValue('')
    setFileError(null)
  }

  function openForm() {
    const draft = readDraft(schedule.id)
    if (draft) {
      setType(draft.type)
      setTitle(draft.title)
      setBody(draft.body)
    } else {
      resetFields()
    }
    setOpen(true)
    window.setTimeout(() => {
      formTopRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      titleRef.current?.focus()
    }, 0)
  }

  function closeForm() {
    setOpen(false)
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return
    if (attachments.length + files.length > MAX_FILES) {
      setFileError(`파일은 최대 ${MAX_FILES}개까지 첨부할 수 있습니다.`)
      return
    }
    const oversized = files.find((f) => f.size > MAX_FILE_BYTES)
    if (oversized) {
      setFileError(`${oversized.name}은(는) 20MB를 초과합니다.`)
      return
    }
    setFileError(null)
    setAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({
        id: --attachmentId.current,
        name: f.name,
        size: formatFileSize(f.size),
        kind: 'FILE' as const,
      })),
    ])
  }

  function addLink() {
    const value = linkValue.trim()
    if (!value) return
    setAttachments((prev) => [...prev, { id: --attachmentId.current, name: value, size: '링크', kind: 'LINK' }])
    setLinkValue('')
    setLinkFieldOpen(false)
  }

  function removeAttachment(id: number) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function save() {
    if (!title.trim() || saving) return
    setSaving(true)
    // ponytail: attachments는 백엔드에 업로드 API가 없어 이 세션 화면에만 보이고 저장/새로고침 시 사라진다.
    // 파일 업로드를 v1에 넣기로 하면 submission에 file_key 저장 + 업로드 엔드포인트 추가.
    const submission = addSubmission({
      scheduleId: schedule.id,
      type,
      title: title.trim(),
      body: body.trim(),
      attachments,
    })
    localStorage.removeItem(draftKey(schedule.id))
    setHasDraft(false)
    setSaving(false)
    setOpen(false)
    resetFields()
    onSaved?.(submission.id)
    toast.show('기록했습니다', { undo: () => removeSubmission(submission.id) })
  }

  if (!open) {
    return (
      <div>
        {hasDraft && <p className="mb-1.5 text-meta text-ink-muted">작성 중이던 기록이 있습니다</p>}
        {/* .pen `m3Wlc` Composer/Collapsed — 실선 테두리 흰 박스, 보라 + 아이콘 뒤 좌측 정렬 텍스트 */}
        <button
          type="button"
          onClick={openForm}
          className="flex h-11 w-full items-center gap-2 rounded-control border border-line-accent bg-surface px-3 text-label text-ink-muted transition-colors hover:border-primary hover:text-primary"
        >
          <Plus size={16} className="text-primary" />
          {hasDraft ? '이어서 쓰기' : (collapsedLabel ?? '이 강의에 기록 남기기')}
        </button>
      </div>
    )
  }

  return (
    /* .pen `MRZgz` : 흰 배경 + primary 1px 테두리, radius 12, padding 16, gap 12 */
    <div ref={formTopRef} className="space-y-3 rounded-card border border-primary bg-surface p-4">
      {/* 확인 라벨 — 주차는 배지, 나머지는 읽기 전용 문구 (선택 필드가 아니다) */}
      <div className="flex items-center gap-2">
        <Badge tone="primary" className="tabular-nums">
          {weekTag(schedule.weekNo)}
        </Badge>
        <p className="min-w-0 flex-1 truncate text-meta text-ink-muted">{schedule.subject}에 저장됩니다</p>
      </div>

      <div className="flex gap-2">
        {(['NOTE', 'ASSIGNMENT'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={type === t}
            className={
              'h-touch rounded-full px-4 text-label transition-colors ' +
              (type === t
                ? 'border border-primary bg-primary-soft font-semibold text-primary'
                : 'bg-subtle font-medium text-ink-muted hover:text-ink')
            }
          >
            {t === 'NOTE' ? '노트' : '과제'}
          </button>
        ))}
      </div>

      <input
        ref={titleRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
        placeholder="제목"
        className="h-touch w-full rounded-control bg-subtle px-3 text-body text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            save()
          }
        }}
        placeholder="내용 (선택)"
        rows={3}
        className="h-21 w-full resize-none rounded-control bg-subtle p-3 text-body text-ink placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-primary"
      />

      {attachments.length > 0 && (
        /* .pen `RAIEC` : 44px 높이 primary-soft 칩 */
        <ul className="flex flex-wrap gap-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex h-touch items-center gap-2 rounded-control bg-primary-soft px-3 text-meta text-primary"
            >
              {a.kind === 'LINK' ? <LinkIcon size={14} /> : <Paperclip size={14} />}
              <span className="max-w-40 truncate">{a.name}</span>
              {a.kind !== 'LINK' && <span>{a.size}</span>}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={`${a.name} 제거`}
                className="text-primary hover:text-danger"
              >
                <X size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {fileError && <p className="text-meta text-danger">{fileError}</p>}

      {linkFieldOpen && (
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
            autoFocus
            className="w-full rounded-control border border-line bg-surface px-3 py-1.5 text-meta text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={addLink}
            className="shrink-0 rounded-control bg-primary px-3 text-label font-medium text-on-primary hover:bg-primary-hover"
          >
            추가
          </button>
        </div>
      )}

      {/* .pen `IyjmL` Toolbar — 전부 44px, 선택 기능(파일·링크)은 테두리 없는 텍스트 버튼 */}
      <div className="flex items-center gap-2">
        <label className="flex h-touch cursor-pointer items-center gap-1 rounded-control px-2 text-label font-medium text-ink-muted hover:text-ink">
          <Paperclip size={16} />
          파일
          <input type="file" multiple className="hidden" onChange={handleFiles} />
        </label>
        <button
          type="button"
          onClick={() => setLinkFieldOpen((v) => !v)}
          className="flex h-touch items-center gap-1 rounded-control px-2 text-label font-medium text-ink-muted hover:text-ink"
        >
          <LinkIcon size={16} />
          링크
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={closeForm}
          className="h-touch rounded-control px-3 text-label font-medium text-ink-muted hover:bg-subtle"
        >
          취소
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!title.trim() || saving}
          className="h-touch rounded-control bg-primary px-5 text-label font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>

      {/*
        S3 · 모바일 전용 sticky 저장 바 (.pen `WRukt`).
        §6.3 — 키보드를 내렸다 저장하는 동작이 들어가면 30초가 깨진다.
        하단 탭바를 덮도록 z-50 으로 올린다.
      */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex h-header items-center gap-2 border-t border-line bg-surface px-4 lg:hidden">
        <label className="flex h-touch cursor-pointer items-center gap-1 rounded-control px-2 text-label font-medium text-ink-muted">
          <Paperclip size={16} />
          파일
          <input type="file" multiple className="hidden" onChange={handleFiles} />
        </label>
        <span className="flex-1" />
        <span className="text-meta text-ink-faint">⌘↵</span>
        <button
          type="button"
          onClick={save}
          disabled={!title.trim() || saving}
          className="h-touch rounded-control bg-primary px-5 text-label font-semibold text-on-primary disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
        >
          {saving ? '저장 중…' : '저장'}
        </button>
      </div>
    </div>
  )
}
