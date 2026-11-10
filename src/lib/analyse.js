// Turns the raw rows of the "Data" sheet into one record per proposal.
// Sheet layout: row 1 = stage headers, row 2 = item labels, data from row 3.
// Columns: A Region, B Kecamatan, C Kota/Kab, D Provinsi, then items + decision per stage.

export const STAGES = [
  { n: 'Kajian Awal', cols: [6, 7, 8, 9], dec: 10 },
  { n: 'Kajian Lanjutan', cols: [11, 12, 13, 14, 15], dec: 16 },
  { n: 'Pengusulan Investasi', cols: [17, 18, 19, 20, 21], dec: 22 },
  { n: 'Tahap Eksekusi', cols: [23, 24, 25, 26, 27], dec: 28 },
]

export const REGIONS = ['Sumbagut', 'Sumbagsel', 'JBB', 'JBT', 'Jatim Balinus', 'Kalimantan', 'Sulawesi', 'Papua Maluku']

const norm = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ')
const canonRegion = (r) => {
  const k = norm(r).toLowerCase()
  return REGIONS.find((x) => x.toLowerCase() === k) || norm(r)
}
const city = (s) => norm(s).replace(/^(kota|kab\.?|kabupaten)\s+/i, '')
const cellState = (v) => {
  const s = norm(v).toLowerCase()
  if (/^(yes|ya|y|ok|selesai)$/.test(s)) return 'y'
  if (/^(no|tidak|n)$/.test(s)) return 'n'
  return 'b'
}
const decision = (v) => {
  const s = norm(v).toLowerCase()
  if (s === 'lanjut') return 'l'
  if (s.startsWith('tidak')) return 't'
  return 'p'
}

export function analyse(values) {
  const hdr = values[1] || []
  const labels = STAGES.map((s) => s.cols.map((c) => norm(hdr[c]) || `Kolom ${c + 1}`))
  const recs = values.slice(2).filter((r) => norm(r[0])).map((r, idx) => {
    const cells = STAGES.map((s) => s.cols.map((c) => cellState(r[c])))
    const dec = STAGES.map((s) => decision(r[s.dec]))
    // A stage is entered once every earlier stage decision is "Lanjut".
    const entered = STAGES.map((_, k) => dec.slice(0, k).every((d) => d === 'l'))
    let stop = null
    for (let k = 0; k < 4 && !stop; k++) {
      if (!entered[k]) break
      const i = cells[k].indexOf('n')
      if (i >= 0 && dec[k] !== 'l') stop = labels[k][i]
    }
    return {
      id: idx,
      region: canonRegion(r[0]),
      kec: norm(r[1]),
      city: city(r[2]),
      prov: norm(r[3]),
      cells, dec, entered, stop,
      t1: dec[0] === 'l',
      t3: dec[0] === 'l' && dec[1] === 'l' && dec[2] === 'l',
      fin: dec.every((d) => d === 'l'),
    }
  })
  return { recs, labels }
}

export const pct = (a, b) => (b ? (a / b) * 100 : 0)
export const fmtPct = (v) =>
  (Math.abs(v - Math.round(v)) < 0.05 || v >= 20 ? String(Math.round(v)) : v.toFixed(1).replace('.', ',')) + '%'
export const listJoin = (a) => (a.length <= 1 ? a[0] || '' : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1])
export const fmtTime = (t) =>
  new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
