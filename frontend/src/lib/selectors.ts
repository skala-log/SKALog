import { TODAY_ISO } from './mock'
import type { Material, Schedule, Submission } from './types'

export function getTodaySchedule(schedules: Schedule[]): Schedule | null {
  return schedules.find((s) => s.date === TODAY_ISO) ?? null
}

export function getNextSchedule(schedules: Schedule[]): Schedule | null {
  const upcoming = schedules.filter((s) => s.date > TODAY_ISO).sort((a, b) => a.date.localeCompare(b.date))
  return upcoming[0] ?? null
}

export function getPreviousSchedule(schedules: Schedule[]): Schedule | null {
  const past = schedules.filter((s) => s.date < TODAY_ISO).sort((a, b) => b.date.localeCompare(a.date))
  return past[0] ?? null
}

export function getCurrentWeekNo(schedules: Schedule[]): number {
  const today = getTodaySchedule(schedules)
  if (today) return today.weekNo
  const prev = getPreviousSchedule(schedules)
  const next = getNextSchedule(schedules)
  return (prev ?? next)?.weekNo ?? 1
}

export function materialsFor(materials: Material[], scheduleId: number): Material[] {
  return materials.filter((m) => m.scheduleId === scheduleId)
}

export function submissionsFor(submissions: Submission[], scheduleId: number): Submission[] {
  return submissions
    .filter((s) => s.scheduleId === scheduleId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function scheduleById(schedules: Schedule[], id: number): Schedule | null {
  return schedules.find((s) => s.id === id) ?? null
}

export function schedulesInWeek(schedules: Schedule[], weekNo: number): Schedule[] {
  return schedules.filter((s) => s.weekNo === weekNo).sort((a, b) => a.date.localeCompare(b.date))
}

export function weekNumbers(schedules: Schedule[]): number[] {
  return [...new Set(schedules.map((s) => s.weekNo))].sort((a, b) => a - b)
}

/** 최근 자료: 오늘 기준 3일 이내 등록된 승인 자료 수 (D1 인사말에 사용) */
export function newMaterialCount(materials: Material[]): number {
  const since = addDays(TODAY_ISO, -2)
  return materials.filter((m) => m.postedAt.slice(0, 10) >= since).length
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}
