/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'guru' | 'walikelas';

export interface TeacherProfile {
  id: string;
  nip: string;
  nama_lengkap: string;
  role: UserRole;
  mapel?: string;
  created_at?: string;
  email?: string;
  avatar?: string; // Base64 or placeholder avatar url
}

export interface ClassRoom {
  id: string;
  nama_kelas: string;
  walikelas_id: string; // References TeacherProfile.id
  tahun_ajaran: string;
}

export interface Student {
  id: string;
  nisn: string;
  nama_siswa: string;
  jenis_kelamin: 'L' | 'P'; // L: Laki-laki, P: Perempuan
  class_id: string; // References ClassRoom.id
  no_hp_orang_tua?: string; // Parent phone number for WhatsApp notifications
  created_at?: string;
}

export interface DailyAttendance {
  id: string;
  student_id: string; // References Student.id
  status: 'hadir' | 'sakit' | 'izin' | 'alfa';
  keterangan?: string;
  tanggal: string; // YYYY-MM-DD
  recorded_by: string; // References TeacherProfile.id
  created_at?: string;
}

export interface TeachingJournal {
  id: string;
  tanggal: string; // YYYY-MM-DD
  class_id?: string | null; // References ClassRoom.id, optional for MGMP
  mapel: string;
  materi: string;
  keterangan?: string;
  recorded_by: string; // References TeacherProfile.id
  created_at?: string;
  journal_type?: 'jurnal_mengajar' | 'agenda_harian' | 'agenda_mgmp' | 'jurnal_mgmp';
  jam_ke?: string;
  siswa_absen?: string;
  media_pembelajaran?: string;
  hambatan_solusi?: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    profile: TeacherProfile;
  } | null;
  mode: 'supabase' | 'local';
}

export type GradeType = 'tugas' | 'ulangan_harian' | 'uts' | 'uas';

export interface StudentGrade {
  id: string;
  student_id: string;
  class_id: string;
  mapel: string;
  tipe_nilai: GradeType;
  nilai: number;
  keterangan?: string;
  semester: string;
  recorded_by: string;
  created_at?: string;
}

export interface Holiday {
  id: string;
  tanggal: string; // YYYY-MM-DD
  keterangan: string;
  is_exam?: boolean;
}

export interface ClassSchedule {
  id: string;
  hari: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';
  jam_mulai: string;
  jam_selesai: string;
  class_id: string;
  mapel: string;
  teacher_id: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high';
  created_at: string;
  created_by: string;
  target_role: 'all' | 'guru' | 'walikelas';
}

export interface CounselingRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  tanggal: string;
  jenis: 'pelanggaran' | 'prestasi' | 'bimbingan';
  deskripsi: string;
  tindak_lanjut?: string;
  poin?: number;
  foto?: string;
  created_at: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'journal' | 'attendance' | 'grades' | 'holiday' | 'schedule' | 'announcement' | 'counseling';
  action: 'create' | 'save';
  data: any;
  timestamp: number;
  description: string;
}

