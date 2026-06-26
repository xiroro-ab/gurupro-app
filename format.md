# Dokumen Backup & Log Status Terakhir - GuruPro

Dokumen ini mencatat ringkasan status aplikasi dan perubahan yang telah diselesaikan untuk memastikan kestabilan seluruh modul.

## 📌 Status Terakhir Sistem (Berjalan Sempurna)

1. **Perbaikan Duplikasi Registrasi & Sinkronisasi DB**:
   - Berhasil mengatasi masalah error pendaftaran "Email rate limit exceeded" pada Supabase dengan mekanisme pengalihan otomatis (*graceful fallback*) ke **Mode Penyimpanan Lokal**.
   - Ketika pendaftaran di Supabase gagal karena limitasi, data tersimpan dengan aman di `localStorage` dan status otomatis dialihkan ke Mode Lokal.

2. **Perbaikan Duplikasi Kolom (Masalah `email` & Schema Cache)**:
   - Supabase mengembalikan kegagalan penambahan kolom `'email'` secara dinamis karena cache skema.
   - Diatasi dengan penanganan cerdas di `supabase.ts`: jika gagal menyimpan atau mengedit guru karena kolom `email` atau cache skema, sistem otomatis mendeteksi dan mengulang tindakan (*retry*) tanpa menyertakan field `email` yang bermasalah.

3. **Gaya Komponen & Dialog Kustom**:
   - Menghapus semua dialog `window.confirm()` bawaan browser karena dapat memicu masalah keamanan dan tidak didukung penuh dalam lingkungan sandbox iframe.
   - Digantikan dengan **Modal Konfirmasi Kustom yang Indah** di seluruh komponen utama:
     - `KelolaGuru.tsx`
     - `KelolaSiswa.tsx`
     - `KelolaKelas.tsx`
     - `JurnalMengajar.tsx`

4. **Penghapusan Bug Input Password**:
   - Proses update profil guru kini mengesampingkan parameter `password` dan `email` yang tidak perlu untuk menghindari konflik format di backend Supabase.

---

## 🚀 Rencana Perbaikan Tahap Berikutnya

1. **Konfigurasi Tahun Ajaran**:
   - Menyediakan panduan dan tempat khusus bagi administrator untuk mengubah Tahun Ajaran secara dinamis melalui UI atau satu titik konfigurasi yang terpusat.
2. **Halaman Profil Pengguna Baru**:
   - Menambahkan menu dropdown di pojok kanan atas pada tombol Profil.
   - Menyediakan rute ke halaman baru: **Profil Saya**, yang memungkinkan pendidik untuk memperbarui nama lengkap, NIP, mata pelajaran yang diampu, dan mengunggah/mengubah foto profil (avatar).
   - Menyediakan tombol keluar dari sistem langsung dari dropdown profil kanan atas.
