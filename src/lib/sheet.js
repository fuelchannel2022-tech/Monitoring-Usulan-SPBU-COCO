// Reads the "Data" tab of a Google Sheet through Google's public CSV endpoint (gviz).
// Works without an API key, but only when the spreadsheet is shared as
// "Anyone with the link: Viewer". Nothing secret is stored in the code.

const STORAGE_KEY = 'coco.sheetId'
export const SHEET_TAB = 'Data'
export const SHEET_RANGE = 'A1:AC1000'

/** Extracts the spreadsheet ID from a full Google Sheets link or returns the ID as-is. */
export function extractSheetId(input) {
  const s = String(input || '').trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  return /^[a-zA-Z0-9-_]{20,}$/.test(s) ? s : ''
}

/** Sheet ID priority: the one saved in this browser, then the optional build-time variable. */
export function loadSheetId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
  } catch { /* storage blocked: fall through */ }
  return extractSheetId(import.meta.env.VITE_SHEET_ID || '')
}

export function saveSheetId(id) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

/** Minimal RFC 4180 CSV parser (handles quotes, commas and line breaks inside cells). */
export function parseCsv(text) {
  const rows = []
  let row = [], cell = '', i = 0, inQ = false
  while (i < text.length) {
    const ch = text[i]
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i += 2; continue }
        inQ = false; i++; continue
      }
      cell += ch; i++; continue
    }
    if (ch === '"') { inQ = true; i++; continue }
    if (ch === ',') { row.push(cell); cell = ''; i++; continue }
    if (ch === '\r') { i++; continue }
    if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; i++; continue }
    cell += ch; i++
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }
  return rows
}

export class SheetError extends Error {
  constructor(code, message) { super(message); this.code = code }
}

export async function fetchSheetValues(sheetId, signal) {
  const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq` +
    `?tqx=out:csv&headers=0&sheet=${encodeURIComponent(SHEET_TAB)}&range=${SHEET_RANGE}&_=${Date.now()}`
  let res
  try {
    res = await fetch(url, { signal, cache: 'no-store' })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    // A private sheet redirects to a Google sign-in page, which the browser blocks (CORS).
    throw new SheetError('unreachable', 'Spreadsheet tidak bisa dibaca. Pastikan dibagikan sebagai "Siapa saja yang memiliki link: Viewer" dan koneksi internet aktif.')
  }
  if (!res.ok) {
    throw new SheetError(res.status === 404 ? 'not_found' : 'http',
      res.status === 404 ? 'Spreadsheet tidak ditemukan. Periksa kembali link-nya.' : `Google Sheets menolak permintaan (HTTP ${res.status}).`)
  }
  const text = await res.text()
  if (/^\s*</.test(text)) {
    throw new SheetError('private', 'Spreadsheet masih privat. Ubah akses berbagi menjadi "Siapa saja yang memiliki link: Viewer".')
  }
  const values = parseCsv(text)
  if (!values.length) throw new SheetError('empty', `Sheet "${SHEET_TAB}" kosong atau tidak ditemukan.`)
  return values
}
