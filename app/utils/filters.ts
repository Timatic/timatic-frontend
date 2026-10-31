import numeral from 'numeral'
import type moment from 'moment'

export function timeFormat (value: number | null | undefined): string {
  if (value === 0) { return '0:00' }
  if (!value) { return '' }

  const minutes = Math.abs(value) % 60
  const hours = Math.floor(Math.abs(value) / 60)
  return (value < 0 ? '-' : '') + hours + ':' + (minutes >= 10 ? minutes : '0' + minutes)
}

export function initials (value: string): string {
  let result = ''
  value.split(' ').forEach((word) => {
    result += word.substring(0, 1)
  })
  return result
}

export function currency (value: number): string {
  return numeral(value).format('0,0.00')
}

// Overlapping activities must count once, so merge the intervals before summing.
export function activitiesDurationInMinutes (activities: { startedAt: moment.Moment, endedAt: moment.Moment }[]): number {
  let total = 0
  let coveredUntil: moment.Moment | null = null
  for (const { startedAt, endedAt } of [...activities].sort((a, b) => a.startedAt.valueOf() - b.startedAt.valueOf())) {
    const start = coveredUntil && coveredUntil.isAfter(startedAt) ? coveredUntil : startedAt
    if (endedAt.isAfter(start)) {
      total += endedAt.diff(start, 'minutes', true)
      coveredUntil = endedAt
    }
  }
  return Math.round(total)
}

export function durationLabel (minutes: number): string {
  return minutes >= 60 ? Math.round(minutes / 6) / 10 + 'h' : minutes + 'm'
}
