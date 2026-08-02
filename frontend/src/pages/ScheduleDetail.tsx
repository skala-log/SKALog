import { Ellipsis, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AttachmentCount, TodayBadge, TypeBadge, WeekBadge } from '../components/Badge'
import { Card, SectionHeader } from '../components/Card'
import { InlineComposer } from '../components/InlineComposer'
import { MaterialEmpty, MaterialRow } from '../components/MaterialRow'
import { AppHeader, BackLink } from '../components/Shell'
import { Sheet, SheetAction } from '../components/Sheet'
import { dateTimeLabel, isToday, weekdayFullLabel } from '../lib/format'
import { materialsFor, submissionsFor } from '../lib/selectors'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Submission } from '../lib/types'

export default function ScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { schedules, materials, submissions, removeSubmission, restoreSubmission } = useStore()
  const toast = useToast()
  const [menuFor, setMenuFor] = useState<Submission | null>(null)
  const [justSavedId, setJustSavedId] = useState<number | null>(null)

  const schedule = schedules.find((s) => s.id === Number(id))
  if (!schedule) return <Navigate to="/timeline" replace />

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
            {/* 데스크톱(D2)은 `7월 30일 목요일 · 권기창` 처럼 강사까지 한 줄에 붙인다 */}
            <span className="text-meta text-ink-muted">
              {weekdayFullLabel(schedule.date)}
              {schedule.instructor && <span className="hidden lg:inline"> · {schedule.instructor}</span>}
            </span>
            {isToday(schedule.date) && <span className="ml-auto"><TodayBadge /></span>}
          </div>
          <h1 className="mt-1.5 text-title font-semibold text-ink lg:text-display">{schedule.subject}</h1>
          {schedule.instructor && <p className="mt-1 text-meta text-ink-muted lg:hidden">{schedule.instructor}</p>}
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
                  <MaterialRow key={m.id} material={m} variant="card" by={schedule.instructor} />
                ))
              )}
            </div>
          </section>

          <section>
            <SectionHeader title="내 기록" count={records.length} />
            <div className="mt-2.5 space-y-2.5">
              {/* S3 · 컴포저 펼침 */}
              <InlineComposer schedule={schedule} onSaved={setJustSavedId} />

              {records.map((r) => (
                <div
                  key={r.id}
                  className={
                    'flex items-start gap-2.5 rounded-card border bg-surface px-3 py-2.5 transition-colors ' +
                    // S4 · 저장 직후: 방금 저장한 기록을 잠깐 강조
                    (justSavedId === r.id ? 'border-primary bg-primary-soft' : 'border-line')
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={r.type} />
                      <span className="min-w-0 truncate text-label font-medium text-ink">{r.title}</span>
                    </div>
                    {r.body && <p className="mt-1.5 whitespace-pre-wrap text-meta text-ink-muted">{r.body}</p>}
                    <div className="mt-1.5 flex items-center gap-2 text-meta text-ink-muted">
                      <span>{dateTimeLabel(r.createdAt)}</span>
                      <AttachmentCount count={r.attachments.length} />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMenuFor(r)}
                    aria-label="기록 메뉴"
                    className="-mr-1 flex size-9 shrink-0 items-center justify-center rounded-control text-ink-muted hover:bg-subtle"
                  >
                    <Ellipsis size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <Card variant="placeholder" className="min-h-20">
          공지 · 출결 섹션 자리
        </Card>
      </div>

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.title}>
        <SheetAction icon={Pencil} onClick={() => toast.show('준비 중입니다')}>
          수정
        </SheetAction>
        <SheetAction icon={FilePlus2} onClick={() => toast.show('준비 중입니다')}>
          파일 추가
        </SheetAction>
        <SheetAction icon={Trash2} danger onClick={() => menuFor && handleDelete(menuFor)}>
          삭제
        </SheetAction>
      </Sheet>
    </>
  )
}
