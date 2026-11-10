import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import StageDashboard from './components/StageDashboard.jsx'
import SlideView from './components/SlideView.jsx'
import SheetSetup from './components/SheetSetup.jsx'
import { analyse, fmtTime } from './lib/analyse.js'
import { fetchSheetValues, loadSheetId, saveSheetId } from './lib/sheet.js'
import danantara from './assets/danantara.png'
import pertamina from './assets/pertamina.png'

const REFRESH_MS = 2 * 60 * 1000
const VIEWS = [
  { id: 'tahap', label: 'Dashboard 4 Tahap' },
  { id: 'ringkasan', label: 'Ringkasan (Slide)' },
]
const viewFromHash = () => (VIEWS.some((v) => '#' + v.id === location.hash) ? location.hash.slice(1) : 'tahap')

function useSheet(sheetId) {
  const [values, setValues] = useState(null)
  const [status, setStatus] = useState({ kind: '', text: '' })
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(false)
  const ctrl = useRef(null)

  const load = useCallback(async () => {
    if (!sheetId) return
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    setLoading(true)
    setStatus((s) => ({ kind: s.kind, text: 'Mengambil data terbaru…' }))
    try {
      const v = await fetchSheetValues(sheetId, c.signal)
      setValues(v)
      const t = Date.now()
      setUpdatedAt(t)
      setStatus({ kind: 'ok', text: 'Tersambung ke Google Sheets · diperbarui ' + fmtTime(t) })
    } catch (e) {
      if (e.name === 'AbortError') return
      setStatus({ kind: 'err', text: e.message + (values ? ' Menampilkan data terakhir.' : '') })
    } finally {
      if (ctrl.current === c) setLoading(false)
    }
  }, [sheetId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setValues(null); setUpdatedAt(null)
    if (!sheetId) return
    load()
    const id = setInterval(() => { if (document.visibilityState === 'visible') load() }, REFRESH_MS)
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); ctrl.current?.abort() }
  }, [sheetId, load])

  return { values, status, updatedAt, loading, reload: load }
}

export default function App() {
  const [sheetId, setSheetId] = useState(loadSheetId)
  const [editing, setEditing] = useState(false)
  const [view, setView] = useState(viewFromHash)
  const { values, status, updatedAt, loading, reload } = useSheet(sheetId)
  const data = useMemo(() => (values ? analyse(values) : null), [values])

  useEffect(() => {
    const on = () => setView(viewFromHash())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])

  const saveId = (id) => { saveSheetId(id); setSheetId(id); setEditing(false) }
  const go = (id) => { if (location.hash !== '#' + id) location.hash = id; setView(id) }

  return (
    <div className="app">
      <div className="top">
        <img src={danantara} alt="Danantara Indonesia" />
        <div className="mid">
          <h1>{view === 'ringkasan' ? 'Monitoring Usulan SPBU COCO' : 'Dashboard Proses Usulan SPBU COCO'}</h1>
          <p className="sub">Progres setiap usulan dari Tahap 1 Kajian Awal sampai Tahap 4 Eksekusi</p>
        </div>
        <img src={pertamina} alt="Pertamina" />
      </div>

      <div className="toolbar">
        <nav className="tabs" aria-label="Tampilan">
          {VIEWS.map((v) => (
            <button key={v.id} type="button" className="tabbtn" aria-current={view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>{v.label}</button>
          ))}
        </nav>
        {sheetId && (
          <div className="status">
            <span className={'dot ' + status.kind} />
            <span>{status.text || 'Menghubungkan ke Google Sheets…'}</span>
            <button type="button" className="btn" onClick={reload} disabled={loading}>Muat ulang data</button>
            <button type="button" className="btn" onClick={() => setEditing(true)}>Ganti spreadsheet</button>
          </div>
        )}
      </div>

      {(!sheetId || editing) && (
        <SheetSetup current={sheetId} onSave={saveId} onCancel={sheetId ? () => setEditing(false) : null} />
      )}

      {sheetId && !editing && !data && (
        <div className="placeholder">{status.kind === 'err' ? status.text : 'Memuat data dari spreadsheet…'}</div>
      )}

      {sheetId && !editing && data && (
        view === 'ringkasan'
          ? <SlideView data={data} updatedAt={updatedAt} />
          : <StageDashboard data={data} />
      )}

      <footer className="foot">
        Sumber: Dashboard Monitoring Usulan SPBU COCO (Google Sheets), sheet Data
        {updatedAt ? ' · Data per ' + fmtTime(updatedAt) : ''}
      </footer>
    </div>
  )
}
