import { WARNING_DAYS } from '../config.js'
import { fmtDate } from '../lib/workdays.js'

export const SLA_META = {
  on: { label: 'On Schedule', cls: 'on' },
  warn: { label: 'Warning', cls: 'warn' },
  due: { label: 'Due Date', cls: 'due' },
  done: { label: 'Selesai', cls: 'done' },
  na: { label: 'Tanpa tanggal', cls: 'na' },
}

export function SlaPill({ s }) {
  if (!s || s.status === 'done' || s.status === 'na') return null
  const m = SLA_META[s.status]
  return <span className={'slapill ' + m.cls} title={`${s.item} · target HK ${s.target}, berjalan ${s.elapsed} HK`}>{m.label}</span>
}

const sisaText = (r) => (r > 0 ? `${r} HK lagi` : r === 0 ? 'Jatuh tempo hari ini' : `Lewat ${-r} HK`)

export default function SlaPanel({ R, totalSla, hasDate }) {
  const count = (st) => R.filter((r) => r.sla.status === st).length
  const active = R.filter((r) => ['on', 'warn', 'due'].includes(r.sla.status))
    .sort((a, b) => a.sla.remaining - b.sla.remaining)
  const na = count('na')

  const tiles = [
    { st: 'on', note: `sisa > ${WARNING_DAYS} hari kerja` },
    { st: 'warn', note: `sisa 1–${WARNING_DAYS} hari kerja` },
    { st: 'due', note: 'jatuh tempo / lewat SLA' },
    { st: 'done', note: 'sudah ada keputusan akhir' },
  ]

  return (
    <section className="sla">
      <div className="sla-hd">
        <div>
          <h3>Status SLA</h3>
          <p>Dihitung dalam hari kerja (Senin–Jumat, di luar libur nasional &amp; cuti bersama) sejak Tanggal Input,
            dibandingkan target SLA kumulatif item yang sedang berjalan{totalSla ? ` (total ${totalSla} HK)` : ''}.</p>
        </div>
      </div>
      <div className="sla-tiles">
        {tiles.map((t) => (
          <div key={t.st} className={'st-tile ' + SLA_META[t.st].cls}>
            <b>{count(t.st)}</b>
            <span className="nm">{SLA_META[t.st].label}</span>
            <small>{t.note}</small>
          </div>
        ))}
      </div>
      {!hasDate && <div className="empty">Kolom “Tanggal Input” belum ada di sheet Data, sehingga status SLA belum bisa dihitung.</div>}
      {hasDate && na > 0 && <div className="empty">{na} usulan berjalan belum punya Tanggal Input, sehingga tidak dihitung.</div>}
      {hasDate && (active.length === 0 ? (
        <div className="empty">Tidak ada usulan yang sedang berjalan. Semua usulan pada filter ini sudah punya keputusan akhir.</div>
      ) : (
        <div className="tbl-scroll">
          <table className="sla-tbl">
            <thead>
              <tr><th>Lokasi</th><th>Tanggal input</th><th>Posisi saat ini</th><th className="n">Target HK</th><th className="n">Berjalan</th><th>Sisa</th><th>Jatuh tempo item</th><th>Target selesai</th><th>Status</th></tr>
            </thead>
            <tbody>
              {active.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.city || r.kec}</b><small>{r.region}</small></td>
                  <td>{fmtDate(r.inputDate)}</td>
                  <td>Tahap {r.sla.stage + 1} · {r.sla.item}</td>
                  <td className="n">{r.sla.target}</td>
                  <td className="n">{r.sla.elapsed} HK</td>
                  <td>{sisaText(r.sla.remaining)}</td>
                  <td>{fmtDate(r.sla.itemDue)}</td>
                  <td>{fmtDate(r.sla.finalDue)}</td>
                  <td><SlaPill s={r.sla} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </section>
  )
}
