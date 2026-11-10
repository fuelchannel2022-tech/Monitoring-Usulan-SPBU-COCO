import { useRef } from 'react'
import { REGIONS, pct, fmtPct, listJoin, fmtTime } from '../lib/analyse.js'
import danantara from '../assets/danantara.png'
import pertamina from '../assets/pertamina.png'

const Arrow = () => (
  <span className="arrow" aria-hidden="true">
    <svg viewBox="0 0 10 10"><path d="M3.5 2l3 3-3 3" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
  </span>
)

const IconInbox = () => (
  <svg className="ic" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M8 34h14l4 8h12l4-8h14v16a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#a33244" />
    <path d="M8 34l6-14h36l6 14" fill="none" stroke="#5c0f1d" strokeWidth="3" strokeLinejoin="round" />
    <rect x="18" y="8" width="26" height="30" rx="2" fill="#fff" stroke="#5c0f1d" strokeWidth="3" />
    <path d="M23 16h16M23 22h16M23 28h10" stroke="#8b1a2b" strokeWidth="3" strokeLinecap="round" />
    <path d="M49 6l-3 5M54 11l-5 2" stroke="#8b1a2b" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)
const IconCheck = () => (
  <svg className="ic" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="8" y="6" width="34" height="46" rx="3" fill="#fff" stroke="#5c0f1d" strokeWidth="3" />
    <path d="M14 16l3 3 5-6M14 28l3 3 5-6M14 40l3 3 5-6" stroke="#8b1a2b" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M27 17h9M27 29h6" stroke="#5c0f1d" strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="42" cy="40" r="10" fill="#fff" stroke="#5c0f1d" strokeWidth="3" />
    <path d="M37 40l3.5 3.5 6-7" stroke="#8b1a2b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M49 47l8 8" stroke="#5c0f1d" strokeWidth="4" strokeLinecap="round" />
  </svg>
)
const IconReport = () => (
  <svg className="ic" viewBox="0 0 64 64" aria-hidden="true">
    <rect x="8" y="6" width="38" height="48" rx="3" fill="#fff" stroke="#5c0f1d" strokeWidth="3" />
    <path d="M15 14h22" stroke="#5c0f1d" strokeWidth="3" strokeLinecap="round" />
    <rect x="15" y="34" width="5" height="10" fill="#a33244" />
    <rect x="23" y="28" width="5" height="16" fill="#a33244" />
    <rect x="31" y="22" width="5" height="22" fill="#a33244" />
    <circle cx="46" cy="46" r="11" fill="#8b1a2b" />
    <path d="M40.5 46l4 4 7-8" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const IconPin = () => (
  <svg className="ic" viewBox="0 0 64 64" aria-hidden="true">
    <path d="M6 52l10-14h32l10 14z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
    <path d="M32 46s-11-11-11-20a11 11 0 0 1 22 0c0 9-11 20-11 20z" fill="#fff" />
    <circle cx="32" cy="26" r="4.5" fill="#7a1426" />
    <path d="M41 8v18" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    <path d="M41 8l13 4-13 5z" fill="#fff" />
  </svg>
)

export default function SlideView({ data, updatedAt }) {
  const ref = useRef(null)
  const { recs } = data
  const total = recs.length
  const t1 = recs.filter((r) => r.t1)
  const t3 = recs.filter((r) => r.t3)
  const fin = recs.filter((r) => r.fin)

  const regionsAll = [...new Set([...REGIONS, ...recs.map((r) => r.region)])]
  const byReg = regionsAll
    .map((n) => ({
      n,
      stop: recs.filter((r) => r.region === n && !r.t1).length,
      go: recs.filter((r) => r.region === n && r.t1).length,
    }))
    .sort((a, b) => b.stop + b.go - (a.stop + a.go) || b.go - a.go)
  const active = byReg.filter((x) => x.stop + x.go > 0)
  const empty = byReg.filter((x) => x.stop + x.go === 0)
  const max = Math.max(1, ...byReg.map((x) => x.stop + x.go))

  const headline = !total
    ? 'Belum ada usulan di sheet Data'
    : fin.length === 0
      ? `Dari ${total} usulan SPBU COCO, belum ada lokasi yang lanjut eksekusi`
      : fin.length === 1
        ? `Dari ${total} usulan SPBU COCO, baru 1 lokasi lanjut eksekusi`
        : `Dari ${total} usulan SPBU COCO, ${fin.length} lokasi lanjut eksekusi`

  const fellT23 = t1.filter((r) => !r.t3)
  const s2 = fellT23.length === 0
    ? (t1.length ? 'Semua yang lolos Tahap 1 lanjut' : 'Belum ada yang masuk tahap ini')
    : fellT23.length === 1
      ? `${fellT23[0].city} berhenti di ${fellT23[0].stop || 'Tahap 2/3'}`
      : `${fellT23.length} usulan berhenti di Tahap 2–3`
  const s3 = fin.length === 0
    ? 'Belum ada'
    : fin.length <= 2 ? fin.map((r) => r.city + (r.prov ? ', ' + r.prov : '')).join(' · ') : listJoin(fin.map((r) => r.city))

  const stopCount = {}
  recs.forEach((r) => { if (r.stop && !r.t1) stopCount[r.stop] = (stopCount[r.stop] || 0) + 1 })
  const top = Object.entries(stopCount).sort((a, b) => b[1] - a[1])[0]
  const passRegions = [...new Set(t1.map((r) => r.region))]

  const findings = []
  if (top) findings.push(`${fmtPct(pct(top[1], total))} usulan (${top[1]} dari ${total}) gugur di ${top[0]}`)
  if (passRegions.length === 1) findings.push(`${passRegions[0]} satu-satunya region yang lolos Kajian Awal`)
  else if (passRegions.length > 1) findings.push(`Region yang lolos Kajian Awal: ${listJoin(passRegions)}`)
  else if (total) findings.push('Belum ada region yang lolos Kajian Awal')
  if (empty.length) findings.push(`${listJoin(empty.map((x) => x.n))} belum mengajukan usulan sama sekali`)
  else findings.push(`Semua ${byReg.length} region sudah mengajukan usulan`)

  const actions = [
    top ? `Evaluasi kriteria screening & asumsi ${top[0].replace(/^\d+(\.\d+)?\s*/, '')}` : 'Evaluasi kriteria screening Kajian Awal',
    'Tambah kolom tanggal per item untuk ukur SLA',
    empty.length ? `Rapikan sheet Rekap & dorong pipeline ${listJoin(empty.map((x) => x.n))}` : 'Rapikan sheet Rekap agar sesuai sheet Data',
  ]

  const goFullscreen = () => {
    const el = ref.current
    try { const p = el?.requestFullscreen?.(); p?.catch?.(() => {}) } catch { /* not supported */ }
  }

  return (
    <div className="slide-wrap">
      <section className="slide" ref={ref} aria-label="Slide monitoring usulan SPBU COCO">
        <svg className="wave" viewBox="0 0 1000 70" preserveAspectRatio="none" aria-hidden="true">
          <path d="M520 70 C700 40 820 30 1000 6 L1000 70 Z" fill="#e3e3e7" />
          <path d="M640 70 C780 52 880 40 1000 26 L1000 70 Z" fill="#b9b9bf" opacity=".7" />
          <path d="M760 70 C860 60 930 52 1000 44 L1000 70 Z" fill="#8b1a2b" opacity=".85" />
        </svg>

        <header>
          <div className="logos">
            <img src={danantara} alt="Danantara Indonesia" className="lg-dan" />
            <img src={pertamina} alt="Pertamina" className="lg-per" />
          </div>
          <h1>{headline}</h1>
          <p className="sub">Status per tahapan proses pengusulan investasi (Tahap 1 Kajian Awal s.d. Tahap 4 Eksekusi)</p>
        </header>

        <div className="tiles">
          <div className="tile">
            <IconInbox /><span className="sep" />
            <div className="body"><div className="num">{total}</div><div className="lbl">Usulan masuk</div><div className="note">dari {active.length} region</div></div>
            <Arrow />
          </div>
          <div className="tile">
            <IconCheck /><span className="sep" />
            <div className="body"><div className="num">{t1.length}</div><div className="lbl">Lolos Kajian Awal</div>
              <div className="note">{fmtPct(pct(t1.length, total))}{t1.length && t1.length <= 3 ? ' · ' + listJoin(t1.map((r) => r.city)) : ''}</div></div>
            <Arrow />
          </div>
          <div className="tile">
            <IconReport /><span className="sep" />
            <div className="body"><div className="num">{t3.length}</div><div className="lbl">Lolos Kajian Lanjutan &amp; FID</div><div className="note">{s2}</div></div>
            <Arrow />
          </div>
          <div className="tile hot">
            <IconPin /><span className="sep" />
            <div className="body"><div className="num">{fin.length}</div><div className="lbl">Keputusan final Lanjut</div><div className="note">{s3}</div></div>
          </div>
        </div>

        <div className="lower">
          <div className="panel">
            <div className="tab">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V12M10 20V8M16 20V4" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" /></svg>
              Usulan per region
            </div>
            <div className="chart" role="img" aria-label={'Jumlah usulan per region: ' + byReg.map((x) => `${x.n} ${x.stop + x.go}`).join(', ')}>
              {byReg.map((x) => (
                <div className="row" key={x.n}>
                  <div className="rn">{x.n}</div>
                  <div className="track">
                    {x.stop > 0 && <div className="seg stop" style={{ width: (x.stop / max) * 100 + '%' }}>{x.stop}</div>}
                    {x.go > 0 && <div className="seg go" style={{ width: (x.go / max) * 100 + '%' }}>{x.go}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="legend-s">
              <span><i style={{ background: 'var(--grey)' }} />Berhenti di Tahap 1</span>
              <span><i style={{ background: 'var(--maroon)' }} />Lolos Tahap 1</span>
            </div>
          </div>
          <div className="right">
            <div className="box">
              <div className="hd">
                <span className="bub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinejoin="round" /></svg></span>
                Temuan utama
              </div>
              <ul>{findings.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="box dark">
              <div className="hd">
                <span className="bub"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="13" r="8" stroke="#fff" strokeWidth="1.8" fill="none" /><circle cx="11" cy="13" r="4" stroke="#fff" strokeWidth="1.8" fill="none" /><path d="M11 13l9-9M16 4h4v4" stroke="#e8b4bc" strokeWidth="2" fill="none" strokeLinecap="round" /></svg></span>
                Tindak lanjut
              </div>
              <ul>{actions.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
        </div>

        <footer>
          <span><b>Sumber:</b> Dashboard Monitoring Usulan SPBU COCO (Google Sheets), sheet Data</span>
          <span>{updatedAt ? 'Data per ' + fmtTime(updatedAt) : ''}</span>
        </footer>
      </section>
      <div className="slide-actions">
        <button type="button" className="btn" onClick={goFullscreen}>Presentasikan</button>
      </div>
    </div>
  )
}
