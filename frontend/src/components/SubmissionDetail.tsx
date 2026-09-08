import { Link as LinkIcon, Paperclip } from 'lucide-react'
import type { Submission } from '../lib/types'

/** 기록 확장 상세 — 내용 + 첨부(파일/링크). 내 기록 페이지와 일정 상세가 같이 쓴다 */
export function SubmissionDetail({ submission }: { submission: Submission }) {
  const { body, attachments } = submission
  if (!body && attachments.length === 0) {
    return <p className="text-meta leading-[1.4] text-ink-faint">내용 없이 제목만 남긴 기록입니다</p>
  }
  return (
    <div className="space-y-2.5">
      {body && <p className="whitespace-pre-wrap text-meta leading-relaxed text-ink">{body}</p>}
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {attachments.map((a) =>
            a.kind === 'LINK' ? (
              <li key={a.id}>
                <a
                  href={/^https?:\/\//.test(a.name) ? a.name : `https://${a.name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 items-center gap-1.5 rounded-control bg-primary-soft px-2.5 text-meta leading-[1.4] text-primary hover:underline"
                >
                  <LinkIcon size={13} />
                  <span className="max-w-60 truncate">{a.name}</span>
                </a>
              </li>
            ) : (
              // ponytail: 파일은 업로드 API가 없어 서버에 내용이 저장되지 않는다 — 이름·크기만 표시(이 세션 한정).
              // 실제 열람이 필요하면 업로드 엔드포인트 + submission에 file_key 저장부터.
              <li
                key={a.id}
                className="flex h-8 items-center gap-1.5 rounded-control bg-subtle px-2.5 text-meta leading-[1.4] text-ink-muted"
              >
                <Paperclip size={13} />
                <span className="max-w-60 truncate">{a.name}</span>
                <span className="text-ink-faint">{a.size}</span>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}
