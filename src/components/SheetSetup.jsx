import { useState } from 'react'
import { extractSheetId } from '../lib/sheet.js'

export default function SheetSetup({ current, onSave, onCancel }) {
  const [value, setValue] = useState(current ? `https://docs.google.com/spreadsheets/d/${current}/edit` : '')
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const id = extractSheetId(value)
    if (!id) { setError('Link tidak dikenali. Tempel link lengkap Google Sheets, contoh: https://docs.google.com/spreadsheets/d/…/edit'); return }
    setError('')
    onSave(id)
  }

  return (
    <section className="setup">
      <h2>Sambungkan spreadsheet</h2>
      <p>
        Tempel link Google Sheets <b>Dashboard Monitoring Usulan SPBU COCO</b>. Link disimpan hanya di browser ini,
        tidak ditulis ke kode atau repository.
      </p>
      <form onSubmit={submit}>
        <label htmlFor="sheetLink">Link Google Sheets</label>
        <input id="sheetLink" type="url" inputMode="url" autoComplete="off" placeholder="https://docs.google.com/spreadsheets/d/…/edit"
          value={value} onChange={(e) => setValue(e.target.value)} />
        {error && <p className="err">{error}</p>}
        <div className="row">
          <button type="submit" className="btn primary">Simpan &amp; tampilkan</button>
          {onCancel && <button type="button" className="btn" onClick={onCancel}>Batal</button>}
        </div>
      </form>
      <ol className="hint">
        <li>Spreadsheet harus dibagikan sebagai <b>“Siapa saja yang memiliki link: Viewer”</b> agar bisa dibaca dari GitHub Pages.</li>
        <li>Data dibaca dari tab bernama <b>Data</b> (baris 1–2 judul, data mulai baris 3).</li>
      </ol>
    </section>
  )
}
