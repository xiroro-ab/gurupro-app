/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogIn, Key, Mail, Shield, Award, User, Info, FileText, Check, Copy } from 'lucide-react';
import { TeacherProfile } from '../types';
import { GuruService } from '../services/supabase';
import { useNotification } from './NotificationToast';

interface LoginProps {
  onLoginSuccess: (user: { id: string; email: string; profile: TeacherProfile }) => void;
  storageMode: 'supabase' | 'local';
  onToggleStorageMode: () => void;
}

export default function Login({ onLoginSuccess, storageMode, onToggleStorageMode }: LoginProps) {
  const notification = useNotification();
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration States
  const [namaLengkap, setNamaLengkap] = useState('');
  const [nip, setNip] = useState('');
  const [role, setRole] = useState<'admin' | 'walikelas' | 'guru'>('guru');
  const [mapel, setMapel] = useState('');

  const [loading, setLoading] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      notification.error('Email dan password wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const userSession = await GuruService.signIn(email, password);
      
      if (userSession.mode === 'local') {
        if (storageMode !== 'local') {
          onToggleStorageMode();
        }
        notification.success(
          'Masuk dalam Mode Lokal! Akun Anda berhasil ditemukan di penyimpanan lokal browser.',
          'Mode Lokal Aktif'
        );
      } else {
        notification.success('Berhasil masuk menggunakan database Supabase!');
      }

      setTimeout(() => {
        onLoginSuccess(userSession);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      notification.error(err.message || 'Gagal masuk. Silakan periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !namaLengkap || !nip) {
      notification.error('Semua bidang bertanda bintang wajib diisi.');
      return;
    }

    setLoading(true);

    try {
      const profileData: Omit<TeacherProfile, 'id'> = {
        nip,
        nama_lengkap: namaLengkap,
        role: role, // Fixed bug: use the selected role from state, not hardcoded 'guru'
        mapel: role === 'admin' ? 'admin' : (mapel || 'Umum'),
        email: email
      };

      const result = await GuruService.signUp(email, password, profileData);
      
      if (result.mode === 'local') {
        if (storageMode !== 'local') {
          onToggleStorageMode();
        }
        notification.success(
          'Pendaftaran Dialihkan ke Mode Penyimpanan Lokal!\n\n' +
          'Karena batas limit pendaftaran (email rate limit exceeded) pada server Supabase terlampaui, ' +
          `akun Anda dengan peran "${role === 'admin' ? 'Administrator' : role === 'walikelas' ? 'Wali Kelas' : 'Guru Mapel'}" berhasil dibuat di penyimpanan lokal browser ini.\n\n` +
          'Aplikasi otomatis beralih ke Mode Lokal agar Anda dapat langsung masuk menggunakan akun ini.',
          'Pendaftaran Dialihkan'
        );
      } else {
        notification.success('Registrasi Berhasil ke Database Supabase! Silakan masuk menggunakan akun baru Anda.');
      }
      
      setActiveTab('signin');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      notification.error(err.message || 'Registrasi gagal. Pastikan email belum terdaftar dan password minimal 6 karakter.');
    } finally {
      setLoading(false);
    }
  };

  const sqlSchema = `-- PASTE IN SUPABASE SQL EDITOR --

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

-- Ensure email column exists on existing installations
ALTER TABLE teachers_profile ADD COLUMN IF NOT EXISTS email TEXT;

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

-- Ensure detailed columns exist on existing installations
ALTER TABLE teaching_journals ADD COLUMN IF NOT EXISTS jam_ke TEXT;
ALTER TABLE teaching_journals ADD COLUMN IF NOT EXISTS siswa_absen TEXT;
ALTER TABLE teaching_journals ADD COLUMN IF NOT EXISTS media_pembelajaran TEXT;
ALTER TABLE teaching_journals ADD COLUMN IF NOT EXISTS hambatan_solusi TEXT;

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

-- 11. Create Global Schedules Table
CREATE TABLE IF NOT EXISTS global_schedules (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Disable Row Level Security (RLS) policies for fully collaborative school-internal system testing
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
ALTER PUBLICATION supabase_realtime ADD TABLE global_schedules;`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div id="login-container" className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-lg">
        <div className="flex justify-center items-center gap-3">
          <img
            src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png"
            className="h-14 w-14 object-contain rounded-xl shadow-xs shrink-0"
            alt="Logo SMPN 58"
            referrerPolicy="no-referrer"
          />
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">GuruPro</h2>
            <p className="text-xs text-blue-700 font-medium tracking-wide uppercase">Sistem Manajemen Presensi & Jurnal SMPN 58</p>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-lg">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-100 sm:px-10">
          
          {/* Tabs Selector */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              onClick={() => { setActiveTab('signin'); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${
                activeTab === 'signin'
                  ? 'border-blue-700 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className="h-4 w-4 inline mr-1.5 mb-0.5" />
              <span>Masuk Akun</span>
            </button>
            <button
              onClick={() => { setActiveTab('signup'); }}
              className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-all cursor-pointer ${
                activeTab === 'signup'
                  ? 'border-blue-700 text-blue-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="h-4 w-4 inline mr-1.5 mb-0.5" />
              <span>Daftar Akun Baru</span>
            </button>
          </div>

          {activeTab === 'signin' ? (
            /* Sign In Form */
            <form className="space-y-5" onSubmit={handleFormLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                  Alamat Email Resmi
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="nama@smpn58.sch.id"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                  Kata Sandi
                </label>
                <div className="relative rounded-lg shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors cursor-pointer"
                >
                  {loading ? 'Memproses Autentikasi...' : 'Masuk ke Workspace'}
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up / Registration Form */
            <form className="space-y-4" onSubmit={handleFormRegister}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1">
                    Alamat Email *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="guru@smpn58.sch.id"
                    className="block w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1">
                    Kata Sandi * (min 6 karakter)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-nama" className="block text-sm font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  id="reg-nama"
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={e => setNamaLengkap(e.target.value)}
                  placeholder="Aris Bermansyah, S.Kom"
                  className="block w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-nip" className="block text-sm font-semibold text-slate-700 mb-1">
                    NIP / No. Identitas Pegawai *
                  </label>
                  <input
                    id="reg-nip"
                    type="text"
                    required
                    value={nip}
                    onChange={e => setNip(e.target.value)}
                    placeholder="198510102010121002"
                    className="block w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="reg-mapel" className="block text-sm font-semibold text-slate-700 mb-1">
                    Mata Pelajaran yang Diampu *
                  </label>
                  <input
                    id="reg-mapel"
                    type="text"
                    required
                    value={mapel}
                    onChange={e => setMapel(e.target.value)}
                    placeholder="Contoh: Matematika"
                    className="block w-full px-3.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 sm:text-sm"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-xs text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition-colors cursor-pointer"
                >
                  {loading ? 'Mendaftarkan Akun...' : 'Daftar Akun Baru'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400/80 no-print">
        <p className="font-bold text-slate-500">Powered By Aris</p>
        <p className="text-slate-400/70 mt-1 font-medium">© 2026 A. Bermansyah. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
