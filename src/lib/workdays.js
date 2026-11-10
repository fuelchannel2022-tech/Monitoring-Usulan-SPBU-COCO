import { HOLIDAYS } from '../config.js'

const HOL = new Set(HOLIDAYS)
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5, jul: 6, aug: 7, agu: 7, agt: 7, ags: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11 }

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const isWorkday = (d) => d.getDay() !== 0 && d.getDay() !== 6 && !HOL.has(ymd(d))

/** Parses "10-Nov-2026", "10 November 2026", "2026-11-10", "10/11/2026" (day first) or a Sheets serial number. */
export function parseDate(v) {
  const s = String(v == null ? '' : v).trim()
  if (!s) return null
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = s.match(/^(\d{1,2})[-\s/.]([A-Za-z]{3,})[-\s/.,]*(\d{2,4})$/)
  if (m) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()]
    if (mo !== undefined) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, mo, +m[1]) }
  }
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/)
  if (m) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return new Date(y, +m[2] - 1, +m[1]) }
  if (/^\d{5}(\.\d+)?$/.test(s)) { const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(+s) * 864e5); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) }
  return null
}

/** Working days after `from` up to and including `to` (the input day itself is day 0). */
export function workdaysBetween(from, to) {
  const a = startOfDay(from), b = startOfDay(to)
  if (b <= a) return 0
  let n = 0
  for (const d = new Date(a); d < b;) { d.setDate(d.getDate() + 1); if (isWorkday(d)) n++ }
  return n
}

/** The date that is `n` working days after `from`. */
export function addWorkdays(from, n) {
  const d = startOfDay(from)
  let k = 0
  while (k < n) { d.setDate(d.getDate() + 1); if (isWorkday(d)) k++ }
  return d
}

export const fmtDate = (d) => (d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '–')
