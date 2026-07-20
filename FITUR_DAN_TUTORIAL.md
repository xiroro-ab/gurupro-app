# 📚 GuruPro: Fitur & Tutorial

Aplikasi **GuruPro - Sistem Manajemen Presensi & Jurnal SMPN 58** adalah aplikasi berbasis web yang dibangun menggunakan React, TypeScript, Tailwind CSS, dan Supabase sebagai backend.

## 🌟 Daftar Fitur Lengkap

1. **Sistem Autentikasi & Manajemen Pengguna**
   - Login terintegrasi menggunakan email (Supabase Auth).
   - Multi-role: Admin, Wali Kelas, dan Guru dengan hak akses masing-masing.

2. **Dashboard & Ringkasan**
   - Menampilkan statistik ringkas (jumlah siswa, kelas, guru).
   - Widget aktivitas terbaru (Jurnal, Pengumuman, dll).

3. **Manajemen Data Induk (Master Data)**
   - **Data Guru:** Tambah, edit, hapus data profil guru.
   - **Data Kelas:** Manajemen kelas dan penugasan Wali Kelas.
   - **Data Siswa:** Input data siswa (NISN, Nama, Jenis Kelamin) per kelas, filter, dan export.

4. **Operasional Akademik Harian**
   - **Presensi Harian:** Pencatatan kehadiran siswa (Hadir, Sakit, Izin, Alfa).
   - **Jurnal Mengajar:** Catatan harian guru (materi, siswa absen, jam ke-, media, hambatan/solusi).
   - **Penilaian Siswa:** Input nilai (Tugas, UH, UTS, UAS), rekap progres penilaian, dan export CSV.
   - **Jadwal Pelajaran:** Manajemen jadwal per kelas untuk masing-masing mapel dan guru.
   - **Jadwal Global (PDF/Gambar):** Menampilkan jadwal umum sekolah yang bisa diunggah/diubah admin.

5. **Konseling & Kedisiplinan**
   - Pencatatan poin pelanggaran, prestasi, dan bimbingan siswa.
   - History catatan konseling per siswa.
   
6. **Informasi & Pengumuman**
   - **Kalender Akademik:** Penentuan hari libur dan jadwal ujian. (Mencegah input jurnal pada hari libur).
   - **Mading/Pengumuman:** Pembuatan pengumuman berdasarkan prioritas (Low, Normal, High) dan target role.

7. **Fitur Lanjutan (Advanced)**
   - **Mode Offline & Sinkronisasi:** Input data (jurnal, nilai, absen, libur, pengumuman) tetap bisa dilakukan saat offline, dan akan otomatis tersinkronisasi (Offline Queue) saat kembali online.
   - **Realtime Updates:** Menggunakan Supabase Realtime, perubahan data (pengumuman, jadwal, nilai, dll) otomatis muncul tanpa perlu reload halaman.

---

## 🚀 Tutorial Push Project ke GitHub

Jika Anda ingin menyimpan kode sumber aplikasi ini ke GitHub, ikuti langkah-langkah berikut di Terminal/Command Prompt (atau di Git Bash):

### 1. Inisialisasi Git (Jika belum)
```bash
git init
```

### 2. Tambahkan Semua File ke Staging
```bash
git add .
```

### 3. Buat Commit Pertama
```bash
git commit -m "Initial commit - Aplikasi GuruPro Selesai"
```

### 4. Ubah Branch Utama menjadi 'main'
```bash
git branch -M main
```

### 5. Hubungkan dengan Repository GitHub Anda
*(Buat repository kosong baru di GitHub terlebih dahulu, lalu copy URL-nya)*
```bash
git remote add origin https://github.com/username-anda/nama-repo-anda.git
```

### 6. Push (Unggah) Kode ke GitHub
```bash
git push -u origin main
```

**Catatan:** Jika ada perubahan di masa depan, Anda cukup menjalankan 3 perintah ini secara berurutan:
```bash
git add .
git commit -m "Pesan perubahan Anda"
git push
```
