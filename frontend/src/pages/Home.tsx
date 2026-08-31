import { ChevronRight, Info, Paperclip } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Badge, InstructorList, WeekBadge } from '../components/Badge'
import { Card, SectionHeader } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ClassModeBadge, LinkRail, MealSection, NoticeList, ScheduleScroll, ThisWeekCard, useMeals } from '../components/HomeBlocks'
import { InlineComposer } from '../components/InlineComposer'
import { RecordRow } from '../components/ListItem'
import { MaterialEmpty, MaterialRow } from '../components/MaterialRow'
import { AppHeader } from '../components/Shell'
import { ErrorState, SkeletonCard, SkeletonLine } from '../components/States'
import { Tooltip } from '../components/Tooltip'
import { dayLabel, formatMD, instructorNames, weekdayFullLabel, weekdayOf, weekTag } from '../lib/format'
import { get } from '../lib/api'
import { useMe } from '../lib/auth'
import { QUICK_LINKS, TOTAL_WEEKS } from '../lib/mock'
import {
  getCurrentWeekNo,
  getNextSchedule,
  getPreviousSchedule,
  getTodaySchedule,
  materialsFor,
  newMaterialCount,
  scheduleById,
} from '../lib/selectors'
import { useStore } from '../lib/store'
import type { ClassMode, Notice, Schedule } from '../lib/types'

/** 백엔드 공지 응답. url은 permalink 조회 실패 시 null이라 슬랙 홈으로 폴백한다. */
type ApiNotice = Omit<Notice, 'url'> & { url: string | null }

function toNotice(n: ApiNotice): Notice {
  return { ...n, url: n.url ?? 'https://theskala.slack.com/' }
}

export default function Home() {
  const me = useMe()
  const { schedules, submissions, materials } = useStore()
  const location = useLocation()
  const [params] = useSearchParams()

  // S1 · 로딩 / S2 · 오늘 강의 없음 / S8 · 카드 단위 에러 를 ?state= 로 직접 확인할 수 있게 한다.
  const state = params.get('state')
  const [loading, setLoading] = useState(state === 'loading')
  const [cardError, setCardError] = useState(state === 'error')
  const [notices, setNotices] = useState<Notice[]>([])
  const [noticesLoaded, setNoticesLoaded] = useState(false)
  const meals = useMeals()

  useEffect(() => {
    get<ApiNotice[]>('/notices')
      .then((raw) => setNotices(raw.map(toNotice)))
      .catch(() => {}) // 공지 로드 실패는 홈을 막지 않는다 — 빈 상태로 보여준다
      .finally(() => setNoticesLoaded(true))
  }, [])

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
  const recentRecords = [...submissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
  const anchorDate = todaySchedule?.date ?? nextSchedule?.date ?? previousSchedule?.date ?? ''
  // 주차 옆 ⓘ 툴팁 — 주차 대신 '며칠째'로도 볼 수 있게 한다(주말 제외 실제 교육일 기준)
  const totalDays = schedules.length
  const elapsedDays = schedules.filter((s) => s.date <= (anchorDate || s.date)).length

  return (
    <>
      <AppHeader title="SKALog" brand right={`${me.campus} ${me.className} · ${me.name}`} />

      <div className="mx-auto w-full max-w-5xl space-y-3 px-4 pb-24 pt-4 lg:px-8 lg:pb-10 lg:pt-8">
        {/*
          [1층] Strip — 인사 + 날짜/주차/진행바 한 덩어리. 카드가 아니고 배경도 없다.
          모바일(.pen M1 `Hero`)은 인사말이 단독 줄, 데스크톱(.pen D1 `Strip`)은 인사말+요약 한 줄에
          날짜/주차/진행 정보가 같이 붙는다 — 정보 표기 자체도 다르다(모바일 "N/23주차" ↔ 데스크톱 "N일차").
        */}
        <section className="flex flex-col gap-2">
          {loading ? (
            <SkeletonLine className="h-7 w-64" />
          ) : (
            <>
              <div className="flex flex-col gap-3 lg:hidden">
                <h1 className="text-title font-semibold text-ink">안녕하세요, {me.name}님</h1>
                <div className="flex items-center gap-2">
                  <p className="text-heading font-semibold text-ink">{weekdayFullLabel(anchorDate)}</p>
                  <WeekBadge weekNo={currentWeekNo} tone="primary" />
                  <span className="flex-1" />
                  <p className="shrink-0 text-meta leading-[1.4] text-ink-muted tabular-nums">
                    {currentWeekNo} / {TOTAL_WEEKS}주차
                  </p>
                  <Tooltip
                    label={`교육 ${elapsedDays}일째 · 총 ${totalDays}일 과정 (주말 제외)`}
                    className="shrink-0 text-ink-faint"
                  >
                    <Info size={14} />
                  </Tooltip>
                </div>
              </div>

              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex flex-col gap-1">
                  <h1 className="text-display font-semibold text-ink">안녕하세요, {me.name}님</h1>
                  <p className="text-label leading-[1.4] text-ink-muted">
                    오늘 일정 {todaySchedule ? 1 : 0}건과 새 자료 {newMaterialCount(materials)}건이 기다리고 있어요.
                  </p>
                </div>
                <span className="flex-1" />
                <p className="text-label font-medium text-ink">{weekdayFullLabel(anchorDate)}</p>
                <WeekBadge weekNo={currentWeekNo} tone="primary" />
                <p className="shrink-0 text-meta text-ink-muted tabular-nums">{elapsedDays}일차</p>
                <Tooltip
                  label={`총 ${totalDays}일 과정 · ${currentWeekNo} / ${TOTAL_WEEKS}주차 (주말 제외)`}
                  className="shrink-0 text-ink-faint"
                >
                  <Info size={14} />
                </Tooltip>
              </div>
            </>
          )}

          {/* 진행률은 주차가 아니라 실제 교육일 기준(주말 제외). 로딩 중엔 그라데이션을 숨긴다 (.pen S1) */}
          <Tooltip label={`${elapsedDays}일차 / ${totalDays}일차`} className="w-full">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-accent">
              {!loading && (
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${totalDays ? Math.round((elapsedDays / totalDays) * 100) : 0}%`,
                    backgroundImage: 'linear-gradient(90deg, var(--color-primary), var(--color-mint))',
                  }}
                />
              )}
            </div>
          </Tooltip>
        </section>

        {/*
          .pen D1 `Grid/2col` — 좌: 오늘 강의 · 공지 · 내 최근 기록 / 우 280: 바로가기 · 일정 · 주간 식단.
          모바일은 한 컬럼으로 쌓이되 .pen M1 순서(오늘 강의 → 바로가기 → 공지 → 식단 → 일정 → 최근 기록)를 따른다.
          min-w-0 이 없으면 내부 목록이 컬럼을 넓혀 가로 스크롤이 생긴다.
        */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {loading ? (
              <SkeletonCard lines={6} />
            ) : todaySchedule ? (
              <TodayCard scheduleId={todaySchedule.id} />
            ) : (
              <NoClassCard
                nextScheduleId={nextSchedule?.id ?? null}
                composerScheduleId={composerSchedule?.id ?? null}
              />
            )}

            {/* 모바일에선 바로가기가 오늘 강의 바로 밑에 온다 (.pen M1) */}
            <div className="lg:hidden">
              <LinkRail links={QUICK_LINKS} />
            </div>

            {loading || !noticesLoaded ? <SkeletonCard lines={4} /> : <NoticeList notices={notices} />}

            {/* 모바일: 공지 다음 식단 → 이번 주 일정 카드(.pen M1 `Card/이번주`, 스크롤형 아님) */}
            <div className="flex flex-col gap-3 lg:hidden">
              <MealSection meals={meals} />
              {cardError ? (
                <Card title="이번 주">
                  <ErrorState onRetry={() => setCardError(false)} />
                </Card>
              ) : (
                <ThisWeekCard
                  schedules={schedules}
                  materials={materials}
                  submissions={submissions}
                  weekNo={currentWeekNo}
                />
              )}
            </div>

            {loading ? (
              <SkeletonCard lines={4} />
            ) : (
              <RecentRecords recentIds={recentRecords.map((r) => r.id)} composerAvailable={!!composerSchedule} />
            )}
          </div>

          <aside className="hidden w-70 shrink-0 flex-col gap-3 lg:flex">
            <LinkRail links={QUICK_LINKS} showHeader />
            {/* S8 · 카드 단위 에러는 .pen 기준 일정 블록에서 일어난다 */}
            {cardError ? (
              <Card title="일정">
                <ErrorState onRetry={() => setCardError(false)} />
              </Card>
            ) : (
              <ScheduleScroll schedules={schedules} />
            )}
            <MealSection meals={meals} />
          </aside>
        </div>
      </div>
    </>
  )
}

/** 수업 방식 — 실습교수가 전임교수와 같은 사람이면(직강 반) 현강, 다르면(중계 시청) 원격. */
function classModeOf(schedule: Schedule): ClassMode {
  const fullTime = schedule.instructors.find((i) => i.role === 'FULL_TIME')?.name
  const practice = schedule.instructors.find((i) => i.role === 'PRACTICE')?.name
  return fullTime && fullTime !== practice ? 'REMOTE' : 'ONSITE'
}

function TodayCard({ scheduleId, bare = false }: { scheduleId: number; bare?: boolean }) {
  const { schedules, materials } = useStore()
  const schedule = scheduleById(schedules, scheduleId)!
  const scheduleMaterials = materialsFor(materials, scheduleId)

  return (
    <Card
      title="오늘 강의"
      action={<ClassModeBadge mode={classModeOf(schedule)} />}
      bare={bare}
    >
      <Link to={`/timeline/${schedule.id}`} className="group block">
        <p className="text-title font-semibold text-ink group-hover:text-primary">{schedule.subject}</p>
        <div className="mt-2.5"><InstructorList instructors={schedule.instructors} /></div>
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
            {[instructorNames(next.instructors), weekTag(next.weekNo)].filter(Boolean).join(' · ')}
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
                className="flex h-touch items-center rounded-control bg-primary px-5 text-label leading-[1.4] font-semibold text-on-primary hover:bg-primary-hover"
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
