# Dokumentasi Lengkap GuruPro

Dokumentasi ini mencakup panduan lengkap pembuatan ulang (prompt master), struktur database dengan fitur realtime, rincian aturan hak akses (RBAC), hingga cara melakukan *push* (unggah) ke GitHub.

---

## 1. Master Prompt (Panduan Pembuatan dari Nol)

Gunakan *prompt* di bawah ini kepada AI (seperti Google AI Studio / Gemini) untuk membangun ulang aplikasi secara identik jika diperlukan di kemudian hari:

> **PROMPT PEMBUATAN APLIKASI GURUPRO:**
> 
> "Buatkan saya sebuah aplikasi web Single Page Application (SPA) manajemen sekolah dan guru bernama **GuruPro** menggunakan React, TypeScript, Vite, dan Tailwind CSS. Aplikasi ini harus memiliki sistem *Role-Based Access Control* (RBAC) yang ketat dengan peran `admin`, `walikelas`, dan `guru`. Aplikasi ini juga harus mendukung penyimpanan data ganda: menggunakan **Supabase** sebagai database utama (PostgreSQL) dengan fitur **Realtime (postgres_changes)** dan **Offline-first** (menyimpan sementara di `localStorage` melalui *Offline Queue* jika koneksi terputus dan otomatis sinkronisasi saat online).
> 
> **Kebutuhan UI/UX:**
> - Desain modern, bersih, responsif (mobile-first), dan mendukung mode cetak (Print/PDF) yang rapi tanpa elemen navigasi.
> - Gunakan ikon dari `lucide-react`.
> - Sediakan *Sidebar* untuk navigasi dan *Header* untuk profil serta notifikasi.
> - Terapkan *Error Boundary* untuk mencegah aplikasi *crash* atau *blank screen* sepenuhnya jika terjadi kesalahan render.
> 
> **Fitur yang Wajib Ada beserta Aturan Hak Akses (RBAC) yang Ketat:**
> *Aturan Umum Akses Data:* Admin memiliki hak akses penuh (Create, Read, Update, Delete - CRUD) ke seluruh data. Guru HANYA dapat memanipulasi (CRUD) data yang mereka buat sendiri (berdasarkan ID pembuat), dan hanya dapat melihat (Read-Only) data publik/global yang dibuat Admin.
> 
> 1. **Autentikasi & Profil**: Login dan Daftar akun. Manajemen profil (edit nama, email, NIP, mapel, avatar).
> 2. **Dashboard**: Ringkasan data sekolah dalam bentuk kartu statistik.
> 3. **Kelola Guru (Admin Only)**: Admin mengelola data master seluruh guru.
> 4. **Kelola Kelas (Admin Only)**: Admin mengelola data master kelas.
> 5. **Kelola Siswa**: Admin bisa menambah, edit, hapus, upload CSV, dan integrasi tombol WhatsApp ortu. Guru hanya bisa melihat data siswa (Read-Only).
> 6. **Jadwal Pelajaran**: Admin dapat membuat, melihat, mengedit, dan menghapus jadwal seluruh guru. Guru dapat membuat, melihat, mengedit, dan menghapus jadwalnya **sendiri**, tetapi tidak bisa melihat/mengubah jadwal guru lain. Tersedia opsi upload jadwal global (gambar/PDF).
> 7. **Absensi Harian**: Pencatatan kehadiran siswa. Admin bisa melihat semua absensi. Wali Kelas mencatat absensi utama harian. Guru Mapel mencatat absensi di jam pelajarannya sendiri.
> 8. **Jurnal Mengajar**: Guru dapat mengisi, mengedit, dan menghapus jurnal mengajarnya sendiri. Admin bisa memantau dan mengedit semua jurnal guru.
> 9. **Penilaian Siswa**: Guru dapat menginput, mengedit, dan menghapus nilai siswa untuk mata pelajarannya sendiri. Admin dapat memantau semuanya.
> 10. **Catatan Konseling / Kedisiplinan**: Pencatatan pelanggaran, prestasi, atau bimbingan dengan sistem poin. **Aturan kepemilikan sangat ketat:** Guru **dapat membuat, melihat, mengedit, dan menghapus** catatan, tetapi **hanya terbatas pada catatan yang mereka buat sendiri** (berdasarkan `teacher_id`). Guru tidak bisa melihat, mengedit, atau menghapus catatan milik guru lain. **Admin memiliki akses penuh** untuk melihat, mengedit, dan menghapus seluruh catatan dari semua guru. Jika Admin mengedit catatan milik Guru, data tersebut tidak boleh hilang dari tampilan Guru pembuatnya (harus tetap menggunakan `teacher_id` Guru pembuat awal saat Admin melakukan mutasi/edit).
> 11. **Kalender Akademik**: Admin dapat membuat hari libur atau jadwal ujian secara **Global** (berlaku untuk semua, mencegah KBM). Guru dapat melihat jadwal global ini namun **tidak dapat mengedit/menghapusnya**. Guru juga dapat membuat jadwal/agenda **Personal** mereka sendiri (hanya terlihat dan dapat dihapus/diedit oleh guru tersebut secara pribadi menggunakan patokan `created_by`).
> 12. **Pengumuman (Mading)**: Admin membuat, mengedit, dan menghapus berita sekolah (Prioritas Tinggi/Normal/Rendah). Guru hanya dapat membacanya (Read-Only).
> 13. **Progres Guru (Admin Only)**: Pantauan aktivitas guru (jumlah jurnal, absensi) dan ekspor laporan (PDF/CSV).
> 
> **Integrasi Supabase & Realtime:**
> Siapkan arsitektur data dengan pola *Singleton* Service `supabase.ts` yang menangani semua koneksi database, termasuk fallback ke LocalStorage, integrasi `supabase.channel` untuk subscription update realtime di `App.tsx`."

---

## 2. Struktur Database Lengkap (Supabase PostgreSQL Schema + Realtime)

Berikut adalah struktur database lengkap yang mendukung fitur Realtime. Jalankan script SQL ini di **SQL Editor** Supabase Anda saat membuat project baru untuk mereset dan membuat tabel dari awal. Skema ini telah disesuaikan dengan kebutuhan relasi yang tepat (termasuk UUID, teks, dll).

```sql
-- 0. Hapus tabel lama yang berkonflik (Reset struktur)
DROP TABLE IF EXISTS teaching_journals, daily_attendances, students, classes, teachers_profile, student_grades, class_schedules, announcements, counseling_records, academic_calendars, global_schedules CASCADE;

-- 1. Create Profile Table
CREATE TABLE IF NOT EXISTS teachers_profile (
  id UUID PRIMARY KEY,
  nip TEXT NOT NULL,
  nama_lengkap TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'walikelas', 'guru')),
  mapel TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Classes Table
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  nama_kelas TEXT NOT NULL,
  walikelas_id UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Students Table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nisn TEXT NOT NULL UNIQUE,
  nama_siswa TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Daily Attendances Table
CREATE TABLE IF NOT EXISTS daily_attendances (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin', 'alfa')),
  keterangan TEXT,
  tanggal TEXT NOT NULL,
  recorded_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Teaching Journals Table
CREATE TABLE IF NOT EXISTS teaching_journals (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
  mapel TEXT NOT NULL,
  materi TEXT NOT NULL,
  keterangan TEXT,
  journal_type TEXT DEFAULT 'jurnal_mengajar' NOT NULL,
  jam_ke TEXT,
  siswa_absen TEXT,
  media_pembelajaran TEXT,
  hambatan_solusi TEXT,
  recorded_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Student Grades Table
CREATE TABLE IF NOT EXISTS student_grades (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL,
  tipe_nilai TEXT NOT NULL,
  nilai NUMERIC NOT NULL,
  keterangan TEXT,
  semester TEXT NOT NULL,
  recorded_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create Class Schedules Table
CREATE TABLE IF NOT EXISTS class_schedules (
  id TEXT PRIMARY KEY,
  hari TEXT NOT NULL CHECK (hari IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu')),
  jam_mulai TEXT NOT NULL,
  jam_selesai TEXT NOT NULL,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  mapel TEXT NOT NULL,
  teacher_id UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Create Announcements Table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
  target_role TEXT NOT NULL CHECK (target_role IN ('all', 'guru', 'walikelas')),
  created_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Create Counseling Records Table
CREATE TABLE IF NOT EXISTS counseling_records (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  tanggal TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('pelanggaran', 'prestasi', 'bimbingan')),
  deskripsi TEXT NOT NULL,
  tindak_lanjut TEXT,
  poin NUMERIC,
  foto TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Create Academic Calendars (Holidays) Table
CREATE TABLE IF NOT EXISTS academic_calendars (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL,
  keterangan TEXT NOT NULL,
  is_exam BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Create Global Schedules (Image/PDF) Table
CREATE TABLE IF NOT EXISTS global_schedules (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Disable Row Level Security (RLS) policies for collaborative testing (atau terapkan custom policies jika di tahap produksi)
ALTER TABLE teachers_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendars DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_schedules DISABLE ROW LEVEL SECURITY;

-- 13. Enable Realtime untuk semua tabel agar broadcast update berfungsi
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE teachers_profile;
ALTER PUBLICATION supabase_realtime ADD TABLE classes;
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_attendances;
ALTER PUBLICATION supabase_realtime ADD TABLE teaching_journals;
ALTER PUBLICATION supabase_realtime ADD TABLE student_grades;
ALTER PUBLICATION supabase_realtime ADD TABLE class_schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE counseling_records;
ALTER PUBLICATION supabase_realtime ADD TABLE academic_calendars;
ALTER PUBLICATION supabase_realtime ADD TABLE global_schedules;
```

---

## 3. Fitur-Fitur Aplikasi Secara Lengkap (Rincian)

Aplikasi GuruPro dilengkapi dengan fitur komprehensif untuk membantu operasional sekolah, dibedakan hak aksesnya berdasarkan Admin dan Guru.

**Fungsi Global (Semua Pengguna):**
*   **Offline-First & Auto-Sync**: Aplikasi dapat digunakan meski tanpa internet (menyimpan data di memori lokal) dan akan sinkronisasi otomatis ketika internet terhubung dengan mekanisme *Offline Queue*.
*   **Realtime Updates**: Dengan fitur *channel subscription* Supabase, setiap ada perubahan data oleh Admin/Guru lain, data pada layar akan otomatis memuat ulang tanpa perlu di-_refresh_.
*   **PWA / Mode Cetak Cerdas**: Tampilan akan secara otomatis menyembunyikan Sidebar, Header, dan Tombol saat halaman dicetak (Ctrl+P) atau diekspor ke PDF.
*   **Error Boundary**: Sistem perlindungan *crash* di mana jika salah satu fitur bermasalah, fitur lain tetap bisa diakses tanpa layar putih/blank, dilengkapi tombol muat ulang data.

**Fitur Admin (Hak Akses Penuh):**
1.  **Dashboard Utama**: Melihat analitik keseluruhan data sekolah (jumlah guru, siswa, kelas, persentase kehadiran).
2.  **Kelola Guru**: Menambah, mengedit, dan menghapus akun staf pengajar secara penuh.
3.  **Kelola Kelas**: Menambah data rombongan belajar dan menentukan wali kelas.
4.  **Kelola Siswa & Import CSV**: Mengelola data siswa secara penuh. Mendukung unggah data massal CSV menggunakan `papaparse` dan tombol *WhatsApp API* ke wali murid.
5.  **Progres Guru**: Memantau kedisiplinan guru dalam mengisi jurnal mengajar dan kehadiran, dapat dicetak ke PDF/CSV.
6.  **Pengumuman Mading**: Membuat berita sekolah (Prioritas Tinggi/Normal/Rendah) yang akan terlihat oleh Guru.
7.  **Kalender Akademik Global**: Membuat jadwal libur atau ujian secara global. Data ini **tidak dapat dihapus atau diedit oleh Guru**.
8.  **Penilaian & Konseling (Super Admin)**: Dapat memantau, mengedit, dan menghapus seluruh nilai dan catatan konseling tanpa batasan.

**Fitur Guru & Wali Kelas (Hak Akses Terbatas):**
1.  **Absensi Harian**: Mencatat kehadiran siswa. Wali kelas memiliki otoritas absensi harian utama, sedangkan Guru Mapel mencatat absensi khusus pada jam pelajarannya.
2.  **Jurnal Mengajar**: Terdapat fleksibilitas pengisian (Agenda Harian, Jurnal Mengajar, Agenda MGMP, Jurnal MGMP). Guru hanya bisa melihat dan mengelola jurnal yang dibuatnya sendiri.
3.  **Jadwal Pelajaran**: Guru dapat menyusun dan mengelola jadwal mengajarnya sendiri. Mereka tidak bisa melihat dan campur tangan terhadap jadwal guru lain.
4.  **Penilaian Siswa**: Buku nilai digital. Guru hanya dapat mengelola (tambah, edit, hapus) nilai yang mereka inputkan.
5.  **Catatan Konseling**: Buku kedisiplinan untuk mencatat pelanggaran, prestasi, dan bimbingan siswa. **Guru memiliki otoritas penuh pada catatan yang dibuatnya sendiri** (tidak bisa melihat catatan guru lain). Jika Admin mengedit catatan tersebut, data tetap menjadi milik Guru pembuat asli (sinkronisasi terjaga dengan mempertahankan `teacher_id` asal).
6.  **Kalender Akademik Personal**: Guru bisa membuat agenda/kalender pribadi, yang hanya bisa dilihat dan dikelola oleh dirinya sendiri.
7.  **Profil & Tema**: Menyesuaikan data diri, avatar (tersimpan secara lokal agar ringan dan cepat), dan mengganti kata sandi.

---

## 4. Cara Push (Unggah) ke GitHub

Untuk menyimpan seluruh kode sumber (*Source Code*) aplikasi ini dengan aman ke GitHub, ikuti langkah-langkah berikut:

### Persiapan:
1. Pastikan **Git** sudah terinstal di komputer Anda (https://git-scm.com).
2. Pastikan Anda sudah memiliki akun **GitHub** (https://github.com).

### Langkah-langkah Pertama Kali Push:

**1. Buat Repository Baru di GitHub**
- Buka GitHub, klik ikon **`+`** di sudut kanan atas, pilih **New repository**.
- Beri nama repository (misal: `gurupro-app`).
- Biarkan *Public* atau *Private*.
- **Jangan centang** "Add a README file" karena proyek ini sudah memilikinya.
- Klik **Create repository**.

**2. Buka Terminal/Command Prompt di Folder Proyek Anda**
Arahkan terminal (`cd path/ke/folder`) ke folder tempat proyek aplikasi Anda berada.

**3. Inisialisasi Git dan Push Kode Anda**
Jalankan perintah berikut secara berurutan:

```bash
# 1. Inisialisasi git di folder lokal
git init

# 2. Tambahkan semua file ke dalam staging area
git add .

# 3. Buat commit pertama Anda
git commit -m "Initial commit: Aplikasi GuruPro Final dengan RBAC dan Supabase Realtime"

# 4. Ubah nama branch utama menjadi 'main'
git branch -M main

# 5. Hubungkan folder lokal dengan repository GitHub (Ganti URL dengan milik Anda)
git remote add origin https://github.com/username-anda/gurupro-app.git

# 6. Dorong (Push) kode Anda ke GitHub
git push -u origin main
```

### Langkah Update / Perubahan di Masa Depan:
Jika suatu saat Anda memperbaiki *bug* atau menambah fitur baru, Anda cukup menjalankan 3 perintah ini untuk mengupdate repository GitHub Anda:

```bash
# 1. Tambahkan file yang berubah
git add .

# 2. Beri pesan atas perubahan yang dilakukan
git commit -m "Pesan perubahan, misal: Perbaikan sinkronisasi ID guru di Catatan Konseling"

# 3. Push ke GitHub
git push
```
