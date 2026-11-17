# Monitoring Usulan SPBU COCO

Dashboard pemantauan usulan SPBU COCO dari Tahap 1 (Kajian Awal) sampai Tahap 4 (Eksekusi), lengkap dengan status SLA.
Terbit otomatis ke GitHub Pages: https://fuelchannel2022-tech.github.io/Monitoring-Usulan-SPBU-COCO/

Tampilan dan logika sama dengan dashboard "Dashboard 4 Tahap SPBU COCO" di Claude.

## Isi halaman

- Banner foto SPBU dengan logo, ringkasan, filter **Region**, pencarian **Kabupaten/Kota**, dan tombol **Muat ulang data**.
- 4 kartu tahap (ikon 3D maroon): usulan masuk, lanjut / tidak lanjut, jumlah overdue SLA.
- **Status SLA**: On Schedule, Warning, Due Date; tabel per tahap (usulan masuk, lanjut, tidak lanjut, status SLA, kepatuhan SLA);
  daftar overdue.
- Panel detail dengan dropdown **Tahap**; klik sub tahapan untuk melihat status setiap lokasi.

## Sumber data (selalu mengikuti spreadsheet)

- Spreadsheet: **Dashboard Monitoring Usulan SPBU COCO** (ID di `index.html`, konstanta `SHEET_ID`).
- Tab **Data** (`gid=0`) dan tab **Libur** (`gid=510003`) dibaca sebagai CSV publik saat halaman dibuka,
  lalu setiap 2 menit dan setiap kali tab browser aktif kembali. Tidak memakai API key.
- Spreadsheet harus dibagikan **"Siapa saja yang memiliki link"**. Gunakan peran **Viewer**, karena ID spreadsheet ada di kode publik.
- Kolom dibaca berdasarkan judul: `Region`, `Kecamatan`, `Kota/Kab`, `Provinsi`, `Tanggal Input`, item `1.1`–`4.5`,
  kolom keputusan tepat setelah item terakhir tiap tahap, baris `SLA` (SLA kumulatif hari kerja). Pencarian mencocokkan kolom `Kota/Kab`.
- Isi item: **tanggal selesai** (kosong / Pending = belum selesai).

## Aturan SLA

- Batas SLA item = Tanggal Input + SLA kumulatif (hari kerja; akhir pekan dan tanggal di tab **Libur** tidak dihitung).
- Belum selesai: **On Schedule** (sisa > 2 HK), **Warning** (H-2 s.d. hari H), **Due Date** (melewati batas SLA).
- Sudah selesai: tepat waktu / terlambat → **Kepatuhan SLA** per tahap.
- Keputusan tahap "Tidak Lanjut" → item yang belum selesai dianggap dihentikan (bukan overdue).
- Usulan dihitung masuk Tahap 1 jika Tanggal Input terisi.

## Pengembangan & rilis

```bash
npm install
npm run dev      # http://localhost:5173/Monitoring-Usulan-SPBU-COCO/
npm run build    # menyalin index.html apa adanya ke dist/ (tanpa diolah Vite)
```

`index.html` diterbitkan byte per byte sama dengan halaman dashboard di Claude, jadi tampilannya identik.

Setiap push ke `main` menjalankan `.github/workflows/deploy.yml` (build lalu deploy ke GitHub Pages).
Perubahan isi spreadsheet tidak perlu push: halaman membaca data terbaru langsung dari Google Sheets.

## Keamanan

Repository dan situs ini publik. Tidak ada API key atau token di kode. Data dibaca dari spreadsheet yang dibagikan lewat link.
