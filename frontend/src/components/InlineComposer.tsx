import { Link as LinkIcon, Paperclip, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
}

export function InlineComposer({ schedule, onSaved }: InlineComposerProps) {
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
          {hasDraft ? '이어서 쓰기' : '이 강의에 기록 남기기'}
        </button>
      </div>
    )
  }

  return (
    <div ref={formTopRef} className="rounded-control border border-line-accent bg-subtle p-3">
      <p className="truncate text-meta text-ink-muted">
        {weekTag(schedule.weekNo)} · {schedule.subject} 에 저장됩니다
      </p>

      <div className="mt-2 flex gap-1.5">
        {(['NOTE', 'ASSIGNMENT'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={
              'h-9 rounded-full px-3 text-label font-medium transition-colors ' +
              (type === t
                ? t === 'NOTE'
                  ? 'bg-note-bg text-note'
                  : 'bg-assignment-bg text-assignment'
                : 'bg-surface text-ink-muted border border-line')
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
        className="mt-2 w-full rounded-control border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
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
        className="mt-2 w-full resize-none rounded-control border border-line bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-faint focus:border-primary focus:outline-none"
      />

      {attachments.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-1 rounded-full border border-line bg-surface px-2 py-1 text-meta text-ink-muted"
            >
              {a.kind === 'LINK' ? <LinkIcon size={12} /> : <Paperclip size={12} />}
              <span className="max-w-40 truncate">{a.name}</span>
              {a.kind !== 'LINK' && <span>{a.size}</span>}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={`${a.name} 제거`}
                className="text-ink-faint hover:text-danger"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {fileError && <p className="mt-1.5 text-meta text-danger">{fileError}</p>}

      {linkFieldOpen && (
        <div className="mt-2 flex gap-1.5">
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

      <div className="mt-2 flex items-center justify-between">
        <div className="flex gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-label text-ink-muted hover:text-ink">
            <Paperclip size={16} />
            파일
            <input type="file" multiple className="hidden" onChange={handleFiles} />
          </label>
          <button
            type="button"
            onClick={() => setLinkFieldOpen((v) => !v)}
            className="flex items-center gap-1.5 text-label text-ink-muted hover:text-ink"
          >
            <LinkIcon size={16} />
            링크
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={closeForm}
            className="h-9 rounded-control px-3 text-label text-ink-muted hover:bg-surface"
          >
            취소
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!title.trim() || saving}
            className="h-9 rounded-control bg-primary px-4 text-label font-medium text-on-primary transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-faint"
          >
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
