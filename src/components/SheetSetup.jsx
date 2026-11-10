import { useState } from 'react'
import { extractSheetId } from '../lib/sheet.js'

export default function SheetSetup({ current, isDefault, onSave, onReset, onCancel }) {
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
      <h2>Ganti spreadsheet</h2>
      <p>
        Dashboard memakai spreadsheet <b>Dashboard Monitoring Usulan SPBU COCO</b> secara default.
        Tempel link lain hanya bila ingin melihat salinan spreadsheet; pilihan ini disimpan di browser ini saja.
      </p>
      <form onSubmit={submit}>
        <label htmlFor="sheetLink">Link Google Sheets</label>
        <input id="sheetLink" type="url" inputMode="url" autoComplete="off" placeholder="https://docs.google.com/spreadsheets/d/…/edit"
          value={value} onChange={(e) => setValue(e.target.value)} />
        {error && <p className="err">{error}</p>}
        <div className="row">
          <button type="submit" className="btn primary">Simpan &amp; tampilkan</button>
          {!isDefault && <button type="button" className="btn" onClick={onReset}>Pakai spreadsheet utama</button>}
          <button type="button" className="btn" onClick={onCancel}>Batal</button>
        </div>
      </form>
      <ol className="hint">
        <li>Spreadsheet harus dibagikan sebagai <b>“Siapa saja yang memiliki link: Viewer”</b> agar bisa dibaca dari GitHub Pages.</li>
        <li>Tab <b>Data</b> harus punya kolom <b>Region</b> dan judul item <b>1.1 – 4.5</b>; kolom keputusan berada tepat setelah item terakhir tiap tahap.</li>
      </ol>
    </section>
  )
}
