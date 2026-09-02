import numeral from 'numeral'

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
