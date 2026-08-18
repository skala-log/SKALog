import { Ellipsis, FilePlus2, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { AttachmentCount, InstructorList, TodayBadge, TypeBadge, WeekBadge } from '../components/Badge'
import { Card, SectionHeader } from '../components/Card'
import { InlineComposer } from '../components/InlineComposer'
import { MaterialEmpty, MaterialRow } from '../components/MaterialRow'
import { AppHeader, BackLink } from '../components/Shell'
import { Sheet, SheetAction } from '../components/Sheet'
import { SkeletonCard } from '../components/States'
import { dateTimeLabel, instructorNames, isToday, weekdayFullLabel } from '../lib/format'
import { materialsFor, submissionsFor } from '../lib/selectors'
import { useStore } from '../lib/store'
import { useToast } from '../lib/toast'
import type { Submission } from '../lib/types'

export default function ScheduleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { schedules, schedulesLoaded, materials, submissions, removeSubmission, restoreSubmission } = useStore()
  const toast = useToast()
  const [menuFor, setMenuFor] = useState<Submission | null>(null)
  const [justSavedId, setJustSavedId] = useState<number | null>(null)

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

              {records.map((r) => (
                <div
                  key={r.id}
                  className={
                    'flex items-start gap-3 rounded-card border bg-surface px-4 py-3 transition-colors ' +
                    // S4 · 저장 직후: 방금 저장한 기록을 잠깐 강조
                    (justSavedId === r.id ? 'border-primary bg-primary-soft' : 'border-line')
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <TypeBadge type={r.type} />
                      <span className="min-w-0 truncate text-label font-medium text-ink">{r.title}</span>
                    </div>
                    {r.body && <p className="mt-1 whitespace-pre-wrap text-meta text-ink-muted">{r.body}</p>}
                    <div className="mt-0.5 flex items-center gap-2 text-meta leading-[1.4] text-ink-muted">
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
