import { ChevronRight, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { TodayBadge, WeekBadge } from '../components/Badge'
import { Card, SectionHeader } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { InlineComposer } from '../components/InlineComposer'
import { ScheduleRow, RecordRow } from '../components/ListItem'
import { MaterialEmpty, MaterialRow } from '../components/MaterialRow'
import { AppHeader } from '../components/Shell'
import { ErrorCard, SkeletonCard, SkeletonLine } from '../components/States'
import { dayLabel, weekdayFullLabel, weekTag } from '../lib/format'
import { CLASS_NAME, TOTAL_WEEKS, USER_NAME } from '../lib/mock'
import {
  getCurrentWeekNo,
  getNextSchedule,
  getPreviousSchedule,
  getTodaySchedule,
  materialsFor,
  scheduleById,
  schedulesInWeek,
  submissionsFor,
} from '../lib/selectors'
import { useStore } from '../lib/store'

export default function Home() {
  const { schedules, materials, submissions } = useStore()
  const location = useLocation()
  const [params] = useSearchParams()

  // S1 · 로딩 / S2 · 오늘 강의 없음 / S8 · 카드 단위 에러 를 ?state= 로 직접 확인할 수 있게 한다.
  const state = params.get('state')
  const [loading, setLoading] = useState(state === 'loading')
  const [cardError, setCardError] = useState(state === 'error')

  useEffect(() => {
    setLoading(state === 'loading')
    setCardError(state === 'error')
  }, [state])

  useEffect(() => {
    if (location.hash === '#composer') {
      document.getElementById('composer')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [location.hash])

  const realToday = getTodaySchedule(schedules)
  const todaySchedule = state === 'no-class' ? null : realToday
  const nextSchedule = getNextSchedule(schedules)
  const previousSchedule = getPreviousSchedule(schedules)
  const composerSchedule = todaySchedule ?? previousSchedule ?? nextSchedule
  const currentWeekNo = getCurrentWeekNo(schedules)
  const weekSchedules = schedulesInWeek(schedules, currentWeekNo)
  const todaySchedules = todaySchedule ? schedules.filter((s) => s.date === todaySchedule.date) : []
  const recentRecords = [...submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
  const anchorDate = todaySchedule?.date ?? nextSchedule?.date ?? previousSchedule?.date ?? ''

  return (
    <>
      <AppHeader title="SKALog" brand right={`${CLASS_NAME} · ${USER_NAME}`} />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        {/* D1 인사말 — 데스크톱 전용 */}
        <div className="hidden lg:block">
          <h1 className="text-display font-semibold text-ink">안녕하세요, {USER_NAME}님!</h1>
          <p className="mt-1 text-body text-ink-muted">
            {todaySchedule
              ? `오늘 일정 ${todaySchedules.length}건과 새 자료 ${materialsFor(materials, todaySchedule.id).length}건이 기다리고 있어요.`
              : '오늘은 강의가 없습니다. 지난 강의를 정리하기 좋은 날이에요.'}
          </p>
        </div>

        {/* 오늘 스트립 — 한 줄: 날짜 + W배지 ... 우측 진행도 */}
        {loading ? (
          <SkeletonLine className="h-6 w-64" />
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-heading font-semibold text-ink">{weekdayFullLabel(anchorDate)}</p>
            <WeekBadge weekNo={currentWeekNo} tone="primary" />
            <p className="ml-auto shrink-0 text-meta text-ink-muted tabular-nums">
              {currentWeekNo} / {TOTAL_WEEKS}주차
            </p>
          </div>
        )}

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle">
          <div
            className="h-full rounded-full transition-[width]"
            style={{
              width: `${Math.round((currentWeekNo / TOTAL_WEEKS) * 100)}%`,
              backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-mint))',
            }}
          />
        </div>

        {/*
          DOM 순서 = 모바일 순서(오늘 강의 → 이번 주 → 내 최근 기록 → 슬롯).
          데스크톱(D1)은 grid 배치로 오늘 강의만 왼쪽, 나머지는 오른쪽 컬럼에 쌓는다.
        */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            {loading ? (
              <SkeletonCard lines={4} />
            ) : cardError ? (
              <ErrorCard message="오늘 강의를 불러오지 못했습니다" onRetry={() => setCardError(false)} />
            ) : todaySchedule ? (
              <TodayCard scheduleId={todaySchedule.id} />
            ) : (
              <NoClassCard nextScheduleId={nextSchedule?.id ?? null} composerScheduleId={composerSchedule?.id ?? null} />
            )}
          </div>

          <Card
            title="이번 주"
            action={<WeekBadge weekNo={currentWeekNo} tone="primary" />}
            className="lg:col-start-2 lg:row-start-1"
          >
            {loading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <SkeletonLine key={i} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              <ul className="-mx-3">
                {weekSchedules.map((s) => (
                  <li key={s.id}>
                    <ScheduleRow
                      schedule={s}
                      materialCount={materialsFor(materials, s.id).length}
                      hasRecord={submissionsFor(submissions, s.id).length > 0}
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="lg:col-start-2 lg:row-start-2">
            <RecentRecords recentIds={recentRecords.map((r) => r.id)} composerAvailable={!!composerSchedule} />
          </div>

          {/* .pen D1 : 슬롯은 두 컬럼 아래를 가로로 가득 채운다 */}
          <Card variant="placeholder" className="min-h-24 lg:col-span-2 lg:row-start-3">
            공지 · 출결 카드가 들어올 자리
          </Card>
        </div>
      </div>
    </>
  )
}

function TodayCard({ scheduleId }: { scheduleId: number }) {
  const { schedules, materials } = useStore()
  const schedule = scheduleById(schedules, scheduleId)!
  const scheduleMaterials = materialsFor(materials, scheduleId)

  return (
    <Card title="오늘 강의" action={<TodayBadge />}>
      <Link to={`/timeline/${schedule.id}`} className="group block">
        <p className="text-title font-semibold text-ink group-hover:text-primary">{schedule.subject}</p>
        {schedule.instructor && <p className="mt-0.5 text-meta text-ink-muted">{schedule.instructor}</p>}
      </Link>

      <SectionHeader icon={Paperclip} muted title="강의자료" count={scheduleMaterials.length} className="mt-4" />
      <div className="mt-2 space-y-1.5">
        {scheduleMaterials.length === 0 ? (
          <MaterialEmpty />
        ) : (
          scheduleMaterials.map((m) => <MaterialRow key={m.id} material={m} />)
        )}
      </div>

      <div id="composer" className="mt-4">
        <InlineComposer schedule={schedule} />
      </div>
    </Card>
  )
}

/** S2 · 홈 / 오늘 강의 없음 */
function NoClassCard({
  nextScheduleId,
  composerScheduleId,
}: {
  nextScheduleId: number | null
  composerScheduleId: number | null
}) {
  const { schedules } = useStore()
  const next = nextScheduleId ? scheduleById(schedules, nextScheduleId) : null
  const composerSchedule = composerScheduleId ? scheduleById(schedules, composerScheduleId) : null

  return (
    <Card title="오늘은 강의가 없습니다">
      {next ? (
        <Link to={`/timeline/${next.id}`} className="group block rounded-control bg-subtle px-3 py-3">
          <p className="text-meta text-ink-muted">
            다음 강의 · {weekdayFullLabel(next.date)} · {weekTag(next.weekNo)}
          </p>
          <p className="mt-1 text-label font-medium text-ink group-hover:text-primary">{next.subject}</p>
          {next.instructor && <p className="mt-0.5 text-meta text-ink-muted">{next.instructor}</p>}
        </Link>
      ) : (
        <p className="text-meta text-ink-muted">남은 일정이 없습니다.</p>
      )}

      {composerSchedule && (
        <div id="composer" className="mt-4">
          <p className="mb-2 text-meta text-ink-muted">
            지난 강의({composerSchedule.subject})에 기록을 남길 수 있습니다.
          </p>
          <InlineComposer schedule={composerSchedule} />
        </div>
      )}
    </Card>
  )
}

function RecentRecords({ recentIds, composerAvailable }: { recentIds: number[]; composerAvailable: boolean }) {
  const { schedules, submissions } = useStore()
  const records = recentIds.map((id) => submissions.find((s) => s.id === id)).filter((s) => s !== undefined)

  return (
    <Card
      title="내 최근 기록"
      action={
        <Link to="/records" className="flex items-center gap-0.5 text-label font-medium text-primary hover:underline">
          전체 보기
          <ChevronRight size={15} />
        </Link>
      }
    >
      {records.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          message="아직 기록이 없습니다"
          alternative="한 줄만 남겨도 포트폴리오가 됩니다."
          action={
            composerAvailable && (
              <a
                href="#composer"
                className="flex h-touch items-center rounded-control bg-primary px-4 text-label font-medium text-on-primary hover:bg-primary-hover"
              >
                오늘 강의에 기록 남기기
              </a>
            )
          }
          className="border-0 py-6"
        />
      ) : (
        <ul className="-mx-3">
          {records.map((r) => (
            <li key={r.id}>
              <RecordRow
                submission={r}
                subtitle={`${scheduleById(schedules, r.scheduleId)?.subject ?? ''} · ${dayLabel(r.createdAt)}`}
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
