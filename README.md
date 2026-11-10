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

GitHub Pages tidak punya server, jadi aplikasi membaca spreadsheet lewat endpoint CSV publik Google (`gviz`), tanpa API key.

1. Spreadsheet harus dibagikan sebagai **"Siapa saja yang memiliki link: Viewer"**.
2. Saat pertama dibuka, tempel link spreadsheet di layar **Sambungkan spreadsheet**. Link disimpan di browser pengguna
   (localStorage), **tidak** ditulis ke repository.
3. Opsional: isi variabel `VITE_SHEET_ID` (Settings → Secrets and variables → Actions → Variables) agar link tidak perlu
   ditempel. Catatan: nilai ini ikut masuk ke file JavaScript yang terbit, sehingga bisa dilihat siapa pun yang membuka situs.

Format sheet yang diharapkan: baris 1 judul tahap, baris 2 judul item (1.1 … 4.5), data mulai baris 3.
Kolom A Region, B Kecamatan, C Kota/Kab, D Provinsi, G–J item Tahap 1, K keputusan Tahap 1, L–P item Tahap 2,
Q keputusan Tahap 2, R–V item Tahap 3, W keputusan Tahap 3, X–AB item Tahap 4, AC keputusan final.
Nilai item `Yes`/`No`, nilai keputusan `Lanjut`/`Tidak Lanjut` (kosong = masih proses).

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

Repository dan situs ini publik. Kode tidak berisi API key, token, ID spreadsheet, atau data SPBU.
Data hanya dibaca dari spreadsheet saat halaman dibuka. Siapa pun yang punya link spreadsheet yang dibagikan publik dapat membacanya.
