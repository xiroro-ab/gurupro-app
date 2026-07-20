# 🤖 Prompt Master & Database Schema GuruPro

Simpan file ini dengan baik. Jika di kemudian hari Anda ingin membangun ulang aplikasi ini dari awal menggunakan AI (seperti Google AI Studio / Gemini), Anda cukup memberikan instruksi (prompt) di bawah ini.

---

## 📝 PROMPT PEMBUATAN APLIKASI (SUPER PROMPT)

**Copy dan paste teks di bawah ini ke AI Assistant Anda:**

> "Buatkan saya aplikasi web Single Page Application (SPA) bernama 'GuruPro' menggunakan React (Vite), TypeScript, dan Tailwind CSS. Aplikasi ini adalah Sistem Manajemen Presensi & Jurnal untuk SMPN 58 dengan backend Supabase.
>
> Fitur yang harus ada:
> 1. Multi-role user: Admin, Walikelas, dan Guru.
> 2. Manajemen Master Data: Kelas, Siswa (NISN, Nama, JK), dan Guru.
> 3. Pencatatan Presensi Harian siswa (Hadir, Sakit, Izin, Alfa).
> 4. Jurnal Mengajar guru (Tanggal, Mapel, Materi, Jam ke-, Siswa Absen, Media, Hambatan).
> 5. Manajemen Nilai Siswa (Input nilai, rekap berdasarkan mapel & kelas).
> 6. Jadwal Pelajaran Kelas & Jadwal Global (Link gambar/PDF).
> 7. Kalender Akademik (Libur nasional, Jadwal Ujian).
> 8. Catatan Konseling (Pelanggaran, Prestasi, Bimbingan beserta poin).
> 9. Pengumuman/Mading (Prioritas tinggi/normal/rendah).
> 10. Fitur Offline mode dengan antrian sinkronisasi (Offline Queue) menggunakan `localStorage`.
> 11. Fitur Realtime menggunakan Supabase `postgres_changes` subscription.
> 
> Gunakan `lucide-react` untuk icon. Struktur komponen harus modular. Pisahkan service Supabase di `src/services/supabase.ts`. Aplikasi harus responsif (Mobile-first)."

---

## 🗄️ SKEMA DATABASE SUPABASE (SQL)

Berikut adalah struktur database lengkap yang mendukung fitur Realtime. Jalankan script SQL ini di SQL Editor Supabase Anda saat membuat project baru untuk mereset dan membuat tabel dari awal:

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

ALTER TABLE academic_calendars ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES teachers_profile(id) ON DELETE SET NULL;

-- 11. Create Global Schedules (Image/PDF) Table
CREATE TABLE IF NOT EXISTS global_schedules (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) policies for collaborative testing
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

-- 12. Enable Realtime for all tables
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
Dengan file ini, Anda memiliki kendali penuh untuk mereplikasi ulang sistem jika sewaktu-waktu dibutuhkan tanpa error! 🚀
