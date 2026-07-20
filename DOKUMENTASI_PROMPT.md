# Dokumentasi Prompt Lengkap & Arsitektur Database GuruPro

Dokumentasi ini dirancang agar Anda dapat membuat ulang aplikasi **GuruPro** dari nol di masa depan tanpa mengalami error. File ini memuat struktur tabel database PostgreSQL (Supabase) yang lengkap dan cetak biru prompt AI untuk seluruh bagian sistem.

---

## BAGIAN 1: Struktur Lengkap Database PostgreSQL (Supabase)

Salin dan jalankan skrip SQL di bawah ini pada menu **SQL Editor** di dashboard Supabase Anda untuk membuat seluruh tabel, tipe data, relasi kunci, dan mematikan RLS agar mempermudah pengembangan awal.

```sql
-- ====================================================================
-- SKRIP INISIALISASI DATABASE GURUPRO
-- ====================================================================

-- 0. Bersihkan tabel lama untuk menghindari konflik struktur (Opsional/Gunakan jika ingin mereset)
DROP TABLE IF EXISTS teaching_journals, daily_attendances, students, classes, teachers_profile, student_grades, class_schedules, announcements, counseling_records, academic_calendars, global_schedules CASCADE;

-- 1. Tabel Profil Guru (teachers_profile)
CREATE TABLE IF NOT EXISTS teachers_profile (
  id UUID PRIMARY KEY, -- Terikat dengan Auth.Users ID di Supabase
  nip TEXT,
  nama_lengkap TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'walikelas', 'guru')),
  mapel TEXT, -- Kosong jika wali kelas atau admin
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabel Kelas (classes)
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY, -- Contoh: 'c1', 'c2', atau UUID string
  nama_kelas TEXT NOT NULL,
  walikelas_id UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  tahun_ajaran TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabel Siswa (students)
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  nisn TEXT NOT NULL UNIQUE,
  nama_siswa TEXT NOT NULL,
  jenis_kelamin TEXT NOT NULL CHECK (jenis_kelamin IN ('L', 'P')),
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabel Presensi / Kehadiran Harian (daily_attendances)
CREATE TABLE IF NOT EXISTS daily_attendances (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL, -- Format ISO YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('hadir', 'sakit', 'izin', 'alfa')),
  keterangan TEXT, -- Contoh catatan tambahan atau penanda "[WK]" atau "[MP]"
  recorded_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, tanggal, keterangan) -- Mencegah duplikasi absensi siswa pada hari yang sama untuk jenis pencatatan serupa
);

-- 5. Tabel Jurnal Mengajar Guru (teaching_journals)
CREATE TABLE IF NOT EXISTS teaching_journals (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL, -- Format YYYY-MM-DD
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  jam_ke TEXT NOT NULL,
  materi_pokok TEXT NOT NULL,
  pembahasan_kd TEXT,
  hambatan TEXT,
  solusi TEXT,
  journal_type TEXT NOT NULL CHECK (journal_type IN ('agenda_harian', 'jurnal_mengajar', 'agenda_mgmp', 'jurnal_mgmp')),
  recorded_by UUID REFERENCES teachers_profile(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Tabel Pengumuman Mading (announcements)
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'high')),
  target_role TEXT NOT NULL CHECK (target_role IN ('all', 'guru', 'walikelas')),
  created_by UUID REFERENCES teachers_profile(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Tabel Catatan Kedisiplinan & Konseling (counseling_records)
CREATE TABLE IF NOT EXISTS counseling_records (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  tanggal TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('pelanggaran', 'prestasi', 'bimbingan')),
  poin INTEGER DEFAULT 0,
  deskripsi TEXT NOT NULL,
  tindak_lanjut TEXT,
  teacher_id UUID REFERENCES teachers_profile(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Tabel Kalender Akademik (academic_calendars)
CREATE TABLE IF NOT EXISTS academic_calendars (
  id TEXT PRIMARY KEY,
  tanggal TEXT NOT NULL, -- Format YYYY-MM-DD
  keterangan TEXT NOT NULL,
  is_exam BOOLEAN DEFAULT false, -- True untuk pekan ujian, False untuk libur nasional
  created_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabel Jadwal Pelajaran Global (global_schedules)
CREATE TABLE IF NOT EXISTS global_schedules (
  id TEXT PRIMARY KEY,
  file_url TEXT NOT NULL, -- Base64 String / Supabase Storage URL
  file_name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'application/pdf' atau 'image/png' dsb.
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabel Penilaian Akademik Siswa (student_grades)
CREATE TABLE IF NOT EXISTS student_grades (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  nilai_tugas NUMERIC DEFAULT 0,
  nilai_uh NUMERIC DEFAULT 0,
  nilai_uts NUMERIC DEFAULT 0,
  nilai_uas NUMERIC DEFAULT 0,
  nilai_akhir NUMERIC DEFAULT 0,
  recorded_by UUID REFERENCES teachers_profile(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, subject)
);

-- ====================================================================
-- MENONAKTIFKAN ROW LEVEL SECURITY (RLS) UNTUK MEMPERMUDAH KONEKSI API
-- ====================================================================
ALTER TABLE teachers_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_journals DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendars DISABLE ROW LEVEL SECURITY;
ALTER TABLE global_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades DISABLE ROW LEVEL SECURITY;
```

---

## BAGIAN 2: Cetak Biru Prompt AI Lengkap (Blueprint Prompt)

Gunakan daftar prompt terstruktur di bawah ini saat meminta bantuan asisten AI (seperti Gemini) untuk membangun kembali sistem ini secara bertahap.

### Prompt 1: Inisialisasi Arsitektur Project & Penyimpanan Hybrid (Supabase + LocalStorage)
> **Prompt:** "Buat sebuah proyek React + TypeScript menggunakan Vite dan Tailwind CSS. Buat arsitektur penyimpanan data Hybrid bernama `GuruService` yang membungkus semua operasi database. Jika koneksi internet tersedia dan terhubung ke Supabase, simpan data ke tabel Supabase. Jika koneksi gagal atau offline, simpan data secara lokal menggunakan `localStorage` dengan fallback yang mulus tanpa menginterupsi antarmuka pengguna. Gunakan TanStack React Query (`@tanstack/react-query`) untuk melakukan query caching data secara efisien sehingga data tidak terus-menerus di-load ulang dari jaringan. Sediakan status global di header untuk menampilkan mode penyimpanan saat ini (Online/Offline) dan tombol untuk melakukan sinkronisasi paksa dari antrean offline ke cloud."

### Prompt 2: Desain Sistem Autentikasi Peran Ganda & Menu Samping Dinamis
> **Prompt:** "Implementasikan sistem login multi-role untuk Admin, Wali Kelas, dan Guru Mata Pelajaran. Akun disimpan dalam tabel `teachers_profile`. Berdasarkan role pengguna yang login, sidebar navigasi harus disembunyikan atau ditampilkan secara dinamis menggunakan ikon dari `lucide-react`. Buat default login demo menggunakan local storage jika akun Supabase belum dikonfigurasi, agar aplikasi langsung dapat dicoba di browser tanpa dependensi eksternal."

### Prompt 3: Modul Kelola Guru, Kelas, dan Siswa (Excel/CSV + WhatsApp Link)
> **Prompt:** "Buat layar pengelolaan sekolah untuk Administrator. 
> 1. Kelola Guru: Tambah/Edit/Hapus data Guru Mapel serta mata pelajarannya.
> 2. Kelola Kelas: Tambah/Edit/Hapus data kelas serta penetapan guru sebagai wali kelas.
> 3. Kelola Siswa: Tambah/Edit/Hapus data siswa. Implementasikan fitur unggah massal data siswa menggunakan file CSV (gunakan parser `papaparse`). Tambahkan tombol kirim pesan konfirmasi ke nomor telepon orang tua menggunakan WhatsApp API format tautan (`https://wa.me/nomor?text=pesan_kustom` dengan teks dinamis yang memuat nama siswa dan detail pendaftaran)."

### Prompt 4: Modul Pengisian Presensi Harian & Kirim Notifikasi WhatsApp Otomatis
> **Prompt:** "Buat komponen formulir absensi harian yang disesuaikan untuk Wali Kelas dan Guru Mapel. Tampilkan daftar siswa dalam format baris tabel dengan radio button untuk status: Hadir, Sakit, Izin, Alfa. Di samping nama siswa yang berstatus Alfa, sediakan tombol instan WhatsApp untuk mengirimkan pesan pengumuman ketidakhadiran langsung ke orang tua siswa yang memuat nama lengkap siswa, tanggal hari ini, dan pesan peringatan ramah bahwa anak mereka tidak hadir di sekolah."

### Prompt 5: Modul Jurnal Mengajar Guru Berbasis Tipe Jurnal Elektronik
> **Prompt:** "Buat sistem pengisian Jurnal Mengajar Elektronik yang mendukung 4 tipe jurnal: Agenda Harian Guru, Jurnal Mengajar Kelas, Agenda Kegiatan MGMP, dan Jurnal Kegiatan MGMP. Jurnal harus menyimpan data Tanggal, Kelas, Jam Ke, Materi Pokok, Pembahasan KD, Hambatan, dan Solusi. Simpan data ini ke tabel `teaching_journals` dengan relasi kunci ke id guru yang sedang login."

### Prompt 6: Modul Tambahan (Mading, Jadwal Pelajaran PDF, Buku Nilai, Kalender Akademik, Konseling)
> **Prompt:** "Tambahkan 5 modul fitur berikut untuk melengkapi sistem informasi sekolah:
> 1. Mading Pengumuman: Pengguna dapat menyebarkan pengumuman berskala prioritas tinggi (Red alert) dan prioritas normal berdasarkan filter peran target.
> 2. Jadwal Pelajaran Global: Sediakan antarmuka bagi Admin untuk mengunggah jadwal pelajaran sekolah dalam format PDF atau Gambar (menggunakan format base64) dan biarkan guru lain melihat serta mengunduhnya.
> 3. Buku Nilai Siswa: Pencatatan nilai akademik siswa (Tugas, UH, UTS, UAS, Nilai Akhir) dengan bobot persentase dinamis serta fitur unduh rangkuman nilai dalam format CSV.
> 4. Kalender Akademik: Kelola kalender tahunan sekolah, jadwal libur, dan pekan ujian.
> 5. Catatan Kedisiplinan & Konseling (BK): Catat pelanggaran poin minus, prestasi poin bonus, dan bimbingan konseling siswa. Buat fitur untuk mencetak laporan resmi konseling lengkap dengan kolom tanda tangan Kepala Sekolah yang ramah mesin pencetak (menggunakan media CSS `@media print`)."

### Prompt 7: Teknik Pencegahan Kesalahan Fatal & Crash Rendering (Penting!)
> **Prompt:** "Tulis penanganan error yang sangat ketat untuk semua rendering tanggal dan properti objek dalam React. Gunakan trik berikut:
> - Gunakan helper function untuk memformat semua pemanggilan `toLocaleDateString` dengan validasi instansiasi Date guna mencegah kesalahan fatal `RangeError: Invalid time value`.
> - Tambahkan React Error Boundary (`ErrorBoundary` class component) di file `App.tsx` yang membungkus komponen dinamis aktif (`renderTabContent`). Jika terjadi error tak terduga dalam subkomponen, sistem harus tetap berjalan, menampilkan layar pesan error yang ramah, dan menyediakan tombol sekali-klik 'Reset Penyimpanan Lokal' untuk membersihkan cache browser dan memulihkan aplikasi secara instan."
