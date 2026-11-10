// Data source for the published dashboard.
// The spreadsheet is read through Google's public CSV endpoint, which only works while the
// file is shared as "Anyone with the link". No API key or credential is used.
// IMPORTANT: set the sharing role to "Viewer", not "Editor" — this ID is public in the repo.
export const DEFAULT_SHEET_ID = '1N8HpV-mD8ry2PhNhhSVtOaIagUjPRIVg_BDhmwNsqb4'
export const SHEET_GID = '0' // tab "Data"
export const SHEET_TAB = 'Data'

// ---- SLA (hari kerja) ----
// Status per usulan yang masih berjalan, dibandingkan dengan target SLA kumulatif item yang sedang dikerjakan:
//   On Schedule : sisa waktu > WARNING_DAYS hari kerja
//   Warning     : sisa waktu 1..WARNING_DAYS hari kerja
//   Due Date    : sisa waktu <= 0 (jatuh tempo hari ini atau sudah lewat)
export const WARNING_DAYS = 2

// Hari kerja = Senin–Jumat, di luar libur nasional dan cuti bersama (SKB 3 Menteri).
// Tambahkan tanggal tahun berikutnya di sini setelah SKB terbit (format YYYY-MM-DD).
export const HOLIDAYS = [
  // 2026 — libur nasional
  '2026-01-01', '2026-01-16', '2026-02-17', '2026-03-19', '2026-03-21', '2026-03-22', '2026-04-03', '2026-04-05',
  '2026-05-01', '2026-05-14', '2026-05-27', '2026-05-31', '2026-06-01', '2026-06-16', '2026-08-17', '2026-08-25',
  '2026-12-25',
  // 2026 — cuti bersama
  '2026-02-16', '2026-03-18', '2026-03-20', '2026-03-23', '2026-03-24', '2026-05-15', '2026-05-28', '2026-12-24',
]
