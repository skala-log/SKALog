import { TODAY_ISO } from './mock'
import type { Instructor } from './types'

export const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'] as const

/** "7/30" — 날짜만(`2026-07-30`)이든 시각까지 붙은 ISO 든 받는다 */
export function formatMD(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-')
  return `${Number(m)}/${Number(d)}`
}

function diffDaysFromToday(dateOnlyISO: string): number {
  const today = new Date(`${TODAY_ISO}T00:00:00`)
  const target = new Date(`${dateOnlyISO}T00:00:00`)
  return Math.round((today.getTime() - target.getTime()) / 86400000)
}

/** "오늘" / "어제" / "N일 전" / "M/D" (future or far past) */
export function dayLabel(iso: string): string {
  const dateOnly = iso.slice(0, 10)
  const diff = diffDaysFromToday(dateOnly)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff > 1 && diff <= 7) return `${diff}일 전`
  return formatMD(dateOnly)
}

export function timeLabel(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function dateTimeLabel(iso: string): string {
  return `${dayLabel(iso)} ${timeLabel(iso)}`
}

export function isToday(dateOnlyISO: string): boolean {
  return dateOnlyISO === TODAY_ISO
}

export function weekdayOf(dateISO: string): string {
  return WEEKDAY_NAMES[new Date(`${dateISO}T00:00:00`).getDay()]
}

/** "8월 3일 월요일" */
export function weekdayFullLabel(dateISO: string): string {
  if (!dateISO) return ''
  const [, m, day] = dateISO.split('-')
  return `${Number(m)}월 ${Number(day)}일 ${weekdayOf(dateISO)}요일`
}

/** "W04" */
export function weekTag(weekNo: number): string {
  return `W${String(weekNo).padStart(2, '0')}`
}

export function weekRangeLabel(dates: string[]): string {
  const sorted = [...dates].sort()
  return `${formatMD(sorted[0])} – ${formatMD(sorted[sorted.length - 1])}`
}

export function monthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`
}

/** 6×7 month grid (Sun-first), each cell an ISO date string. */
export function monthGrid(year: number, month: number): string[][] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const start = new Date(first)
  start.setUTCDate(1 - first.getUTCDay())
  const weeks: string[][] = []
  for (let w = 0; w < 6; w++) {
    const row: string[] = []
    for (let d = 0; d < 7; d++) {
      const cell = new Date(start)
      cell.setUTCDate(start.getUTCDate() + w * 7 + d)
      row.push(cell.toISOString().slice(0, 10))
    }
    weeks.push(row)
  }
  return weeks
}

export function monthOf(dateISO: string): number {
  return Number(dateISO.slice(5, 7))
}

/** "박창렴 · 이서준" — 역할 구분 없이 이름만 나열할 때 (자료 캡션 등) */
export function instructorNames(instructors: Instructor[]): string {
  return instructors.map((i) => i.name).join(' · ')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}
