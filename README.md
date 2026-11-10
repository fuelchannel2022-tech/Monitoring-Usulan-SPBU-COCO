# Monitoring Usulan SPBU COCO

Dashboard React + Vite untuk memantau usulan SPBU COCO dari Tahap 1 (Kajian Awal) sampai Tahap 4 (Eksekusi).
Diterbitkan otomatis ke GitHub Pages: https://fuelchannel2022-tech.github.io/Monitoring-Usulan-SPBU-COCO/

## Isi aplikasi

- **Dashboard 4 Tahap** (`#tahap`): filter region (dropdown), kartu alur 4 tahap (masuk / lanjut / tidak lanjut / proses),
  dan panel per tahap berisi status setiap item pekerjaan serta daftar lokasi.
- **Ringkasan (Slide)** (`#ringkasan`): slide 16:9 berisi funnel, grafik usulan per region, temuan utama, dan tindak lanjut.
  Tombol **Presentasikan** membuka slide layar penuh.

Semua angka dihitung langsung dari tab **Data** di Google Sheets, dibaca ulang setiap 2 menit dan saat tombol **Muat ulang data** ditekan.

## Sumber data

- Spreadsheet: **Dashboard Monitoring Usulan SPBU COCO**, tab **Data** (`gid=0`). ID diatur di `src/config.js`.
- Dibaca lewat endpoint CSV publik Google (`/gviz/tq?tqx=out:csv&headers=0&gid=0`) tanpa API key, sehingga file harus
  dibagikan sebagai **"Siapa saja yang memiliki link"**. Gunakan peran **Viewer** (jangan Editor), karena ID spreadsheet
  ada di kode publik.
- Kolom dicari berdasarkan **judul header**, bukan posisi: `Region`, `Kecamatan`, `Kota/Kab`, `Provinsi`, item `1.1`–`4.5`
  (baris judul item), dan kolom keputusan tepat setelah item terakhir setiap tahap. Baris dengan Region = `SLA` dibaca
  sebagai target SLA per item. Menambah atau menggeser kolom tidak merusak dashboard selama judul ini tetap ada.
- Nilai item `Yes`/`No`; nilai keputusan `Lanjut`/`Tidak Lanjut` (kosong = masih proses).
- Tombol **Ganti spreadsheet** memungkinkan memakai salinan lain; pilihan itu hanya tersimpan di browser pengguna.
- Bila spreadsheet tidak bisa dibaca (privat, terhapus, tab/kolom berubah), dashboard menampilkan pesan penyebab dan tombol **Coba lagi**.

## Pengembangan lokal

```bash
npm install
npm run dev      # http://localhost:5173/Monitoring-Usulan-SPBU-COCO/
npm run build    # hasil di dist/
```

## Rilis

Setiap push ke branch `main` menjalankan `.github/workflows/deploy.yml` (build lalu deploy ke GitHub Pages).
Sekali saja: Settings → Pages → Source: **GitHub Actions**.

## Keamanan

Repository dan situs ini publik. Kode tidak berisi API key, token, atau data SPBU; hanya ID spreadsheet publik di `src/config.js`.
Data hanya dibaca dari spreadsheet saat halaman dibuka. Siapa pun yang punya link spreadsheet yang dibagikan publik dapat membacanya.
