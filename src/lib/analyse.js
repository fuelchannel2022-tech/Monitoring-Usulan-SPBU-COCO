// Turns the raw rows of the "Data" sheet into one record per proposal.
// Columns are located by their header text, not by position, so inserting or moving
// columns in the sheet does not break the dashboard:
//   - the header row holds "Region", "Kecamatan", "Kota/Kab", "Provinsi"
//   - the item row holds "1.1 …" to "4.5 …"; each stage's decision is the column right after its last item
//   - an optional row whose Region cell is "SLA" holds the SLA target per item
//   - every other row with a Region value is a proposal

import { WARNING_DAYS } from '../config.js'
import { parseDate, workdaysBetween, addWorkdays, startOfDay } from './workdays.js'

export const STAGES = [
  { n: 'Kajian Awal' },
  { n: 'Kajian Lanjutan' },
  { n: 'Pengusulan Investasi' },
  { n: 'Tahap Eksekusi' },
]

export const REGIONS = ['Sumbagut', 'Sumbagsel', 'JBB', 'JBT', 'Jatim Balinus', 'Kalimantan', 'Sulawesi', 'Papua Maluku']

export class LayoutError extends Error {}

const norm = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ')
const low = (s) => norm(s).toLowerCase()
const canonRegion = (r) => {
  const k = low(r)
  return REGIONS.find((x) => x.toLowerCase() === k) || norm(r)
}
const city = (s) => norm(s).replace(/^(kota|kab\.?|kabupaten)\s+/i, '')
const cellState = (v) => {
  const s = low(v)
  if (/^(yes|ya|y|ok|selesai)$/.test(s)) return 'y'
  if (/^(no|tidak|n)$/.test(s)) return 'n'
  return 'b'
}
const decision = (v) => {
  const s = low(v)
  if (s === 'lanjut') return 'l'
  if (s.startsWith('tidak')) return 't'
  return 'p'
}
const ITEM_RE = /^([1-4])\.(\d+)\b/

export function detectLayout(values) {
  const hr = values.findIndex((r) => r.some((c) => low(c) === 'region'))
  if (hr < 0) throw new LayoutError('Kolom "Region" tidak ditemukan di sheet Data.')
  const head = values[hr]
  const find = (re, fallback) => { const i = head.findIndex((c) => re.test(low(c))); return i >= 0 ? i : fallback }
  const regCol = head.findIndex((c) => low(c) === 'region')
  const kecCol = find(/^kecamatan/, regCol + 1)
  const cityCol = find(/^kota/, regCol + 2)
  const provCol = find(/^provinsi/, regCol + 3)
  const dateCol = find(/^tanggal/, -1)

  const ir = values.findIndex((r, i) => i >= hr && r.filter((c) => ITEM_RE.test(norm(c))).length >= 8)
  if (ir < 0) throw new LayoutError('Baris judul item (1.1 – 4.5) tidak ditemukan di sheet Data.')
  const itemRow = values[ir]
  const stages = [1, 2, 3, 4].map((k) => {
    const cols = itemRow.map((c, i) => ({ i, m: norm(c).match(ITEM_RE) }))
      .filter((x) => x.m && Number(x.m[1]) === k)
      .sort((a, b) => a.i - b.i)
      .map((x) => x.i)
    if (!cols.length) throw new LayoutError(`Item Tahap ${k} tidak ditemukan di sheet Data.`)
    return { cols, dec: cols[cols.length - 1] + 1 }
  })
  const labels = stages.map((s) => s.cols.map((c) => norm(itemRow[c])))
  const firstData = Math.max(hr, ir) + 1
  return { hr, ir, firstData, regCol, kecCol, cityCol, provCol, dateCol, stages, labels }
}

export function analyse(values) {
  const L = detectLayout(values)
  const rows = values.slice(L.firstData)
  const slaRow = rows.find((r) => low(r[L.regCol]) === 'sla')
  // SLA row: either cumulative working days per item (3, 8, 12, …) or per-item durations ("3 HK", "5 HK", …).
  const rawSla = L.stages.map((s) => s.cols.map((c) => {
    const m = slaRow ? norm(slaRow[c]).match(/-?\d+(?:[.,]\d+)?/) : null
    return m ? Number(m[0].replace(',', '.')) : null
  }))
  const flat = rawSla.flat()
  const hasSla = flat.length > 0 && flat.every((v) => v != null)
  const isCumulative = hasSla && flat.every((v, i) => i === 0 || v >= flat[i - 1])
  let run = 0
  const cum = rawSla.map((st) => st.map((v) => { if (v == null) return null; run = isCumulative ? v : run + v; return run }))
  let prev = 0
  const dur = cum.map((st) => st.map((c) => { if (c == null) return null; const d = c - prev; prev = c; return d }))
  const totalSla = hasSla ? cum[3][cum[3].length - 1] : null
  const sla = dur.map((st) => st.map((d) => (d == null ? '' : `${d} HK`)))
  const today = startOfDay(new Date())

  const recs = rows
    .filter((r) => norm(r[L.regCol]) && low(r[L.regCol]) !== 'sla')
    .map((r, idx) => {
      const cells = L.stages.map((s) => s.cols.map((c) => cellState(r[c])))
      const dec = L.stages.map((s) => decision(r[s.dec]))
      // A stage is entered once every earlier stage decision is "Lanjut".
      const entered = L.stages.map((_, k) => dec.slice(0, k).every((d) => d === 'l'))
      let stop = null
      for (let k = 0; k < 4 && !stop; k++) {
        if (!entered[k]) break
        const i = cells[k].indexOf('n')
        if (i >= 0 && dec[k] !== 'l') stop = L.labels[k][i]
      }
      // SLA status for proposals that are still running
      const inputDate = L.dateCol >= 0 ? parseDate(r[L.dateCol]) : null
      const closed = dec.some((d, k) => entered[k] && d === 't') || dec.every((d) => d === 'l')
      let slaInfo = { status: closed ? 'done' : 'na' }
      if (!closed && hasSla && inputDate) {
        const k = entered.reduce((acc, e, i) => (e && dec[i] === 'p' ? (acc < 0 ? i : acc) : acc), -1)
        if (k >= 0) {
          let i = cells[k].findIndex((c) => c !== 'y')
          if (i < 0) i = cells[k].length - 1
          const target = cum[k][i]
          const elapsed = workdaysBetween(inputDate, today)
          const remaining = target - elapsed
          slaInfo = {
            status: remaining <= 0 ? 'due' : remaining <= WARNING_DAYS ? 'warn' : 'on',
            stage: k, item: L.labels[k][i], target, elapsed, remaining,
            itemDue: addWorkdays(inputDate, target),
            finalDue: addWorkdays(inputDate, totalSla),
          }
        }
      } else if (!closed && !inputDate) {
        slaInfo = { status: 'na', reason: 'Tanggal Input kosong' }
      }
      return {
        id: idx,
        inputDate,
        sla: slaInfo,
        region: canonRegion(r[L.regCol]),
        kec: norm(r[L.kecCol]),
        city: city(r[L.cityCol]),
        prov: norm(r[L.provCol]),
        cells, dec, entered, stop,
        t1: dec[0] === 'l',
        t3: dec[0] === 'l' && dec[1] === 'l' && dec[2] === 'l',
        fin: dec.every((d) => d === 'l'),
      }
    })
  return { recs, labels: L.labels, sla, totalSla, hasDate: L.dateCol >= 0 }
}

export const pct = (a, b) => (b ? (a / b) * 100 : 0)
export const fmtPct = (v) =>
  (Math.abs(v - Math.round(v)) < 0.05 || v >= 20 ? String(Math.round(v)) : v.toFixed(1).replace('.', ',')) + '%'
export const listJoin = (a) => (a.length <= 1 ? a[0] || '' : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1])
export const fmtTime = (t) =>
  new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
