# Rincian Fitur GuruPro & Tutorial Push ke GitHub

Dokumentasi ini mencakup rincian lengkap seluruh fitur yang telah dibangun di aplikasi **GuruPro** (dari awal hingga selesai) beserta panduan lengkap cara melakukan push kode ke GitHub untuk pencadangan aman.

---

## BAGIAN 1: Rincian Fitur Aplikasi GuruPro

Aplikasi **GuruPro** dirancang sebagai sistem informasi manajemen akademik sekolah terpadu dengan arsitektur **Hybrid Storage** (mendukung penyimpanan offline lokal menggunakan `localStorage` browser dan sinkronisasi cloud real-time menggunakan `Supabase`).

Aplikasi memiliki pembagian hak akses (role-based) yang sangat ketat untuk 3 jenis pengguna:
1. **Administrator (Admin)**
2. **Wali Kelas**
3. **Guru Mata Pelajaran (Mapel)**

Berikut adalah daftar fitur lengkap yang telah diimplementasikan:

### 1. Fitur Utama & Keamanan
*   **Sistem Autentikasi Ganda (Hybrid Auth)**:
    *   Pengguna dapat masuk menggunakan email dan kata sandi yang terdaftar di Supabase, atau menggunakan mode penyimpanan Lokal Offline tanpa koneksi internet.
    *   Sistem secara otomatis mendeteksi status koneksi internet dan beralih ke mode offline lokal jika jaringan terputus.
*   **Manajemen Akun & Profil**:
    *   Setiap pengguna dapat memperbarui foto profil (avatar), nama lengkap, NIP, serta email langsung melalui menu **Profil Saya**.
*   **Koneksi Status Bar (Header)**:
    *   Indikator status koneksi yang menampilkan apakah aplikasi sedang terhubung ke Supabase Cloud (Online) atau menggunakan penyimpanan Lokal (Offline).
    *   Tombol manual untuk melakukan sinkronisasi paksa dan tombol untuk beralih mode penyimpanan secara dinamis.

### 2. Fitur Berdasarkan Role Pengguna
#### A. Menu Administrator (Admin)
*   **Dashboard Utama (Statistik & Visualisasi)**:
    *   Grafik demografi siswa (Laki-laki vs Perempuan).
    *   Grafik rasio kehadiran harian siswa.
    *   Daftar tingkat kepatuhan guru dalam mengisi jurnal kelas.
    *   Notifikasi otomatis pendeteksian siswa tidak hadir secara berturut-turut (deteksi dini potensi putus sekolah/bolos).
*   **Kelola Data Guru**:
    *   Menambah, mengubah, dan menghapus profil guru.
    *   Menentukan hak akses peran (Admin, Wali Kelas, Guru Mapel) serta mata pelajaran yang diampu.
*   **Kelola Data Kelas**:
    *   Menyusun daftar kelas (contoh: VII.1, VIII.2, IX.3).
    *   Menugaskan guru tertentu sebagai Wali Kelas untuk kelas masing-masing.
*   **Kelola Data Siswa**:
    *   Menambah, mengedit, dan menghapus data siswa secara detail (Nama, NISN, Jenis Kelamin, Kelas).
    *   **Impor Data Massal (Excel/CSV)**: Fitur impor massal data siswa menggunakan format file CSV secara praktis.
    *   **Integrasi WhatsApp**: Tombol instan untuk mengirimkan pesan konfirmasi pendaftaran nomor WhatsApp orang tua siswa secara otomatis.
*   **Pemantauan Kinerja Guru (Progres Guru)**:
    *   Laporan rekapitulasi jumlah jurnal mengajar dan kehadiran yang telah diisi oleh setiap guru di sekolah.

#### B. Menu Wali Kelas
*   **Presensi / Absensi Harian Kelas**:
    *   Mengisi daftar hadir harian kelas bimbingannya (Hadir, Sakit, Izin, Alfa).
    *   Pesan peringatan instan WhatsApp langsung ke nomor orang tua siswa jika siswa bersangkutan tidak hadir (Alfa) tanpa keterangan.
*   **Laporan Absensi Bulanan**:
    *   Rekapitulasi kehadiran bulanan kelas dalam bentuk tabel dinamis.
    *   Tombol ekspor dokumen cetak ramah printer (A4 standard cetak resmi sekolah) lengkap dengan kolom tanda tangan Kepala Sekolah dan Wali Kelas.
    *   Ekspor data rekapitulasi ke format spreadsheet Excel/CSV.

#### C. Menu Guru Mata Pelajaran
*   **Presensi Kelas Mapel**:
    *   Mengisi daftar kehadiran siswa khusus pada jam mata pelajaran yang diampunya.
*   **Jurnal Mengajar Elektronik (4 Jenis Jurnal)**:
    1.  **Agenda Harian Guru**: Catatan rencana mengajar harian pribadi.
    2.  **Jurnal Mengajar Kelas**: Jurnal resmi materi, kompetensi dasar, hambatan, dan solusi selama mengajar di kelas.
    3.  **Agenda Kegiatan MGMP**: Agenda keikutsertaan dalam forum Musyawarah Guru Mata Pelajaran.
    4.  **Jurnal Kegiatan MGMP**: Laporan detail hasil pertemuan dan pembahasan di forum MGMP.

---

### 3. Fitur Tambahan & Unggulan Baru (Pengembangan Tahap Akhir)
*   **Mading Pengumuman Sekolah**:
    *   Media komunikasi digital untuk menyebarkan info penting dengan klasifikasi prioritas (Normal / Penting-Red Alert).
    *   Pengumuman dapat ditargetkan khusus untuk grup pengguna tertentu (Semua, Guru, Wali Kelas).
*   **Jadwal Pelajaran Global**:
    *   Fitur unggah jadwal pelajaran sekolah terpusat dalam bentuk file dokumen (PDF) atau file visual (JPG/PNG).
    *   Guru dan staf dapat melihat dan mengunduh jadwal global secara langsung.
*   **Penilaian Siswa (Buku Nilai)**:
    *   Pencatatan nilai tugas, Ujian Harian (UH), UTS, UAS, dan penghitungan nilai akhir secara otomatis berbasis bobot persentase.
    *   Cetak rapor nilai dan unduh buku nilai dalam format CSV.
*   **Kalender Akademik Terintegrasi**:
    *   Agenda libur nasional dan pekan ujian sekolah yang terorganisasi.
*   **Catatan Kedisiplinan & Konseling (Bimbingan Konseling)**:
    *   Pencatatan poin pelanggaran (minus) dan poin prestasi siswa (bonus) untuk memantau perilaku siswa secara terukur.
    *   Cetak laporan Bimbingan Konseling resmi yang siap ditandatangani Kepala Sekolah.

---

## BAGIAN 2: Tutorial Lengkap Push Project ke GitHub

Ikuti langkah-langkah di bawah ini untuk mengunggah (push) kode proyek dari komputer lokal Anda ke akun GitHub Anda.

### Prasyarat Sebelum Mulai
1.  Pastikan Anda telah menginstal **Git** di komputer Anda ([Download Git](https://git-scm.com/)).
2.  Pastikan Anda memiliki akun di [GitHub](https://github.com/).

---

### Langkah 1: Inisialisasi Git Lokal
Buka terminal (Command Prompt / PowerShell / Git Bash) di folder root project Anda, lalu jalankan perintah berikut:

```bash
# 1. Inisialisasi repositori git baru
git init

# 2. Tambahkan semua file dalam proyek ke daftar pantau Git
git add .

# 3. Buat commit pertama Anda
git commit -m "feat: inisialisasi awal proyek GuruPro - Full Fitur"
```

### Langkah 2: Buat Repositori Baru di GitHub
1.  Buka browser dan masuk ke [github.com](https://github.com/).
2.  Klik tombol **New** di bagian pojok kiri atas (atau tombol **+** di pojok kanan atas lalu pilih **New repository**).
3.  Isi nama repositori, contoh: `gurupro-smp58`.
4.  Pilih visibilitas repositori:
    *   **Public**: Dapat dilihat semua orang.
    *   **Private**: Hanya Anda dan orang yang diundang yang bisa melihat (sangat disarankan jika Anda memiliki konfigurasi keamanan).
5.  **PENTING**: Jangan mencentang pilihan *Add a README file*, *Add .gitignore*, atau *Choose a license*, karena kita sudah memilikinya di project lokal.
6.  Klik tombol **Create repository**.

### Langkah 3: Hubungkan Git Lokal ke GitHub
Setelah repositori di GitHub selesai dibuat, Anda akan melihat halaman instruksi. Salin alamat URL repositori Anda (misalnya: `https://github.com/username Anda/gurupro-smp58.git`), lalu jalankan perintah ini di terminal:

```bash
# 1. Daftarkan alamat repositori GitHub sebagai remote origin
git remote add origin https://github.com/username_Anda/gurupro-smp58.git

# 2. Ubah nama branch utama lokal menjadi 'main' (standar modern GitHub)
git branch -M main

# 3. Push kode lokal Anda ke branch main di GitHub
git push -u origin main
```

---

### Langkah 4: Cara Melakukan Update Kode di Kemudian Hari
Jika di kemudian hari Anda melakukan perubahan atau penambahan fitur di project Anda, jalankan 3 perintah sederhana berikut untuk memperbarui kode Anda di GitHub:

```bash
# 1. Tambahkan perubahan terbaru ke staging area
git add .

# 2. Buat catatan commit deskriptif terkait perubahan tersebut
git commit -m "fix: memperbaiki bug blank screen pada catatan kedisiplinan"

# 3. Push perubahan ke GitHub
git push origin main
```

### Tips Keamanan Tambahan ⚠️
*   **Jangan pernah mengunggah API Key / Password Supabase ke GitHub!**
    *   Pastikan file `.env` sudah terdaftar di dalam file `.gitignore` agar tidak ikut terunggah secara tidak sengaja.
    *   Di GitHub, simpan kunci sensitif tersebut di menu **Settings -> Secrets and variables -> Actions** jika Anda menggunakan CI/CD, atau cukup distribusikan file `.env` secara manual di server produksi Anda.
