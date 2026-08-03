import { ChevronRight, Info, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Badge, TodayBadge, WeekBadge } from '../components/Badge'
import { Card, SectionHeader } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { LinkRail, MealStrip, NoticeList } from '../components/HomeBlocks'
import { InlineComposer } from '../components/InlineComposer'
import { ScheduleRow, RecordRow } from '../components/ListItem'
import { MaterialEmpty, MaterialRow } from '../components/MaterialRow'
import { AppHeader } from '../components/Shell'
import { ErrorState, SkeletonCard, SkeletonLine } from '../components/States'
import { dayLabel, formatMD, weekdayFullLabel, weekdayOf, weekTag } from '../lib/format'
import { CLASS_NAME, MOCK_MEALS, MOCK_NOTICES, QUICK_LINKS, TOTAL_WEEKS, USER_NAME } from '../lib/mock'
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
  // 식단 스트립: 열을 누르면 그날 중·석식이 펼쳐진다 (일정표 자료 아코디언과 같은 패턴)
  const [openMeal, setOpenMeal] = useState<string | null>(null)
  const toggleMeal = (date: string) => setOpenMeal((cur) => (cur === date ? null : date))

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
  // 주차 옆 ⓘ 툴팁 — 주차 대신 '며칠째'로도 볼 수 있게 한다(주말 제외 실제 교육일 기준)
  const totalDays = schedules.length
  const elapsedDays = schedules.filter((s) => s.date <= (anchorDate || s.date)).length

  return (
    <>
      <AppHeader title="SKALog" brand right={`${CLASS_NAME} · ${USER_NAME}`} />

      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        {/*
          [1층] 히어로 — 카드가 아니다. 테두리 없이 옅은 워시만 깔아 "존" 으로 읽히게 한다.
          인사 · 날짜 · 진행도 · 오늘 강의(자료+컴포저)까지가 한 덩어리다.
        */}
        <section className="rounded-card bg-subtle p-4 lg:p-5">
          {loading ? (
            <SkeletonLine className="h-6 w-48" />
          ) : (
            <h1 className="text-title font-semibold text-ink lg:text-display">안녕하세요, {USER_NAME}님</h1>
          )}
          {!loading && (
            <p className="mt-1 hidden text-label text-ink-muted lg:block">
              {todaySchedule
                ? `오늘 일정 ${todaySchedules.length}건과 새 자료 ${materialsFor(materials, todaySchedule.id).length}건이 기다리고 있어요.`
                : '오늘은 강의가 없습니다. 지난 강의를 정리하기 좋은 날이에요.'}
            </p>
          )}

          {loading ? (
            <SkeletonLine className="mt-3 h-6 w-64" />
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <p className="text-heading font-semibold text-ink">{weekdayFullLabel(anchorDate)}</p>
              <WeekBadge weekNo={currentWeekNo} tone="primary" />
              <p className="ml-auto shrink-0 text-meta text-ink-muted tabular-nums">
                {currentWeekNo} / {TOTAL_WEEKS}주차
              </p>
              <span
                title={`교육 ${elapsedDays}일째 · 총 ${totalDays}일 과정 (주말 제외)`}
                className="shrink-0 text-ink-faint"
              >
                <Info size={14} />
              </span>
            </div>
          )}

          {/* 로딩 중에는 진행바도 스켈레톤이다 (.pen S1 — 그라데이션이 미리 보이면 안 된다) */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-accent">
            {!loading && (
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${Math.round((currentWeekNo / TOTAL_WEEKS) * 100)}%`,
                  backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-mint))',
                }}
              />
            )}
          </div>

          <div className="mt-4">
            {loading ? (
              <SkeletonLine className="h-40 w-full" />
            ) : todaySchedule ? (
              <TodayCard scheduleId={todaySchedule.id} bare />
            ) : (
              <NoClassCard
                nextScheduleId={nextSchedule?.id ?? null}
                composerScheduleId={composerSchedule?.id ?? null}
                bare
              />
            )}
          </div>
        </section>

        {/* [2층] 바로가기 레일 — 카드 나열이 아니라 가로 스크롤 타일 */}
        <LinkRail links={QUICK_LINKS} />

        {/* [3층] 소식 — 공지 목록 + 주간 식단 스트립. 데스크톱은 2열 */}
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="min-w-0">
            <NoticeList notices={MOCK_NOTICES} />
          </div>
          <div className="min-w-0">
            <MealStrip meals={MOCK_MEALS} openDate={openMeal} onToggle={toggleMeal} />
          </div>
        </div>

        {/*
          [4층] 학습 맥락 — 이번 주 일정 + 내 최근 기록.
          데스크톱은 2열 그리드.
        */}
        {/* min-w-0 : 그리드 아이템 기본값(min-width:auto)이면 -mx-3 목록이 컬럼을 넓혀 가로 스크롤이 생긴다 */}
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* S8 · 카드 단위 에러는 .pen 기준 '이번 주' 카드에서 일어난다 */}
          {loading ? (
            <div className="min-w-0">
              <SkeletonCard lines={4} />
            </div>
          ) : (
            <Card
              title="이번 주"
              action={<WeekBadge weekNo={currentWeekNo} tone="primary" />}
              className="min-w-0"
            >
              {cardError ? (
                <ErrorState onRetry={() => setCardError(false)} />
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
          )}

          <div className="min-w-0">
            {loading ? (
              <SkeletonCard lines={4} />
            ) : (
              <RecentRecords recentIds={recentRecords.map((r) => r.id)} composerAvailable={!!composerSchedule} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function TodayCard({ scheduleId, bare = false }: { scheduleId: number; bare?: boolean }) {
  const { schedules, materials } = useStore()
  const schedule = scheduleById(schedules, scheduleId)!
  const scheduleMaterials = materialsFor(materials, scheduleId)

  return (
    <Card title="오늘 강의" action={<TodayBadge />} bare={bare}>
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
  bare = false,
}: {
  nextScheduleId: number | null
  composerScheduleId: number | null
  bare?: boolean
}) {
  const { schedules } = useStore()
  const next = nextScheduleId ? scheduleById(schedules, nextScheduleId) : null
  const composerSchedule = composerScheduleId ? scheduleById(schedules, composerScheduleId) : null

  // .pen S2 : 카드 제목이 "다음 강의"로 바뀌고, 우측 배지는 그 강의의 날짜다.
  return (
    <Card
      title="다음 강의"
      bare={bare}
      action={
        next ? (
          <Badge tone="primary" className="tabular-nums">
            {formatMD(next.date)} ({weekdayOf(next.date)})
          </Badge>
        ) : undefined
      }
    >
      {next ? (
        <Link to={`/timeline/${next.id}`} className="group block">
          <p className="text-title font-semibold text-ink group-hover:text-primary">{next.subject}</p>
          <p className="mt-0.5 text-meta text-ink-muted">
            {[next.instructor, weekTag(next.weekNo)].filter(Boolean).join(' · ')}
          </p>
        </Link>
      ) : (
        <p className="text-meta text-ink-muted">남은 일정이 없습니다.</p>
      )}

      {/* 다음 강의 자료는 아직 없다 — 수집 주기를 알려 불안을 없앤다 */}
      <SectionHeader icon={Paperclip} muted title="강의자료" count={0} className="mt-4" />
      <div className="mt-2">
        <MaterialEmpty />
      </div>

      {/* 강의 없는 날에도 기록 경로가 죽지 않는다 — 최근 강의로 컴포저를 유지 */}
      {composerSchedule && (
        <div id="composer" className="mt-4">
          <InlineComposer
            schedule={composerSchedule}
            collapsedLabel={`최근 강의(${formatMD(composerSchedule.date)})에 기록 남기기`}
          />
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
