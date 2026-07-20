# CHECKPOINT STABLE: v1.0.0 (Bug-Free Version)

## Status Aplikasi (Kondisi Saat Ini)
- **Fungsi Inti**: Seluruh fitur (Autentikasi, Dashboard, Kelola Guru, Kelas, Siswa, Jadwal, Absensi, Jurnal, Penilaian, Catatan Konseling, Kalender, Mading) telah diuji dan berjalan sempurna tanpa bug.
- **Hak Akses (RBAC)**: Aturan wewenang berjalan dengan sangat ketat. Admin memiliki hak akses penuh (CRUD), sedangkan Guru/Wali Kelas hanya dapat mengelola data yang mereka buat sendiri.
- **Arsitektur Data**: Menggunakan Supabase dengan mekanisme `Offline-First`. Aplikasi dapat menyimpan antrian (*Offline Queue*) ke `localStorage` saat offline dan sinkronisasi otomatis saat online, didukung juga dengan *Realtime Updates* yang termuat secara instan.
- **Fitur Baru (Catatan Kedisiplinan)**: Telah dilengkapi dengan upload bukti foto. Logika penyimpanan aman tanpa error ketika foto tidak disertakan, serta fitur unduh CSV dan Cetak laporan yang berfungsi sempurna.

## Instruksi Pemulihan (Recovery) untuk AI
File ini berfungsi sebagai **jangkar ingatan (memory anchor)** bagi sistem AI. Jika di masa depan pengguna meminta perubahan desain/tema yang tidak disengaja merusak fungsionalitas, AI diinstruksikan untuk:
1. Mempertahankan struktur antarmuka data pada `/src/types.ts`.
2. Tidak mengubah sama sekali kerangka `OfflineQueue` dan logika *upsert* pada `/src/services/supabase.ts`.
3. Mengembalikan kerangka *rendering* UI ke versi Tailwind utilitas murni seperti sebelum perombakan tema.
4. Menjadikan file ini sebagai titik acuan bahwa aplikasi pernah berada di tahap stabil.
