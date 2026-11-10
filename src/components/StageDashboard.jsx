import { useMemo, useState } from 'react'
import { STAGES, REGIONS } from '../lib/analyse.js'
import SlaPanel, { SlaPill } from './SlaPanel.jsx'

const pct0 = (a, b) => (b ? Math.round((a / b) * 100) : 0)

function Funnel({ R }) {
  return (
    <div className="funnel">
      {STAGES.map((s, k) => {
        const In = R.filter((r) => r.entered[k])
        const L = In.filter((r) => r.dec[k] === 'l').length
        const T = In.filter((r) => r.dec[k] === 't').length
        const P = In.length - L - T
        const w = (x) => (In.length ? (x / In.length) * 100 : 0)
        return (
          <div key={s.n} className={'fs' + (k === 3 ? ' final' : '')}>
            <div className="eyebrow">Tahap {k + 1}</div>
            <h2>{s.n}</h2>
            <div className="big">
              <b>{In.length}</b>
              <span>usulan masuk{k > 0 && R.length ? ` · ${pct0(In.length, R.length)}% dari total` : ''}</span>
            </div>
            <div className="split" role="img" aria-label={`${L} lanjut, ${T} tidak lanjut, ${P} proses`}>
              <i className="l" style={{ width: w(L) + '%' }} />
              <i className="p" style={{ width: w(P) + '%' }} />
              <i className="t" style={{ width: w(T) + '%' }} />
            </div>
            <div className="kv">
              <div className="l"><b>{L}</b>Lanjut</div>
              <div><b>{T}</b>Tidak lanjut</div>
              <div><b>{P}</b>Proses</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StageCard({ k, R, labels, sla, filter }) {
  const s = STAGES[k]
  const In = R.filter((r) => r.entered[k])
  const w = (x) => (In.length ? (x / In.length) * 100 : 0)
  return (
    <section className="st">
      <div className="hd">
        <span className="no">{k + 1}</span>
        <h3>{s.n}</h3>
        <span className="meta">{In.length} usulan</span>
      </div>
      <div className="bd">
        <div>
          <h4>Item pekerjaan</h4>
          <div className="items">
            {In.length === 0 && <div className="empty">Tidak ada data item.</div>}
            {In.length > 0 && labels[k].map((lb, i) => {
              const y = In.filter((r) => r.cells[k][i] === 'y').length
              const n = In.filter((r) => r.cells[k][i] === 'n').length
              return (
                <div className="it" key={lb + i}>
                  <div className="lbl">
                    <span>{lb}{sla?.[k]?.[i] ? <em className="slatag">SLA {sla[k][i]}</em> : null}</span>
                    <span>{y} Yes · {n} No</span>
                  </div>
                  <div className="split"><i className="y" style={{ width: w(y) + '%' }} /><i className="n" style={{ width: w(n) + '%' }} /></div>
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <h4>Lokasi</h4>
          {In.length === 0 ? (
            <div className="empty">
              Belum ada usulan yang masuk tahap ini{filter !== 'Semua' ? ` untuk region ${filter}` : ''}.
            </div>
          ) : (
            <ul className="locs">
              {In.map((r) => {
                const d = r.dec[k]
                const why = d === 't' && r.stop && r.stop.startsWith(String(k + 1)) ? ` · berhenti di ${r.stop}` : ''
                return (
                  <li key={r.id}>
                    <span className="nm"><b>{r.city || r.kec}</b><small>{r.region} · {r.prov}{why}</small></span>
                    <span className="pills">
                      {d === 'p' && r.sla.stage === k && <SlaPill s={r.sla} />}
                      {d === 'l' ? <span className="pill l">Lanjut</span>
                        : d === 't' ? <span className="pill t">Tidak lanjut</span>
                        : <span className="pill p">Proses</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

export default function StageDashboard({ data }) {
  const [filter, setFilter] = useState('Semua')
  const { recs, labels, sla, totalSla, hasDate } = data

  const options = useMemo(() => {
    const present = new Set(recs.map((r) => r.region))
    return ['Semua', ...REGIONS.filter((r) => present.has(r)), ...[...present].filter((r) => !REGIONS.includes(r))]
  }, [recs])
  const active = options.includes(filter) ? filter : 'Semua'
  const R = active === 'Semua' ? recs : recs.filter((r) => r.region === active)

  return (
    <div className="dash">
      <div className="dash-bar">
        <label className="sel" htmlFor="regionSel">
          <span>Region</span>
          <select id="regionSel" value={active} onChange={(e) => setFilter(e.target.value)}>
            {options.map((r) => {
              const n = r === 'Semua' ? recs.length : recs.filter((x) => x.region === r).length
              return <option key={r} value={r}>{r === 'Semua' ? 'Semua region' : r} ({n})</option>
            })}
          </select>
        </label>
      </div>
      <Funnel R={R} />
      <div className="legend">
        <span><i style={{ background: 'var(--maroon)' }} />Lanjut / Yes</span>
        <span><i style={{ background: 'var(--grey)' }} />Tidak lanjut / No</span>
        <span><i style={{ background: 'var(--maroon-mid)' }} />Masih proses (belum ada keputusan)</span>
        <span><i style={{ background: 'var(--grey-soft)' }} />Belum diisi</span>
      </div>
      <SlaPanel R={R} totalSla={totalSla} hasDate={hasDate} />
      <div className="stages">
        {STAGES.map((_, k) => <StageCard key={k} k={k} R={R} labels={labels} sla={sla} filter={active} />)}
      </div>
    </div>
  )
}
