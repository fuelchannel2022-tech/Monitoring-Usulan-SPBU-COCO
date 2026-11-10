// Reads the "Data" tab of the Google Sheet through Google's public CSV endpoint (gviz).
// Works without an API key while the spreadsheet is shared as "Anyone with the link".
import { DEFAULT_SHEET_ID, SHEET_GID, SHEET_TAB } from '../config.js'

const STORAGE_KEY = 'coco.sheetId'

/** Extracts the spreadsheet ID from a full Google Sheets link or returns the ID as-is. */
export function extractSheetId(input) {
  const s = String(input || '').trim()
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (m) return m[1]
  return /^[a-zA-Z0-9-_]{20,}$/.test(s) ? s : ''
}

export const defaultSheetId = () => extractSheetId(import.meta.env.VITE_SHEET_ID || '') || DEFAULT_SHEET_ID

/** A sheet chosen in this browser overrides the default; otherwise the project's sheet is used. */
export function loadSheetId() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved
  } catch { /* storage blocked: fall through */ }
  return defaultSheetId()
}

export function saveSheetId(id) {
  try {
    if (id && id !== defaultSheetId()) localStorage.setItem(STORAGE_KEY, id)
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

export function sheetCsvUrl(sheetId, useGid = true) {
  const sel = useGid && sheetId === defaultSheetId() ? `gid=${SHEET_GID}` : `sheet=${encodeURIComponent(SHEET_TAB)}`
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&headers=0&${sel}&_=${Date.now()}`
}

export async function fetchSheetValues(sheetId, signal) {
  let res
  try {
    res = await fetch(sheetCsvUrl(sheetId), { signal, cache: 'no-store' })
  } catch (e) {
    if (e.name === 'AbortError') throw e
    // A private sheet redirects to Google sign-in, which the browser blocks (CORS) and reports as a network error.
    throw new SheetError('unreachable',
      'Spreadsheet tidak bisa dibaca. Pastikan file dibagikan sebagai "Siapa saja yang memiliki link" dan koneksi internet aktif.')
  }
  if (!res.ok) {
    throw new SheetError(res.status === 404 ? 'not_found' : 'http',
      res.status === 404 ? 'Spreadsheet tidak ditemukan. Periksa ID spreadsheet.' : `Google Sheets menolak permintaan (HTTP ${res.status}).`)
  }
  const text = await res.text()
  if (/^\s*</.test(text)) {
    throw new SheetError('private', 'Spreadsheet masih privat. Ubah akses berbagi menjadi "Siapa saja yang memiliki link: Viewer".')
  }
  const values = parseCsv(text)
  if (!values.length) throw new SheetError('empty', `Sheet "${SHEET_TAB}" kosong atau tidak ditemukan.`)
  return values
}
