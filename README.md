# Pet Care Log

Pet Care Log adalah aplikasi TypeScript untuk mencatat rutinitas perawatan hewan, mengingatkan jadwal yang jatuh tempo, dan melihat riwayat perawatan.

## Menjalankan project

```bash
npm install
npm run dev
```

Build untuk produksi:

```bash
npm run build
npm run preview
```

## Fitur

- CRUD rutinitas: tambah, lihat, edit, tandai selesai/batalkan, dan hapus.
- Pencarian berdasarkan rutinitas, nama hewan, kategori, atau catatan.
- Filter semua jadwal, jadwal aktif, dan riwayat yang selesai.
- Ringkasan otomatis untuk jadwal yang jatuh tempo, rutinitas aktif, dan perawatan selesai.
- Data disimpan di `localStorage` browser dan contoh data awal tersedia saat pertama kali dibuka.
- Validasi form, notifikasi status, penanganan kegagalan penyimpanan, dan dialog aksesibel.
- Tata letak responsif untuk desktop dan perangkat seluler.

## Struktur

```text
src/
├── types/       # interface dan union types
├── services/    # aturan bisnis dan operasi CRUD
├── utils/       # localStorage, tanggal, dan data contoh
├── main.ts
└── style.css
index.html
```

`CareTask` menyimpan tanggal/jam jadwal dan status `pending | completed`. `getDueStatus` menghitung status tampilan `overdue | due-today | upcoming | completed` berdasarkan tanggal lokal.
