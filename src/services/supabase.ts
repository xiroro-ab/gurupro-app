/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { TeacherProfile, ClassRoom, Student, DailyAttendance, TeachingJournal, StudentGrade, UserRole, OfflineQueueItem } from '../types';

// Supabase configuration with fallback to user's provided credentials
const metaEnv = (import.meta as any).env || {};
const SUPABASE_URL = metaEnv.VITE_SUPABASE_URL || 'https://kspqodlpuhorxcmizlag.supabase.co';
const SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FT_hmL66h8quqAjI_v6f4A_5Qo8thL9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Secondary non-session-persisting Supabase client for admin-created auth users
const tempSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// Default initial data for local fallback & mock purposes
const INITIAL_TEACHERS: TeacherProfile[] = [
  { id: 't1', nip: '198501012010011001', nama_lengkap: 'Aris Bermansyah, S.Kom', role: 'admin', mapel: 'Teknologi Informasi' },
  { id: 't2', nip: '198802022013021002', nama_lengkap: 'Budi Santoso, S.Pd', role: 'walikelas', mapel: 'IPA Terpadu' },
  { id: 't3', nip: '198705122012042001', nama_lengkap: 'Rina Wijaya, M.Pd', role: 'walikelas', mapel: 'Bahasa Indonesia' },
  { id: 't4', nip: '199003032015032003', nama_lengkap: 'Siti Aminah, M.Pd', role: 'guru', mapel: 'Matematika' },
  { id: 't5', nip: '198509092011011004', nama_lengkap: 'Hendra Wijaya, S.Pd', role: 'guru', mapel: 'Bahasa Inggris' }
];

const INITIAL_CLASSES: ClassRoom[] = [
  { id: 'c1', nama_kelas: 'VIII-A', walikelas_id: 't2', tahun_ajaran: '2025/2026' },
  { id: 'c2', nama_kelas: 'VIII-B', walikelas_id: 't3', tahun_ajaran: '2025/2026' }
];

const INITIAL_STUDENTS: Student[] = [
  // VIII-A Students
  { id: 's1', nisn: '0081234561', nama_siswa: 'Adi Nugroho', jenis_kelamin: 'L', class_id: 'c1' },
  { id: 's2', nisn: '0081234562', nama_siswa: 'Annisa Putri', jenis_kelamin: 'P', class_id: 'c1' },
  { id: 's3', nisn: '0081234563', nama_siswa: 'Bambang Pamungkas', jenis_kelamin: 'L', class_id: 'c1' },
  { id: 's4', nisn: '0081234564', nama_siswa: 'Citra Lestari', jenis_kelamin: 'P', class_id: 'c1' },
  { id: 's5', nisn: '0081234565', nama_siswa: 'Dodi Hermawan', jenis_kelamin: 'L', class_id: 'c1' },
  { id: 's6', nisn: '0081234566', nama_siswa: 'Eliana Sari', jenis_kelamin: 'P', class_id: 'c1' },
  { id: 's7', nisn: '0081234567', nama_siswa: 'Farhan Kamil', jenis_kelamin: 'L', class_id: 'c1' },
  { id: 's8', nisn: '0081234568', nama_siswa: 'Gita Savitri', jenis_kelamin: 'P', class_id: 'c1' },
  { id: 's9', nisn: '0081234569', nama_siswa: 'Hendra Saputra', jenis_kelamin: 'L', class_id: 'c1' },
  { id: 's10', nisn: '0081234570', nama_siswa: 'Indah Permata', jenis_kelamin: 'P', class_id: 'c1' },
  // VIII-B Students
  { id: 's11', nisn: '0081234571', nama_siswa: 'Jaka Tarub', jenis_kelamin: 'L', class_id: 'c2' },
  { id: 's12', nisn: '0081234572', nama_siswa: 'Kartika Sari', jenis_kelamin: 'P', class_id: 'c2' },
  { id: 's13', nisn: '0081234573', nama_siswa: 'Lukman Hakim', jenis_kelamin: 'L', class_id: 'c2' },
  { id: 's14', nisn: '0081234574', nama_siswa: 'Maria Ulfa', jenis_kelamin: 'P', class_id: 'c2' },
  { id: 's15', nisn: '0081234575', nama_siswa: 'Naufal Azhar', jenis_kelamin: 'L', class_id: 'c2' },
  { id: 's16', nisn: '0081234576', nama_siswa: 'Olivia Rizky', jenis_kelamin: 'P', class_id: 'c2' },
  { id: 's17', nisn: '0081234577', nama_siswa: 'Putu Gede', jenis_kelamin: 'L', class_id: 'c2' },
  { id: 's18', nisn: '0081234578', nama_siswa: 'Queen Alexandra', jenis_kelamin: 'P', class_id: 'c2' },
  { id: 's19', nisn: '0081234579', nama_siswa: 'Rian Hidayat', jenis_kelamin: 'L', class_id: 'c2' },
  { id: 's20', nisn: '0081234580', nama_siswa: 'Syifa Kamila', jenis_kelamin: 'P', class_id: 'c2' }
];

const INITIAL_ATTENDANCES: DailyAttendance[] = [
  { id: 'a1', student_id: 's1', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a2', student_id: 's2', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a3', student_id: 's3', status: 'sakit', keterangan: 'Demam tinggi', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a4', student_id: 's4', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a5', student_id: 's5', status: 'izin', keterangan: 'Acara keluarga', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a6', student_id: 's6', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a7', student_id: 's7', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a8', student_id: 's8', status: 'alfa', keterangan: 'Tanpa keterangan', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a9', student_id: 's9', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' },
  { id: 'a10', student_id: 's10', status: 'hadir', tanggal: '2026-06-23', recorded_by: 't2' }
];

const INITIAL_JOURNALS: TeachingJournal[] = [
  { id: 'j1', tanggal: '2026-06-23', class_id: 'c1', mapel: 'Matematika', materi: 'Aljabar Linear dan Persamaan Kuadrat', keterangan: 'Siswa aktif bertanya, 1 siswa sakit', recorded_by: 't4' },
  { id: 'j2', tanggal: '2026-06-23', class_id: 'c2', mapel: 'Bahasa Inggris', materi: 'Descriptive Text on Historical Places', keterangan: 'Latihan menulis deskripsi individu', recorded_by: 't5' }
];

const INITIAL_GRADES: StudentGrade[] = [];

const DB_KEYS = {
  TEACHERS: 'gurupro_teachers',
  CLASSES: 'gurupro_classes',
  STUDENTS: 'gurupro_students',
  ATTENDANCES: 'gurupro_attendances',
  JOURNALS: 'gurupro_journals',
  GRADES: 'gurupro_grades',
  USER_SESSION: 'gurupro_session',
  HOLIDAYS: 'gurupro_holidays',
  SCHEDULES: 'gurupro_schedules',
  ANNOUNCEMENTS: 'gurupro_announcements',
  COUNSELING: 'gurupro_counseling',
  GLOBAL_SCHEDULE: 'gurupro_global_schedule',
  GLOBAL_SCHEDULE_2: 'gurupro_global_schedule_2'
};

const INITIAL_HOLIDAYS: any[] = [];
const INITIAL_SCHEDULES: any[] = [];
const INITIAL_ANNOUNCEMENTS: any[] = [
  { id: 'a1', title: 'Rapat Evaluasi Bulanan', content: 'Diingatkan kepada seluruh dewan guru untuk hadir dalam rapat evaluasi bulanan yang akan dilaksanakan pada hari Jumat.', priority: 'high', created_at: '2026-06-20T08:00:00Z', created_by: null, target_role: 'all' }
];
const INITIAL_COUNSELING: any[] = [];

// Local storage helper engine to act as dynamic state repository and graceful fallback
class LocalDB {
  static get<T>(key: string, initial: T[]): T[] {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
      return initial;
    }
  }

  static set<T>(key: string, value: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
  }

  // Getters
  static getTeachers(): TeacherProfile[] {
    return this.get<TeacherProfile>(DB_KEYS.TEACHERS, INITIAL_TEACHERS);
  }

  static getClasses(): ClassRoom[] {
    return this.get<ClassRoom>(DB_KEYS.CLASSES, INITIAL_CLASSES);
  }

  static getStudents(): Student[] {
    return this.get<Student>(DB_KEYS.STUDENTS, INITIAL_STUDENTS);
  }

  static getAttendances(): DailyAttendance[] {
    return this.get<DailyAttendance>(DB_KEYS.ATTENDANCES, INITIAL_ATTENDANCES);
  }

  static getJournals(): TeachingJournal[] {
    return this.get<TeachingJournal>(DB_KEYS.JOURNALS, INITIAL_JOURNALS);
  }

  static getGrades(): StudentGrade[] {
    return this.get<StudentGrade>(DB_KEYS.GRADES, INITIAL_GRADES);
  }

  static getHolidays(): any[] {
    return this.get<any>(DB_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
  }

  static getSchedules(): any[] {
    return this.get<any>(DB_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  }

  static getAnnouncements(): any[] {
    return this.get<any>(DB_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  static getCounselingRecords(): any[] {
    return this.get<any>(DB_KEYS.COUNSELING, INITIAL_COUNSELING);
  }

  static getGlobalSchedule(): any {
    try {
      const data = localStorage.getItem(DB_KEYS.GLOBAL_SCHEDULE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static getGlobalSchedule2(): any {
    try {
      const data = localStorage.getItem(DB_KEYS.GLOBAL_SCHEDULE_2);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  // Setters
  static setTeachers(teachers: TeacherProfile[]) {
    this.set(DB_KEYS.TEACHERS, teachers);
  }

  static setClasses(classes: ClassRoom[]) {
    this.set(DB_KEYS.CLASSES, classes);
  }

  static setStudents(students: Student[]) {
    this.set(DB_KEYS.STUDENTS, students);
  }

  static setAttendances(attendances: DailyAttendance[]) {
    this.set(DB_KEYS.ATTENDANCES, attendances);
  }

  static setJournals(journals: TeachingJournal[]) {
    this.set(DB_KEYS.JOURNALS, journals);
  }

  static setGrades(grades: StudentGrade[]) {
    this.set(DB_KEYS.GRADES, grades);
  }

  static setHolidays(holidays: any[]) {
    this.set(DB_KEYS.HOLIDAYS, holidays);
  }

  static setSchedules(schedules: any[]) {
    this.set(DB_KEYS.SCHEDULES, schedules);
  }

  static setAnnouncements(announcements: any[]) {
    this.set(DB_KEYS.ANNOUNCEMENTS, announcements);
  }

  static setCounselingRecords(records: any[]) {
    this.set(DB_KEYS.COUNSELING, records);
  }

  static setGlobalSchedule(schedule: any) {
    if (!schedule) {
      localStorage.removeItem(DB_KEYS.GLOBAL_SCHEDULE);
    } else {
      localStorage.setItem(DB_KEYS.GLOBAL_SCHEDULE, JSON.stringify(schedule));
    }
  }

  static setGlobalSchedule2(schedule: any) {
    if (!schedule) {
      localStorage.removeItem(DB_KEYS.GLOBAL_SCHEDULE_2);
    } else {
      localStorage.setItem(DB_KEYS.GLOBAL_SCHEDULE_2, JSON.stringify(schedule));
    }
  }
}

// Global active mode state. We default to 'supabase' to run directly on the real database,
// but keep local fallback logic as an ultimate backup so the user never gets crashed.
let activeStorageMode: 'supabase' | 'local' = 'supabase';

export function getAcademicYearRange() {
  const tahunAjaran = typeof window !== 'undefined' ? (localStorage.getItem('gurupro_tahun_ajaran') || '2025/2026') : '2025/2026';
  const parts = tahunAjaran.split('/');
  if (parts.length === 2 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
    return {
      start: `${parts[0]}-07-01`,
      end: `${parts[1]}-06-30`
    };
  }
  return { start: '2000-01-01', end: '2099-12-31' };
}

// Try to check if Supabase is connected / accessible
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from('teachers_profile').select('count', { count: 'exact', head: true });
    if (error) {
      console.warn('Supabase test connection returned an error:', error.message);
      // If the tables have not been created yet, error.message will contain 'relation "teachers_profile" does not exist'
      // or error.code will be 'PGRST116' or similar. We should treat this as unreachable/missing tables and fall back.
      if (
        error.message.includes('does not exist') || 
        error.message.includes('relation') || 
        error.code === 'PGRST116' ||
        error.message.includes('not found')
      ) {
        console.warn('Supabase tables are missing. Falling back to Local Storage mode.');
        return false;
      }
      
      if (error.message.includes('failed to fetch')) {
        return false;
      }
    }
    return true;
  } catch (e) {
    console.warn('Supabase connection error, check your credentials');
    return false;
  }
}

// Helper to generate a valid v4 UUID for database tables expecting UUID fields
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to parse legacy journals when detailed columns are missing in older Supabase schemas
function parseLegacyJournal(dbJournal: any): TeachingJournal {
  const journal = { ...dbJournal } as TeachingJournal;
  if (!journal.keterangan) return journal;

  let cleanKeterangan = journal.keterangan;

  // Extract fields from tags if they are missing or null on the DB object
  if (!journal.journal_type || journal.journal_type === 'jurnal_mengajar') {
    const typeMatch = dbJournal.keterangan.match(/\[Tipe:\s*([^\]]+)\]/);
    if (typeMatch) {
      journal.journal_type = typeMatch[1] as any;
      cleanKeterangan = cleanKeterangan.replace(/\[Tipe:\s*([^\]]+)\]\n?/, '');
    }
  }

  if (!journal.jam_ke) {
    const jamMatch = dbJournal.keterangan.match(/\[Jam Ke:\s*([^\]]+)\]/);
    if (jamMatch) {
      journal.jam_ke = jamMatch[1];
      cleanKeterangan = cleanKeterangan.replace(/\[Jam Ke:\s*([^\]]+)\]\n?/, '');
    }
  }

  if (!journal.siswa_absen) {
    const absenMatch = dbJournal.keterangan.match(/\[Siswa Absen:\s*([^\]]+)\]/);
    if (absenMatch) {
      journal.siswa_absen = absenMatch[1];
      cleanKeterangan = cleanKeterangan.replace(/\[Siswa Absen:\s*([^\]]+)\]\n?/, '');
    }
  }

  if (!journal.media_pembelajaran) {
    const mediaMatch = dbJournal.keterangan.match(/\[Media:\s*([^\]]+)\]/);
    if (mediaMatch) {
      journal.media_pembelajaran = mediaMatch[1];
      cleanKeterangan = cleanKeterangan.replace(/\[Media:\s*([^\]]+)\]\n?/, '');
    }
  }

  if (!journal.hambatan_solusi) {
    const hambatanMatch = dbJournal.keterangan.match(/\[Hambatan & Solusi:\s*([^\]]+)\]/);
    if (hambatanMatch) {
      journal.hambatan_solusi = hambatanMatch[1];
      cleanKeterangan = cleanKeterangan.replace(/\[Hambatan & Solusi:\s*([^\]]+)\]\n?/, '');
    }
  }

  journal.keterangan = cleanKeterangan.trim();
  return journal;
}

// Helper class for handling Offline Queue Reconciliation
class OfflineQueue {
  static getQueue(): OfflineQueueItem[] {
    try {
      const data = localStorage.getItem('gurupro_offline_queue');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Error reading offline queue:', e);
      return [];
    }
  }

  static saveQueue(queue: OfflineQueueItem[]): void {
    try {
      localStorage.setItem('gurupro_offline_queue', JSON.stringify(queue));
      // Dispatch custom event to notify Header/App of changes
      window.dispatchEvent(new Event('offline_queue_changed'));
    } catch (e) {
      console.warn('Error saving offline queue:', e);
    }
  }

  static add(type: OfflineQueueItem['type'], action: 'create' | 'save' | 'delete', data: any, description: string): void {
    const queue = this.getQueue();
    
    if (type === 'attendance' && data.length > 0) {
      const date = data[0].tanggal;
      const studentIds = data.map((d: any) => d.student_id).sort().join(',');
      const existingIdx = queue.findIndex(item => {
        if (item.type !== 'attendance') return false;
        const itemDate = item.data[0]?.tanggal;
        const itemStudentIds = item.data.map((d: any) => d.student_id).sort().join(',');
        return itemDate === date && itemStudentIds === studentIds;
      });
      
      if (existingIdx !== -1) {
        queue[existingIdx] = {
          id: queue[existingIdx].id,
          type,
          action,
          data,
          timestamp: Date.now(),
          description
        };
        this.saveQueue(queue);
        return;
      }
    }

    const newItem: OfflineQueueItem = {
      id: 'q_' + Math.random().toString(36).substr(2, 9),
      type,
      action,
      data,
      timestamp: Date.now(),
      description
    };
    queue.push(newItem);
    this.saveQueue(queue);
  }

  static remove(id: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    this.saveQueue(filtered);
  }

  static clear(): void {
    try {
      localStorage.removeItem('gurupro_offline_queue');
      window.dispatchEvent(new Event('offline_queue_changed'));
    } catch (e) {
      console.warn('Error clearing offline queue:', e);
    }
  }
}

// Unified Service Layer that handles fallback automatically
export const GuruService = {
  getStorageMode(): 'supabase' | 'local' {
    return activeStorageMode;
  },

  setStorageMode(mode: 'supabase' | 'local') {
    activeStorageMode = mode;
  },

  // ---------------- STUDENT PHONES DIRECTORY ----------------
  getStudentPhones(): Record<string, string> {
    try {
      const data = localStorage.getItem('gurupro_student_phones');
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.warn('Error reading student phones:', e);
      return {};
    }
  },

  getStudentPhone(studentId: string): string {
    return this.getStudentPhones()[studentId] || '';
  },

  saveStudentPhone(studentId: string, phone: string): void {
    try {
      const phones = this.getStudentPhones();
      phones[studentId] = phone;
      localStorage.setItem('gurupro_student_phones', JSON.stringify(phones));
    } catch (e) {
      console.warn('Error saving student phone:', e);
    }
  },

  // ---------------- OFFLINE RECONCILIATION QUEUE ----------------
  getOfflineQueue(): OfflineQueueItem[] {
    return OfflineQueue.getQueue();
  },

  removeFromOfflineQueue(id: string): void {
    OfflineQueue.remove(id);
  },

  clearOfflineQueue(): void {
    OfflineQueue.clear();
  },

  async syncOfflineQueue(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
    const queue = OfflineQueue.getQueue();
    if (queue.length === 0) {
      return { success: true, syncedCount: 0, errors: [] };
    }

    let syncedCount = 0;
    const errors: string[] = [];
    const remainingQueue: OfflineQueueItem[] = [];

    for (const item of queue) {
      try {
        if (item.type === 'journal') {
          const newJournal = item.data;
          const { data, error } = await supabase.from('teaching_journals').insert([newJournal]).select();
          if (error) {
            const errMsg = error.message || '';
            if (errMsg.includes('column') || errMsg.includes('schema cache') || error.code === 'PGRST204') {
              const detailedKeterangan = [
                newJournal.keterangan || '',
                newJournal.jam_ke ? `[Jam Ke: ${newJournal.jam_ke}]` : '',
                newJournal.siswa_absen ? `[Siswa Absen: ${newJournal.siswa_absen}]` : '',
                newJournal.media_pembelajaran ? `[Media: ${newJournal.media_pembelajaran}]` : '',
                newJournal.hambatan_solusi ? `[Hambatan & Solusi: ${newJournal.hambatan_solusi}]` : '',
                newJournal.journal_type ? `[Tipe: ${newJournal.journal_type}]` : ''
              ].filter(Boolean).join('\n');

              const standardJournal = {
                id: newJournal.id,
                tanggal: newJournal.tanggal,
                class_id: newJournal.class_id,
                mapel: newJournal.mapel,
                materi: newJournal.materi,
                keterangan: detailedKeterangan,
                recorded_by: newJournal.recorded_by
              };

              const { error: retryError } = await supabase
                .from('teaching_journals')
                .insert([standardJournal]);
              if (retryError) throw retryError;
            } else {
              throw error;
            }
          }
          syncedCount++;
        } else if (item.type === 'attendance') {
          if (item.action === 'delete') {
            const { studentIds, date, mode, isWK, kegiatanName } = item.data;
            const delMode = mode || (isWK ? 'walikelas' : 'mapel');
            if (date && studentIds && studentIds.length > 0) {
              const { data: existing, error: fetchErr } = await supabase
                .from('daily_attendances')
                .select('id, keterangan')
                .eq('tanggal', date)
                .in('student_id', studentIds);
              if (!fetchErr && existing && existing.length > 0) {
                const idsToDelete = existing
                  .filter(x => {
                    const itemIsWK = x.keterangan && x.keterangan.startsWith('[WK]');
                    const itemIsKeg = x.keterangan && x.keterangan.startsWith('[KEG]');
                    if (delMode === 'walikelas') return itemIsWK;
                    if (delMode === 'kegiatan') {
                    if (!itemIsKeg) return false;
                    if (!kegiatanName) return true;
                    const existingName = x.keterangan.substring(5).trim().split(' - ')[0];
                    return existingName.toLowerCase() === kegiatanName.toLowerCase();
                  }
                    return !itemIsWK && !itemIsKeg;
                  })
                  .map(x => x.id);

                if (idsToDelete.length > 0) {
                  const { error: delErr } = await supabase.from('daily_attendances').delete().in('id', idsToDelete);
                  if (delErr) throw delErr;
                }
              }
            }
            syncedCount++;
          } else {
            const attendances = item.data;
            const studentIds = attendances.map((a: any) => a.student_id);
            const date = attendances[0]?.tanggal;
            const modeStr = attendances[0]?.keterangan?.startsWith('[WK]') ? 'walikelas' 
                  : attendances[0]?.keterangan?.startsWith('[KEG]') ? 'kegiatan'
                  : 'mapel';
            if (date) {
              const { data: existing, error: fetchErr } = await supabase
                .from('daily_attendances')
                .select('id, keterangan')
                .eq('tanggal', date)
                .in('student_id', studentIds);
              if (!fetchErr && existing && existing.length > 0) {
                const idsToDelete = existing
                  .filter(x => {
                    const itemIsWK = x.keterangan && x.keterangan.startsWith('[WK]');
                    const itemIsKeg = x.keterangan && x.keterangan.startsWith('[KEG]');
                    if (modeStr === 'walikelas') return itemIsWK;
                    if (modeStr === 'kegiatan') {
                if (!itemIsKeg) return false;
                // Only delete if the kegiatan name matches
                const existingName = x.keterangan.substring(5).trim().split(' - ')[0];
                const newName = attendances[0]?.keterangan?.substring(5).trim().split(' - ')[0];
                return existingName.toLowerCase() === (newName || '').toLowerCase();
              }
                    return !itemIsWK && !itemIsKeg;
                  })
                  .map(x => x.id);

                if (idsToDelete.length > 0) {
                  await supabase.from('daily_attendances').delete().in('id', idsToDelete);
                }
              }
            }

            const { error } = await supabase.from('daily_attendances').insert(attendances);
            if (error) throw error;
            syncedCount++;
          }
        } else if (item.type === 'grades') {
          const grades = item.data;
          if (grades.length > 0) {
            const { class_id, mapel, tipe_nilai, semester } = grades[0];
            const { error: delErr } = await supabase.from('student_grades')
              .delete()
              .eq('class_id', class_id)
              .eq('mapel', mapel)
              .eq('tipe_nilai', tipe_nilai)
              .eq('semester', semester);
            if (delErr) throw delErr;
            
            const { error: insErr } = await supabase.from('student_grades').insert(grades);
            if (insErr) throw insErr;
          }
          syncedCount++;
        } else if (item.type === 'holiday') {
          const holiday = item.data;
          const { error } = await supabase.from('academic_calendars').upsert([holiday]);
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'schedule') {
          const schedule = item.data;
          const { error } = await supabase.from('class_schedules').upsert([schedule]);
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'announcement') {
          const announcement = item.data;
          const { error } = await supabase.from('announcements').upsert([announcement]);
          if (error) throw error;
          syncedCount++;
        } else if (item.type === 'counseling') {
          const record = item.data;
          const { error } = await supabase.from('counseling_records').upsert([record]);
          if (error) throw error;
          syncedCount++;
        }
      } catch (err: any) {
        console.warn('Failed to sync offline queue item:', item, err);
        errors.push(`Gagal sinkronisasi "${item.description}": ${err?.message || 'Kesalahan jaringan'}`);
        remainingQueue.push(item);
      }
    }

    OfflineQueue.saveQueue(remainingQueue);

    return {
      success: errors.length === 0,
      syncedCount,
      errors
    };
  },

  // ---------------- TEACHERS CRUD ----------------
  async getTeachers(): Promise<TeacherProfile[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('teachers_profile').select('*').order('nama_lengkap', { ascending: true });
        if (error) throw error;
        return (data || []) as TeacherProfile[];
      } catch (err) {
        console.warn('Supabase error fetching teachers, falling back to Local Storage', err);
        return LocalDB.getTeachers();
      }
    }
    return LocalDB.getTeachers();
  },

  async getTeacherById(id: string): Promise<TeacherProfile | null> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('teachers_profile')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw error;
        return data as TeacherProfile | null;
      } catch (err) {
        console.warn('Supabase error fetching teacher by id:', err);
      }
    }
    const teachers = LocalDB.getTeachers();
    return teachers.find(t => t.id === id) || null;
  },

  async createTeacher(
    teacher: Omit<TeacherProfile, 'id'>,
    email?: string,
    password?: string
  ): Promise<TeacherProfile> {
    const isSupabase = activeStorageMode === 'supabase';
    
    let authUserId: string | null = null;
    if (isSupabase && email && password) {
      try {
        const { data: authData, error: authError } = await tempSupabase.auth.signUp({
          email,
          password
        });
        if (authError) throw authError;
        if (authData.user) {
          authUserId = authData.user.id;
        }
      } catch (authErr: any) {
        console.warn('Supabase auth error creating user for teacher:', authErr);
        const errMsg = authErr?.message || '';
        if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('rate_limit') || authErr?.status === 429) {
          throw new Error(
            'Batas pendaftaran akun login (rate limit) Supabase terlampaui.\n\n' +
            'Supabase membatasi pendaftaran akun baru dengan email secara beruntun demi keamanan (biasanya maks. 3 email per jam untuk SMTP bawaan).\n\n' +
            'Solusi:\n' +
            '1. Anda dapat mendaftarkan guru ini TANPA mengisi email & password terlebih dahulu (kosongkan kolom kredensial login) agar datanya langsung tersimpan.\n' +
            '2. Nonaktifkan "Confirm email" di dashboard Supabase Anda (Auth -> Providers -> Email -> Confirm email) atau gunakan penyedia email khusus (custom SMTP) untuk menghilangkan batasan ini.'
          );
        }
        throw new Error('Gagal membuat akun login: ' + errMsg);
      }
    }

    const newId = authUserId || (isSupabase ? generateUUID() : 't_' + Math.random().toString(36).substr(2, 9));
    const newTeacher = { ...teacher, id: newId, email: email || teacher.email };

    if (isSupabase) {
      try {
        const { data, error } = await supabase.from('teachers_profile').upsert([newTeacher]).select();
        if (error) {
          const errMsg = error.message || '';
          if (errMsg.includes('email') || errMsg.includes('schema cache')) {
            console.warn('Database missing "email" column in teachers_profile or schema cache stale. Retrying without email column...');
            const { email: _, ...teacherWithoutEmail } = newTeacher;
            const { data: retryData, error: retryError } = await supabase.from('teachers_profile').upsert([teacherWithoutEmail]).select();
            if (retryError) throw retryError;
            if (retryData && retryData[0]) return retryData[0] as TeacherProfile;
          } else {
            throw error;
          }
        } else if (data && data[0]) {
          return data[0] as TeacherProfile;
        }
      } catch (err) {
        console.warn('Supabase error creating teacher, falling back to Local Storage', err);
        throw err; // Throw the error so the UI can display it
      }
    }
    const current = LocalDB.getTeachers();
    current.push(newTeacher);
    LocalDB.setTeachers(current);
    return newTeacher;
  },

  async updateTeacher(id: string, updates: Partial<TeacherProfile>): Promise<TeacherProfile> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('teachers_profile').update(updates).eq('id', id).select();
        if (error) {
          const errMsg = error.message || '';
          if (errMsg.includes('email') || errMsg.includes('schema cache')) {
            console.warn('Database missing "email" column in teachers_profile or schema cache stale. Retrying update without email column...');
            const { email: _, ...updatesWithoutEmail } = updates;
            const { data: retryData, error: retryError } = await supabase.from('teachers_profile').update(updatesWithoutEmail).eq('id', id).select();
            if (retryError) throw retryError;
            if (retryData && retryData[0]) return retryData[0] as TeacherProfile;
          } else {
            throw error;
          }
        } else if (data && data[0]) {
          return data[0] as TeacherProfile;
        }
      } catch (err) {
        console.warn('Supabase error updating teacher, falling back to Local Storage', err);
      }
    }
    const current = LocalDB.getTeachers();
    const index = current.findIndex(t => t.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      LocalDB.setTeachers(current);
      return current[index];
    }
    throw new Error('Teacher not found');
  },

  async deleteTeacher(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        // Unset walikelas_id in classes to prevent foreign key constraint violation
        const { error: err1 } = await supabase.from('classes').update({ walikelas_id: null }).eq('walikelas_id', id);
        if (err1) throw new Error(`Gagal memperbarui kelas: ${err1.message}`);
        
        // Unset recorded_by in daily_attendances to prevent foreign key constraint violation
        const { error: err2 } = await supabase.from('daily_attendances').update({ recorded_by: null }).eq('recorded_by', id);
        if (err2) throw new Error(`Gagal memperbarui absensi: ${err2.message}`);

        // Unset recorded_by in teaching_journals to prevent foreign key constraint violation
        const { error: err3 } = await supabase.from('teaching_journals').update({ recorded_by: null }).eq('recorded_by', id);
        if (err3) throw new Error(`Gagal memperbarui jurnal: ${err3.message}`);

        // Delete the teacher profile
        const { error } = await supabase.from('teachers_profile').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err) {
        console.warn('Supabase error deleting teacher', err);
        throw err;
      }
    }
    const current = LocalDB.getTeachers();
    const filtered = current.filter(t => t.id !== id);
    LocalDB.setTeachers(filtered);

    // Also unset walikelas in local classes
    const classes = LocalDB.getClasses();
    const updatedClasses = classes.map(c => c.walikelas_id === id ? { ...c, walikelas_id: null as any } : c);
    LocalDB.setClasses(updatedClasses);
  },

  // ---------------- CLASSES CRUD ----------------
  async getClasses(): Promise<ClassRoom[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('classes').select('*').order('nama_kelas', { ascending: true });
        if (error) throw error;
        return (data || []) as ClassRoom[];
      } catch (err) {
        console.warn('Supabase error fetching classes, falling back to Local Storage', err);
        return LocalDB.getClasses();
      }
    }
    return LocalDB.getClasses();
  },

  async createClass(classroom: Omit<ClassRoom, 'id'>): Promise<ClassRoom> {
    const newClass = { ...classroom, id: 'c_' + Math.random().toString(36).substr(2, 9) };
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('classes').insert([newClass]).select();
        if (error) throw error;
        if (data && data[0]) return data[0] as ClassRoom;
      } catch (err) {
        console.warn('Supabase error creating class, falling back to Local Storage', err);
      }
    }
    const current = LocalDB.getClasses();
    current.push(newClass);
    LocalDB.setClasses(current);
    return newClass;
  },

  async updateClass(id: string, updates: Partial<ClassRoom>): Promise<ClassRoom> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('classes').update(updates).eq('id', id).select();
        if (error) throw error;
        if (data && data[0]) return data[0] as ClassRoom;
      } catch (err) {
        console.warn('Supabase error updating class, falling back to Local Storage', err);
      }
    }
    const current = LocalDB.getClasses();
    const index = current.findIndex(c => c.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      LocalDB.setClasses(current);
      return current[index];
    }
    throw new Error('Class not found');
  },

  async deleteClass(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        // Unset class_id for students in this class
        const { error: err1 } = await supabase.from('students').update({ class_id: null }).eq('class_id', id);
        if (err1) throw new Error(`Gagal memperbarui siswa kelas: ${err1.message}`);

        // Unset class_id for teaching_journals in this class
        const { error: err2 } = await supabase.from('teaching_journals').update({ class_id: null }).eq('class_id', id);
        if (err2) throw new Error(`Gagal memperbarui jurnal kelas: ${err2.message}`);

        // Delete the class
        const { error } = await supabase.from('classes').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err) {
        console.warn('Supabase error deleting class', err);
        throw err;
      }
    }
    const current = LocalDB.getClasses();
    const filtered = current.filter(c => c.id !== id);
    LocalDB.setClasses(filtered);

    // Also unset class_id in local students
    const students = LocalDB.getStudents();
    const updatedStudents = students.map(s => s.class_id === id ? { ...s, class_id: null as any } : s);
    LocalDB.setStudents(updatedStudents);
  },

  // ---------------- STUDENTS CRUD ----------------
  async getStudents(): Promise<Student[]> {
    let list: Student[] = [];
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('students').select('*').order('nama_siswa', { ascending: true });
        if (error) throw error;
        list = (data || []) as Student[];
      } catch (err) {
        console.warn('Supabase error fetching students, falling back to Local Storage', err);
        list = LocalDB.getStudents();
      }
    } else {
      list = LocalDB.getStudents();
    }

    const safeList = list || [];
    const phones = this.getStudentPhones();
    return safeList.map(s => ({
      ...s,
      no_hp_orang_tua: phones[s.id] || ''
    }));
  },

  async createStudent(student: Omit<Student, 'id'>): Promise<Student> {
    const phone = student.no_hp_orang_tua || '';
    const { no_hp_orang_tua, ...dbInput } = student as any;
    const newStudent = { ...dbInput, id: 's_' + Math.random().toString(36).substr(2, 9) };

    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('students').insert([newStudent]).select();
        if (error) throw error;
        if (data && data[0]) {
          const created = data[0] as Student;
          if (phone) this.saveStudentPhone(created.id, phone);
          return { ...created, no_hp_orang_tua: phone };
        }
      } catch (err) {
        console.warn('Supabase error creating student, falling back to Local Storage', err);
      }
    }
    const current = LocalDB.getStudents();
    current.push(newStudent);
    LocalDB.setStudents(current);
    if (phone) this.saveStudentPhone(newStudent.id, phone);
    return { ...newStudent, no_hp_orang_tua: phone };
  },

  async bulkInsertStudents(students: Omit<Student, 'id'>[]): Promise<Student[]> {
    const rawStudents = students.map(s => {
      const { no_hp_orang_tua, ...rest } = s as any;
      return rest;
    });

    const newStudents = rawStudents.map(s => ({
      ...s,
      id: 's_' + Math.random().toString(36).substr(2, 9)
    }));

    // Save phone numbers locally
    students.forEach((s, idx) => {
      const phone = (s as any).no_hp_orang_tua || (s as any)['No HP Orang Tua'] || (s as any)['no_hp_orang_tua'] || '';
      if (phone) {
        this.saveStudentPhone(newStudents[idx].id, String(phone));
      }
    });

    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('students').insert(newStudents);
        if (error) throw error;
        return newStudents.map(s => ({
          ...s,
          no_hp_orang_tua: this.getStudentPhone(s.id)
        }));
      } catch (err: any) {
        console.warn('Supabase error bulk inserting students, falling back to Local Storage', err);
        if (err?.code === '23505' || err?.status === 409 || err?.message?.toLowerCase().includes('duplicate') || err?.message?.toLowerCase().includes('conflict')) {
           throw new Error("Gagal menyimpan ke server: Terdapat NISN duplikat di dalam database.");
        }
      }
    }
    const current = LocalDB.getStudents();
    const updated = [...current, ...newStudents];
    LocalDB.setStudents(updated);
    return newStudents.map(s => ({
      ...s,
      no_hp_orang_tua: this.getStudentPhone(s.id)
    }));
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    const phone = updates.no_hp_orang_tua;
    if (phone !== undefined) {
      this.saveStudentPhone(id, phone);
    }
    const { no_hp_orang_tua, ...dbUpdates } = updates as any;

    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('students').update(dbUpdates).eq('id', id).select();
        if (error) throw error;
        if (data && data[0]) {
          return {
            ...data[0],
            no_hp_orang_tua: phone !== undefined ? phone : this.getStudentPhone(id)
          } as Student;
        }
      } catch (err) {
        console.warn('Supabase error updating student, falling back to Local Storage', err);
      }
    }
    const current = LocalDB.getStudents();
    const index = current.findIndex(s => s.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...dbUpdates };
      LocalDB.setStudents(current);
      return {
        ...current[index],
        no_hp_orang_tua: phone !== undefined ? phone : this.getStudentPhone(id)
      };
    }
    throw new Error('Student not found');
  },

  async deleteStudent(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        // Delete associated attendances
        const { error: err1 } = await supabase.from('daily_attendances').delete().eq('student_id', id);
        if (err1) throw new Error(`Gagal menghapus riwayat presensi siswa: ${err1.message}`);

        // Delete the student
        const { error } = await supabase.from('students').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err) {
        console.warn('Supabase error deleting student', err);
        throw err;
      }
    }
    const current = LocalDB.getStudents();
    const filtered = current.filter(s => s.id !== id);
    LocalDB.setStudents(filtered);

    // Also delete attendances locally
    const attendances = LocalDB.getAttendances();
    const filteredAttendances = attendances.filter(a => a.student_id !== id);
    LocalDB.setAttendances(filteredAttendances);
  },

  // ---------------- ATTENDANCES CRUD ----------------
  async getAttendances(date?: string): Promise<DailyAttendance[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const range = getAcademicYearRange();
        let query = supabase.from('daily_attendances').select('*')
          .gte('tanggal', range.start)
          .lte('tanggal', range.end);
        if (date) {
          query = query.eq('tanggal', date);
        }
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as DailyAttendance[];
      } catch (err) {
        console.warn('Supabase error fetching attendances, falling back to Local Storage', err);
        const list = LocalDB.getAttendances();
        if (date) {
          return list.filter(a => a.tanggal === date);
        }
        return list;
      }
    }
    const list = LocalDB.getAttendances();
    if (date) {
      return list.filter(a => a.tanggal === date);
    }
    return list;
  },

  
  async deleteAttendances(studentIds: string[], date: string, mode: 'walikelas' | 'mapel' | 'kegiatan' = 'mapel', kegiatanName?: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data: existing, error: fetchErr } = await supabase
          .from('daily_attendances')
          .select('id, keterangan')
          .eq('tanggal', date)
          .in('student_id', studentIds);
        
        if (fetchErr) throw fetchErr;

        if (existing && existing.length > 0) {
          const idsToDelete = existing
            .filter(item => {
              const itemIsWK = item.keterangan && item.keterangan.startsWith('[WK]');
              const itemIsKeg = item.keterangan && item.keterangan.startsWith('[KEG]');
              if (mode === 'walikelas') return itemIsWK;
              if (mode === 'kegiatan') {
                if (!itemIsKeg) return false;
                if (!kegiatanName) return true;
                const existingName = item.keterangan.substring(5).trim().split(' - ')[0];
                return existingName.toLowerCase() === kegiatanName.toLowerCase();
              }
              return !itemIsWK && !itemIsKeg;
            })
            .map(item => item.id);

          if (idsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('daily_attendances')
              .delete()
              .in('id', idsToDelete);
            if (delErr) throw delErr;
          }
        }
      } catch (err) {
        console.warn('Supabase error deleting attendances, falling back to Local Storage', err);
        const typeStr = mode === 'walikelas' ? 'Wali Kelas' : mode === 'kegiatan' ? 'Kegiatan' : 'Guru Mapel';
        const desc = `Hapus Presensi ${typeStr} - Tanggal ${date}`;
        OfflineQueue.add('attendance', 'delete', {studentIds, date, mode, kegiatanName}, desc);
      }
    }

    // Local DB logic
    const current = LocalDB.getAttendances();
    const filtered = current.filter(a => {
      const isSameStudentAndDate = a.tanggal === date && studentIds.includes(a.student_id);
      if (!isSameStudentAndDate) return true; // keep
      
      const itemIsWK = a.keterangan && a.keterangan.startsWith('[WK]');
      const itemIsKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
      if (mode === 'walikelas') return !itemIsWK;
      if (mode === 'kegiatan') {
        if (!itemIsKeg) return true;
        if (!kegiatanName) return false; // delete all if no name provided
        const existingName = a.keterangan.substring(5).trim().split(' - ')[0];
        return existingName.toLowerCase() !== kegiatanName.toLowerCase(); // keep if name doesn't match
      }
      return itemIsWK || itemIsKeg; // if mode is mapel, we delete mapel, so we keep WK and KEG
    });

    LocalDB.setAttendances(filtered);
  },

  async saveAttendances(attendances: Omit<DailyAttendance, 'id'>[]): Promise<DailyAttendance[]> {
    const processed = attendances.map(att => {
      return {
        ...att,
        id: 'att_' + Math.random().toString(36).substr(2, 9)
      };
    });

    const studentIds = attendances.map(a => a.student_id);
    const date = attendances[0]?.tanggal;
    const modeStr = attendances[0]?.keterangan?.startsWith('[WK]') ? 'walikelas' 
                  : attendances[0]?.keterangan?.startsWith('[KEG]') ? 'kegiatan'
                  : 'mapel';

    if (activeStorageMode === 'supabase' && date) {
      try {
        // 1. Fetch existing attendances on this date for these students
        const { data: existing, error: fetchErr } = await supabase
          .from('daily_attendances')
          .select('id, keterangan')
          .eq('tanggal', date)
          .in('student_id', studentIds);
          
        if (fetchErr) throw fetchErr;

        if (existing && existing.length > 0) {
          // 2. Identify IDs of the same type to delete
          const idsToDelete = existing
            .filter(item => {
              const itemIsWK = item.keterangan && item.keterangan.startsWith('[WK]');
              const itemIsKeg = item.keterangan && item.keterangan.startsWith('[KEG]');
              if (modeStr === 'walikelas') return itemIsWK;
              if (modeStr === 'kegiatan') {
                if (!itemIsKeg) return false;
                // Only delete if the kegiatan name matches
                const existingName = item.keterangan.substring(5).trim().split(' - ')[0];
                const newName = attendances[0]?.keterangan?.substring(5).trim().split(' - ')[0];
                return existingName.toLowerCase() === (newName || '').toLowerCase();
              }
              return !itemIsWK && !itemIsKeg;
            })
            .map(item => item.id);

          if (idsToDelete.length > 0) {
            const { error: delErr } = await supabase
              .from('daily_attendances')
              .delete()
              .in('id', idsToDelete);
            if (delErr) throw delErr;
          }
        }

        // 3. Insert new records
        const { data, error } = await supabase.from('daily_attendances').insert(processed).select();
        if (error) throw error;
        if (data) return data as DailyAttendance[];
      } catch (err) {
        console.warn('Supabase error saving attendances, falling back to Local Storage', err);
        const typeStr = modeStr === 'walikelas' ? 'Wali Kelas' : modeStr === 'kegiatan' ? 'Kegiatan' : 'Guru Mapel';
        const desc = `Presensi ${typeStr} - Tanggal ${date}`;
        OfflineQueue.add('attendance', 'save', processed, desc);
      }
    }

    // Local DB logic
    const current = LocalDB.getAttendances();
    if (date) {
      // Filter out only existing ones of the SAME type
      const filtered = current.filter(a => {
        const isSameStudentAndDate = a.tanggal === date && studentIds.includes(a.student_id);
        if (!isSameStudentAndDate) return true; // keep other students or dates
        
        const itemIsWK = a.keterangan && a.keterangan.startsWith('[WK]');
        const itemIsKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
        const isTargetMode = modeStr === 'walikelas' ? itemIsWK : modeStr === 'kegiatan' ? itemIsKeg : (!itemIsWK && !itemIsKeg);
        return !isTargetMode;
      });

      const updated = [...filtered, ...processed];
      LocalDB.setAttendances(updated);
    }
    return processed as DailyAttendance[];
  },

  // ---------------- TEACHING JOURNALS CRUD ----------------
  async getJournals(): Promise<TeachingJournal[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const range = getAcademicYearRange();
        const { data, error } = await supabase.from('teaching_journals').select('*')
          .gte('tanggal', range.start)
          .lte('tanggal', range.end)
          .order('tanggal', { ascending: false });
        if (error) throw error;
        return (data || []).map(parseLegacyJournal);
      } catch (err) {
        console.warn('Supabase error fetching teaching journals, falling back to Local Storage', err);
        return LocalDB.getJournals();
      }
    }
    return LocalDB.getJournals();
  },

  async createJournal(journal: Omit<TeachingJournal, 'id'>): Promise<TeachingJournal> {
    const newJournal = { ...journal, id: 'j_' + Math.random().toString(36).substr(2, 9) };
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('teaching_journals').insert([newJournal]).select();
        if (error) {
          const errMsg = error.message || '';
          // Check for missing column / schema cache stale error
          if (
            errMsg.includes('column') ||
            errMsg.includes('schema cache') ||
            error.code === 'PGRST204'
          ) {
            console.warn('Database missing detailed columns in teaching_journals. Retrying insert with standard columns only...');
            
            // Format detailed fields into the keterangan column so no data is lost!
            const detailedKeterangan = [
              newJournal.keterangan || '',
              newJournal.jam_ke ? `[Jam Ke: ${newJournal.jam_ke}]` : '',
              newJournal.siswa_absen ? `[Siswa Absen: ${newJournal.siswa_absen}]` : '',
              newJournal.media_pembelajaran ? `[Media: ${newJournal.media_pembelajaran}]` : '',
              newJournal.hambatan_solusi ? `[Hambatan & Solusi: ${newJournal.hambatan_solusi}]` : '',
              newJournal.journal_type ? `[Tipe: ${newJournal.journal_type}]` : ''
            ].filter(Boolean).join('\n');

            // Construct standard journal record (only columns guaranteed to exist in the original schema)
            const standardJournal = {
              id: newJournal.id,
              tanggal: newJournal.tanggal,
              class_id: newJournal.class_id,
              mapel: newJournal.mapel,
              materi: newJournal.materi,
              keterangan: detailedKeterangan,
              recorded_by: newJournal.recorded_by
            };

            const { data: retryData, error: retryError } = await supabase
              .from('teaching_journals')
              .insert([standardJournal])
              .select();

            if (retryError) throw retryError;
            
            if (retryData && retryData[0]) {
              return {
                ...newJournal,
                id: retryData[0].id
              } as TeachingJournal;
            }
          }
          throw error;
        }
        if (data && data[0]) return parseLegacyJournal(data[0]);
      } catch (err) {
        console.warn('Supabase error creating journal, falling back to Local Storage', err);
        const desc = `Jurnal ${newJournal.mapel} (${newJournal.tanggal})`;
        OfflineQueue.add('journal', 'create', newJournal, desc);
      }
    }
    const current = LocalDB.getJournals();
    current.push(newJournal);
    LocalDB.setJournals(current);
    return newJournal;
  },

  
  async updateJournal(id: string, updates: Partial<TeachingJournal>): Promise<TeachingJournal> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('teaching_journals')
          .update(updates)
          .eq('id', id)
          .select();
        if (error) throw error;
        if (data && data[0]) return parseLegacyJournal(data[0]);
      } catch (err) {
        console.warn('Supabase error updating journal:', err);
        // Fallback to local
      }
    }
    const current = LocalDB.getJournals();
    const index = current.findIndex(j => j.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      LocalDB.setJournals(current);
      return current[index];
    }
    throw new Error('Journal not found');
  },

  async deleteGrades(classId: string, mapel: string, tipeNilai: string, semester: string, recordedBy: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('student_grades')
          .delete()
          .eq('class_id', classId)
          .eq('mapel', mapel)
          .eq('tipe_nilai', tipeNilai)
          .eq('semester', semester)
          .eq('recorded_by', recordedBy);
        if (error) throw new Error(error.message);
        return;
      } catch (err) {
        console.warn('Supabase error deleting grades', err);
        throw err;
      }
    }
    
    // Local delete
    let grades = LocalDB.getGrades();
    grades = grades.filter(g => 
      !(g.class_id === classId && 
        g.mapel === mapel && 
        g.tipe_nilai === tipeNilai && 
        g.semester === semester && 
        g.recorded_by === recordedBy)
    );
    LocalDB.save('gurupro_student_grades', grades);
    OfflineQueue.add('grade', 'delete', { class_id: classId, mapel, tipe_nilai: tipeNilai, semester, recorded_by: recordedBy }, 'Hapus Data Nilai');
  },

  async deleteJournal(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('teaching_journals').delete().eq('id', id);
        if (error) throw new Error(error.message);
        return;
      } catch (err) {
        console.warn('Supabase error deleting journal', err);
        throw err;
      }
    }
    const current = LocalDB.getJournals();
    const filtered = current.filter(j => j.id !== id);
    LocalDB.setJournals(filtered);
  },

  // ---------------- GRADES CRUD ----------------
  async getGrades(classId?: string, mapel?: string): Promise<StudentGrade[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const range = getAcademicYearRange();
        let query = supabase.from('student_grades').select('*');
        if (classId) query = query.eq('class_id', classId);
        if (mapel) query = query.eq('mapel', mapel);
        const { data, error } = await query;
        if (error) throw error;
        return (data || []) as StudentGrade[];
      } catch (err) {
        console.warn('Supabase error fetching grades, falling back to Local Storage', err);
        const list = LocalDB.getGrades();
        return list.filter(g => {
          if (classId && g.class_id !== classId) return false;
          if (mapel && g.mapel !== mapel) return false;
          return true;
        });
      }
    }
    const list = LocalDB.getGrades();
    return list.filter(g => {
      if (classId && g.class_id !== classId) return false;
      if (mapel && g.mapel !== mapel) return false;
      return true;
    });
  },

  async saveGrades(grades: Omit<StudentGrade, 'id' | 'created_at'>[]): Promise<StudentGrade[]> {
    const processed = grades.map(g => ({
      ...g,
      id: 'g_' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    }));

    let fallbackWarning = null;

    if (activeStorageMode === 'supabase') {
      try {
        if (grades.length > 0) {
          const { class_id, mapel, tipe_nilai, semester } = grades[0];
          const { error: delErr } = await supabase.from('student_grades')
            .delete()
            .eq('class_id', class_id)
            .eq('mapel', mapel)
            .eq('tipe_nilai', tipe_nilai)
            .eq('semester', semester);
          if (delErr) throw delErr;
        }

        const { data, error } = await supabase.from('student_grades').insert(processed).select();
        if (error) throw error;
        return data as StudentGrade[];
      } catch (err: any) {
        console.warn('Supabase error saving grades, falling back to Local Storage', err);
        // Only queue if it's not empty grades
        if (grades.length > 0) {
          const { mapel, tipe_nilai } = grades[0];
          const desc = `Nilai ${mapel} - ${tipe_nilai}`;
          // Queue the grades payload
          OfflineQueue.add('grades' as any, 'save', processed, desc);
        }
        
        if (err.message && err.message.includes('student_grades')) {
          fallbackWarning = 'Tabel "student_grades" belum dibuat di Supabase. Nilai sementara disimpan di penyimpanan lokal browser Anda.';
        }
      }
    }

    const current = LocalDB.getGrades();
    if (grades.length > 0) {
      const { class_id, mapel, tipe_nilai, semester } = grades[0];
      const filtered = current.filter(g => 
        !(g.class_id === class_id && g.mapel === mapel && g.tipe_nilai === tipe_nilai && g.semester === semester)
      );
      LocalDB.setGrades([...filtered, ...processed] as StudentGrade[]);
    }
    
    if (fallbackWarning) {
      throw new Error(fallbackWarning);
    }
    
    return processed as StudentGrade[];
  },

  // ---------------- AUTHENTICATION ----------------
  async signIn(email: string, password: string): Promise<{ id: string; email: string; profile: TeacherProfile; mode: 'supabase' | 'local'; fallbackError?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Pengguna tidak ditemukan.');
      }

      // Fetch the profile
      const { data: profile, error: profileError } = await supabase
        .from('teachers_profile')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error('Gagal memuat profil guru: ' + profileError.message);
      }

      if (!profile) {
        // If profile doesn't exist, we can try to find by email or create a default one
        const defaultProfile: TeacherProfile = {
          id: authData.user.id,
          nip: '1234567890',
          nama_lengkap: email.split('@')[0],
          role: 'guru',
          mapel: 'Umum'
        };
        
        const { error: insertError } = await supabase.from('teachers_profile').insert([defaultProfile]);
        if (!insertError) {
          return {
            id: authData.user.id,
            email: authData.user.email || email,
            profile: defaultProfile,
            mode: 'supabase'
          };
        }
        throw new Error('Profil guru belum terdaftar di database.');
      }

      return {
        id: authData.user.id,
        email: authData.user.email || email,
        profile: profile as TeacherProfile,
        mode: 'supabase'
      };
    } catch (err: any) {
      console.warn('Falling back to local login mode due to error:', err.message);
      
      const localTeachers = LocalDB.getTeachers();
      // Try to find by exact email first, then NIP, then username prefix
      const username = email.split('@')[0].toLowerCase();
      let found = localTeachers.find(t => 
        (t.email && t.email.toLowerCase() === email.toLowerCase()) ||
        t.nip === username ||
        t.nama_lengkap.toLowerCase().includes(username) ||
        (t.nip && username.includes(t.nip))
      );
      
      if (!found) {
        // Create profile dynamically to never block any valid user
        const isDefaultAdmin = email.includes('admin') || username.includes('admin');
        const role: UserRole = isDefaultAdmin ? 'admin' : 'guru';
        found = {
          id: generateUUID(),
          nip: '1985' + Math.floor(Math.random() * 1000000000),
          nama_lengkap: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          role,
          mapel: role === 'guru' ? 'Umum' : undefined,
          email: email
        };
        localTeachers.push(found);
        LocalDB.setTeachers(localTeachers);
      }

      return {
        id: found.id,
        email,
        profile: found,
        mode: 'local',
        fallbackError: err.message
      };
    }
  },

  async signUp(email: string, password: string, profileData: Omit<TeacherProfile, 'id'>): Promise<{ id: string; email: string; profile: TeacherProfile; mode: 'supabase' | 'local'; fallbackError?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      });

      if (authError) {
        console.warn('Supabase auth signUp error, falling back to local creation:', authError.message);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('Registrasi gagal.');
      }

      const newProfile: TeacherProfile = {
        ...profileData,
        id: authData.user.id
      };

      let { error: insertError } = await supabase.from('teachers_profile').upsert([newProfile]);
      if (insertError) {
        const errMsg = insertError.message || '';
        if (errMsg.includes('email') || errMsg.includes('schema cache')) {
          console.warn('Database missing "email" column in teachers_profile or schema cache stale. Retrying profile creation without email...');
          const { email: _, ...profileWithoutEmail } = newProfile;
          const { error: retryError } = await supabase.from('teachers_profile').upsert([profileWithoutEmail]);
          if (retryError) {
            throw new Error('Registrasi berhasil, tetapi gagal menyimpan profil guru: ' + retryError.message);
          }
        } else {
          throw new Error('Registrasi berhasil, tetapi gagal menyimpan profil guru: ' + insertError.message);
        }
      }

      return {
        id: authData.user.id,
        email: authData.user.email || email,
        profile: newProfile,
        mode: 'supabase'
      };
    } catch (err: any) {
      console.warn('Falling back to local registration mode due to error:', err.message);
      
      const localTeachers = LocalDB.getTeachers();
      const existing = localTeachers.find(t => 
        t.nip === profileData.nip || 
        (t.email && t.email.toLowerCase() === email.toLowerCase())
      );
      if (existing) {
        return {
          id: existing.id,
          email,
          profile: existing,
          mode: 'local',
          fallbackError: err.message
        };
      }

      const newId = generateUUID();
      const newProfile: TeacherProfile = {
        ...profileData,
        id: newId
      };
      
      localTeachers.push(newProfile);
      LocalDB.setTeachers(localTeachers);

      return {
        id: newId,
        email,
        profile: newProfile,
        mode: 'local',
        fallbackError: err.message
      };
    }
  },

  // ---------------- ACADEMIC CALENDAR ----------------
  async getHolidays(): Promise<any[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('academic_calendars').select('*').order('tanggal', { ascending: true });
        if (error) throw error;
        
        const offlineData = OfflineQueue.getQueue().filter(q => q.type === 'holiday').map(q => q.data);
        const combined = [...(data || []), ...offlineData];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        unique.sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
        return unique;
      } catch (err) {
        console.warn('Supabase error fetching holidays:', err);
        return LocalDB.getHolidays();
      }
    }
    return LocalDB.getHolidays();
  },

  async saveHoliday(holiday: any): Promise<void> {
    const processed = {
      ...holiday,
      id: holiday.id || 'hol_' + Math.random().toString(36).substr(2, 9),
      created_at: holiday.created_at || new Date().toISOString()
    };

    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('academic_calendars').upsert([processed]);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error saving holiday:', err);
        OfflineQueue.add('holiday', 'save', processed, `Menyimpan kalender ${processed.tanggal}`);
      }
    }

    const current = LocalDB.getHolidays();
    const index = current.findIndex(h => h.id === processed.id);
    if (index >= 0) {
      current[index] = processed;
    } else {
      current.push(processed);
    }
    LocalDB.setHolidays(current);
  },

  async deleteHoliday(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('academic_calendars').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error deleting holiday:', err);
      }
    }
    const current = LocalDB.getHolidays();
    const filtered = current.filter(h => h.id !== id);
    LocalDB.setHolidays(filtered);
  },

  // ---------------- CLASS SCHEDULES ----------------
  async getSchedules(): Promise<any[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('class_schedules').select('*');
        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn('Supabase error fetching schedules:', err);
        return LocalDB.getSchedules();
      }
    }
    return LocalDB.getSchedules();
  },

  async saveSchedule(schedule: any): Promise<void> {
    const processed = {
      ...schedule,
      id: schedule.id || 'sch_' + Math.random().toString(36).substr(2, 9),
      created_at: schedule.created_at || new Date().toISOString()
    };

    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('class_schedules').upsert([processed]);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error saving schedule:', err);
        OfflineQueue.add('schedule', 'save', processed, `Menyimpan jadwal ${processed.mapel}`);
      }
    }

    const current = LocalDB.getSchedules();
    const index = current.findIndex(s => s.id === processed.id);
    if (index >= 0) {
      current[index] = processed;
    } else {
      current.push(processed);
    }
    LocalDB.setSchedules(current);
  },

  async deleteSchedule(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('class_schedules').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error deleting schedule:', err);
      }
    }
    const current = LocalDB.getSchedules();
    const filtered = current.filter(s => s.id !== id);
    LocalDB.setSchedules(filtered);
  },

  // ---------------- ANNOUNCEMENTS ----------------
  async getAnnouncements(): Promise<any[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        
        const offlineData = OfflineQueue.getQueue().filter(q => q.type === 'announcement').map(q => q.data);
        const combined = [...(data || []), ...offlineData];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        return unique;
      } catch (err) {
        console.warn('Supabase error fetching announcements:', err);
        return LocalDB.getAnnouncements();
      }
    }
    return LocalDB.getAnnouncements();
  },

  async saveAnnouncement(announcement: any): Promise<void> {
    const processed = {
      ...announcement,
      id: announcement.id || 'ann_' + Math.random().toString(36).substr(2, 9),
      created_at: announcement.created_at || new Date().toISOString()
    };

    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('announcements').upsert([processed]);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error saving announcement:', err);
        OfflineQueue.add('announcement', 'save', processed, `Menyimpan pengumuman ${processed.title}`);
      }
    }

    const current = LocalDB.getAnnouncements();
    const index = current.findIndex(a => a.id === processed.id);
    if (index >= 0) {
      current[index] = processed;
    } else {
      current.push(processed);
    }
    LocalDB.setAnnouncements(current);
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error deleting announcement:', err);
      }
    }
    const current = LocalDB.getAnnouncements();
    const filtered = current.filter(a => a.id !== id);
    LocalDB.setAnnouncements(filtered);
  },

  // ---------------- COUNSELING ----------------
  async getCounselingRecords(): Promise<any[]> {
    if (activeStorageMode === 'supabase') {
      try {
        const range = getAcademicYearRange();
        const { data, error } = await supabase.from('counseling_records').select('*')
          .gte('tanggal', range.start)
          .lte('tanggal', range.end)
          .order('tanggal', { ascending: false });
        if (error) throw error;
        
        const offlineData = OfflineQueue.getQueue().filter(q => q.type === 'counseling').map(q => q.data);
        const combined = [...(data || []), ...offlineData];
        // Remove duplicates preferring offline data (newer)
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        unique.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        return unique;
      } catch (err) {
        console.warn('Supabase error fetching counseling records:', err);
        return LocalDB.getCounselingRecords();
      }
    }
    return LocalDB.getCounselingRecords();
  },

  async saveCounselingRecord(record: any): Promise<void> {
    const processed = {
      ...record,
      id: record.id || 'coun_' + Math.random().toString(36).substr(2, 9),
      created_at: record.created_at || new Date().toISOString()
    };

    // Jika foto kosong, hapus property-nya agar tidak error di Supabase jika kolom belum dibuat
    if (!processed.foto) {
      delete processed.foto;
    }

    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('counseling_records').upsert([processed]);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error saving counseling record:', err);
        OfflineQueue.add('counseling', 'save', processed, `Menyimpan catatan konseling`);
      }
    }

    const current = LocalDB.getCounselingRecords();
    const index = current.findIndex(r => r.id === processed.id);
    if (index >= 0) {
      current[index] = processed;
    } else {
      current.push(processed);
    }
    LocalDB.setCounselingRecords(current);
  },

  async deleteCounselingRecord(id: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const { error } = await supabase.from('counseling_records').delete().eq('id', id);
        if (error) throw error;
        return;
      } catch (err) {
        console.warn('Supabase error deleting counseling record:', err);
      }
    }
    const current = LocalDB.getCounselingRecords();
    const filtered = current.filter(r => r.id !== id);
    LocalDB.setCounselingRecords(filtered);
  },

  async getGlobalSchedule(): Promise<any> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('global_schedules').select('*').eq('id', 'global_sch_1').single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      } catch (err) {
        console.warn('Supabase error fetching global schedule:', err);
        return LocalDB.getGlobalSchedule();
      }
    }
    return LocalDB.getGlobalSchedule();
  },

  async getGlobalSchedule2(): Promise<any> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('global_schedules').select('*').eq('id', 'global_sch_2').single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      } catch (err) {
        console.warn('Supabase error fetching global schedule 2:', err);
        return LocalDB.getGlobalSchedule2();
      }
    }
    return LocalDB.getGlobalSchedule2();
  },

  async setGlobalSchedule(schedule: any): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        if (!schedule) {
          const { error } = await supabase.from('global_schedules').delete().eq('id', 'global_sch_1');
          if (error) throw error;
        } else {
          const payload = { id: 'global_sch_1', ...schedule };
          const { error } = await supabase.from('global_schedules').upsert([payload]);
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Supabase error saving global schedule:', err);
        OfflineQueue.add('schedule', schedule ? 'save' : 'delete', { id: 'global_sch_1', ...schedule }, 'Update Jadwal Global');
      }
    }
    LocalDB.setGlobalSchedule(schedule);
  },

  async setGlobalSchedule2(schedule: any): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        if (!schedule) {
          const { error } = await supabase.from('global_schedules').delete().eq('id', 'global_sch_2');
          if (error) throw error;
        } else {
          const payload = { id: 'global_sch_2', ...schedule };
          const { error } = await supabase.from('global_schedules').upsert([payload]);
          if (error) throw error;
        }
      } catch (err) {
        console.warn('Supabase error saving global schedule 2:', err);
        OfflineQueue.add('schedule', schedule ? 'save' : 'delete', { id: 'global_sch_2', ...schedule }, 'Update Jadwal Global 2');
      }
    }
    LocalDB.setGlobalSchedule2(schedule);
  },

  async getGlobalTahunAjaran(): Promise<string | null> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('global_schedules').select('name').eq('id', 'setting_tahun_ajaran').single();
        if (error && error.code !== 'PGRST116') throw error;
        return data?.name || null;
      } catch (err) {
        console.warn('Supabase error fetching global tahun ajaran:', err);
        return localStorage.getItem('global_tahun_ajaran') || null;
      }
    }
    return localStorage.getItem('global_tahun_ajaran') || null;
  },

  
  async downloadArsipData(teacherId?: string): Promise<void> {
    try {
      const attendances = await this.getAttendances();
      const journals = await this.getJournals();
      const grades = await this.getGrades();
      const counseling = await this.getCounselingRecords();
      
      const filteredAttendances = teacherId ? attendances.filter(a => a.recorded_by === teacherId) : attendances;
      const filteredJournals = teacherId ? journals.filter(j => j.recorded_by === teacherId) : journals;
      const filteredGrades = teacherId ? grades.filter(g => g.recorded_by === teacherId) : grades;
      const filteredCounseling = teacherId ? counseling.filter(c => c.teacher_id === teacherId) : counseling;

      const exportData = {
        tahun_ajaran: typeof window !== 'undefined' ? localStorage.getItem('gurupro_tahun_ajaran') : '',
        timestamp: new Date().toISOString(),
        teacher_id: teacherId || 'ALL',
        data: {
          absensi: filteredAttendances,
          jurnal: filteredJournals,
          nilai: filteredGrades,
          konseling: filteredCounseling
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Arsip_Data_${teacherId || 'Global'}_${exportData.tahun_ajaran?.replace('/', '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Error downloading arsip data', err);
      throw err;
    }
  },

  async cleanTransactionalData(): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        await Promise.all([
          supabase.from('daily_attendances').delete().neq('id', 'dummy'),
          supabase.from('teaching_journals').delete().neq('id', 'dummy'),
          supabase.from('student_grades').delete().neq('id', 'dummy'),
          supabase.from('counseling_records').delete().neq('id', 'dummy')
        ]);
      } catch (err) {
        console.warn('Supabase error cleaning data:', err);
      }
    }
    
    // Clean local data
    localStorage.removeItem('gurupro_attendances');
    localStorage.removeItem('gurupro_journals');
    localStorage.removeItem('gurupro_grades');
    localStorage.removeItem('gurupro_counseling_records');
  },

  async setGlobalTahunAjaran(tahun: string): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        const payload = {
          id: 'setting_tahun_ajaran',
          type: 'setting',
          name: tahun,
          url: '-',
          updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('global_schedules').upsert([payload]);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase error setting global tahun ajaran:', err);
      }
    }
    localStorage.setItem('global_tahun_ajaran', tahun);
  }
};
