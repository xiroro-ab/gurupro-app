/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { 
  CheckSquare, 
  Search, 
  Calendar, 
  FolderLock, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Check,
  UserX,
  MessageCircle,
  Trash2
} from 'lucide-react';

import { GuruService } from '../services/supabase';
import { Student, ClassRoom, TeacherProfile, DailyAttendance } from '../types';
import { useNotification } from './NotificationToast';
import { SearchableSelect } from './SearchableSelect';
import { ConfirmModal } from './ConfirmModal';

interface AbsensiHarianProps {
  currentUser: { id: string; email: string; profile: TeacherProfile };
  mode?: 'walikelas' | 'mapel' | 'kegiatan';
}

export default function AbsensiHarian({ currentUser, mode = 'mapel' }: AbsensiHarianProps) {
  const queryClient = useQueryClient();
  const toast = useNotification();
  const profile = currentUser.profile;
  const isWalikelasMode = mode === 'walikelas';
  const isKegiatanMode = mode === 'kegiatan';

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [namaKegiatan, setNamaKegiatan] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [attendanceState, setAttendanceState] = useState<{
    [studentId: string]: { status: 'hadir' | 'sakit' | 'izin' | 'alfa'; keterangan: string }
  }>({});

  // Queries
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => GuruService.getStudents()
  });

  const { data: existingAttendances = [], isLoading: loadingAttendances } = useQuery({
    queryKey: ['attendances', selectedDate],
    queryFn: () => GuruService.getAttendances(selectedDate)
  });

  // Handle class default setup
  const walikelasClass = classes.find(c => c.walikelas_id === profile.id);
  const walikelasClassId = walikelasClass?.id;
  const firstClassId = classes[0]?.id;

  useEffect(() => {
    if (isWalikelasMode && walikelasClassId) {
      setSelectedClassId(walikelasClassId);
    } else if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(firstClassId);
    }
  }, [classes.length, firstClassId, isWalikelasMode, walikelasClassId, selectedClassId]);

  // Filter students for chosen class
  const classStudents = students.filter(s => s.class_id === selectedClassId);

  const classStudentsSerialized = classStudents.map(s => s.id).join(',');
  const existingAttendancesSerialized = existingAttendances.map(a => `${a.student_id}:${a.status}:${a.keterangan || ''}`).join(',');

  // Synchronize state with loaded existing attendance
  useEffect(() => {
    if (classStudents.length === 0) return;

    const newState: typeof attendanceState = {};
    classStudents.forEach(student => {
      const match = existingAttendances.find(a => {
        const isSameStudentAndDate = a.student_id === student.id && a.tanggal === selectedDate;
        if (!isSameStudentAndDate) return false;
        
        const isWK = a.keterangan && a.keterangan.startsWith('[WK]');
        const isKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
        
        if (mode === 'walikelas') {
          return isWK;
        } else if (mode === 'kegiatan') {
          if (!isKeg) return false;
          if (!namaKegiatan.trim()) return true; // if they haven't typed, just show the first kegiatan found
          const kegName = a.keterangan.substring(5).trim().split(' - ')[0];
          return kegName.toLowerCase() === namaKegiatan.trim().toLowerCase();
        } else {
          // mapel
          return !isWK && !isKeg;
        }
      });

      if (match) {
        let cleanKet = match.keterangan || '';
        if (cleanKet.startsWith('[WK]')) cleanKet = cleanKet.substring(4).trim();
        else if (cleanKet.startsWith('[MP]')) cleanKet = cleanKet.substring(4).trim();
        else if (cleanKet.startsWith('[KEG]')) {
           const parts = cleanKet.substring(5).trim().split(' - ');
           parts.shift(); // remove the kegiatan name
           cleanKet = parts.join(' - ').trim();
        }

        newState[student.id] = {
          status: match.status,
          keterangan: cleanKet
        };
      } else {
        newState[student.id] = {
          status: 'hadir', // Default to present
          keterangan: ''
        };
      }
    });
    setAttendanceState(newState);
  }, [classStudentsSerialized, existingAttendancesSerialized, selectedClassId, selectedDate, mode, namaKegiatan]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (records: Omit<DailyAttendance, 'id'>[]) => GuruService.saveAttendances(records),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      showNotification('Presensi harian berhasil disimpan!', 'success');
    },
    onError: () => {
      showNotification('Gagal menyimpan presensi harian.', 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const handleStatusChange = (studentId: string, status: 'hadir' | 'sakit' | 'izin' | 'alfa') => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleKeteranganChange = (studentId: string, keterangan: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        keterangan
      }
    }));
  };

  const handleMarkAllAsHadir = () => {
    const newState = { ...attendanceState };
    classStudents.forEach(s => {
      newState[s.id] = {
        ...newState[s.id],
        status: 'hadir'
      };
    });
    setAttendanceState(newState);
    showNotification('Seluruh siswa diset "Hadir"', 'success');
  };

  
  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: ({ studentIds, date, delMode, kegName }: { studentIds: string[], date: string, delMode: 'walikelas' | 'mapel' | 'kegiatan', kegName?: string }) => 
      GuruService.deleteAttendances(studentIds, date, delMode, kegName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendances'] });
      
      // Reset state to 'hadir'
      const newState: typeof attendanceState = {};
      classStudents.forEach(s => {
        newState[s.id] = { status: 'hadir', keterangan: '' };
      });
      setAttendanceState(newState);

      showNotification('Presensi berhasil dihapus/dibatalkan!', 'success');
    },
    onError: () => {
      showNotification('Gagal menghapus presensi.', 'error');
    }
  });

  
  const handleDelete = () => {
    if (!selectedClassId || !selectedDate) {
      showNotification('Silakan pilih kelas dan tanggal terlebih dahulu.', 'error');
      return;
    }
    setIsConfirmOpen(true);
  };

  const executeDelete = () => {
    const studentIds = classStudents.map(s => s.id);
    deleteMutation.mutate({
      studentIds,
      date: selectedDate,
      delMode: mode,
      kegName: isKegiatanMode ? namaKegiatan.trim() : undefined
    });
  };
const handleSave = () => {

    if (!selectedClassId || !selectedDate) {
      showNotification('Silakan pilih kelas dan tanggal terlebih dahulu.', 'error');
      return;
    }

    const prefix = isWalikelasMode ? '[WK]' : isKegiatanMode ? '[KEG]' : '[MP]';
    const recordsToSave: Omit<DailyAttendance, 'id'>[] = classStudents.map(student => {
      const state = attendanceState[student.id] || { status: 'hadir', keterangan: '' };
      
      let finalKeterangan = (state.keterangan || '').trim();
      if (isKegiatanMode && namaKegiatan.trim()) {
        finalKeterangan = finalKeterangan ? `${namaKegiatan.trim()} - ${finalKeterangan}` : namaKegiatan.trim();
      }
      finalKeterangan = prefix + " " + finalKeterangan;
      
      return {
        student_id: student.id,
        status: state.status,
        keterangan: finalKeterangan.trim(),
        tanggal: selectedDate,
        recorded_by: profile.id
      };
    });

    saveMutation.mutate(recordsToSave);
  };

  return (
    <div id="absensi-harian-section" className="space-y-6">
      {/* Top Controller */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {isWalikelasMode ? 'Catat Presensi Harian Wali Kelas' : isKegiatanMode ? 'Catat Presensi Kegiatan Tambahan' : 'Catat Presensi Guru Mapel'}
          {isKegiatanMode && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Nama Kegiatan (contoh: Kokurikuler Pramuka)"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                className="w-full lg:w-96 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          )}
          </h3>
          <p className="text-xs text-slate-500">
            {isWalikelasMode 
              ? 'Menginput kehadiran harian siswa khusus untuk kelas asuhan Anda.' 
              : 'Pilih tanggal dan kelas pelajaran Anda untuk menginput atau memperbarui kehadiran harian.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-slate-500" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="block w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm font-semibold text-slate-700"
            />
          </div>

          {/* Class Select */}
          {isWalikelasMode ? (
            <div className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-extrabold flex items-center gap-1.5 shadow-xs">
              <span>Kelas Asuhan: {walikelasClass ? walikelasClass.nama_kelas : 'Memuat...'}</span>
            </div>
          ) : (
            <div className="w-[200px]">
              <SearchableSelect
                options={[
                  { value: '', label: '-- Pilih Kelas --' },
                  ...classes.map(c => ({ value: c.id, label: `Kelas ${c.nama_kelas}`, searchStr: c.nama_kelas }))
                ]}
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(val)}
                placeholder="-- Pilih Kelas --"
              />
            </div>
          )}

          {/* Mark All */}
          <button
            onClick={handleMarkAllAsHadir}
            disabled={classStudents.length === 0}
            className="px-4 py-2 border border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Set Semua Hadir
          </button>
        </div>
      </div>
      {/* Main Student List & Recording Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadingClasses || loadingStudents || loadingAttendances ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-sm">Mensinkronisasi roster presensi...</p>
          </div>
        ) : classStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <UserX className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Roster siswa kosong</p>
            <p className="text-xs text-slate-400 mt-1">Tidak ditemukan siswa pada kelas yang terpilih.</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">NISN</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Status Kehadiran</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Catatan / Keterangan</th>
                    <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Kirim WA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {classStudents.map((student, idx) => {
                    const state = attendanceState[student.id] || { status: 'hadir', keterangan: '' };
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">{student.nisn}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">{student.nama_siswa}</div>
                          <span className="text-[10px] text-slate-400 uppercase">JK: {student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {/* Hadir */}
                            <button
                              onClick={() => handleStatusChange(student.id, 'hadir')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                state.status === 'hadir'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Hadir (H)
                            </button>

                            {/* Sakit */}
                            <button
                              onClick={() => handleStatusChange(student.id, 'sakit')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                state.status === 'sakit'
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Sakit (S)
                            </button>

                            {/* Izin */}
                            <button
                              onClick={() => handleStatusChange(student.id, 'izin')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                state.status === 'izin'
                                  ? 'bg-amber-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Izin (I)
                            </button>

                            {/* Alfa */}
                            <button
                              onClick={() => handleStatusChange(student.id, 'alfa')}
                              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                state.status === 'alfa'
                                  ? 'bg-red-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              Alfa (A)
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder={state.status !== 'hadir' ? 'Sebab/Alasan sakit/izin...' : 'Keterangan tambahan (opsional)'}
                            value={state.keterangan}
                            onChange={(e) => handleKeteranganChange(student.id, e.target.value)}
                            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold">
                          {state.status !== 'hadir' && student.no_hp_orang_tua ? (
                            (() => {
                              const statusCaps = state.status === 'sakit' ? 'Sakit' : state.status === 'izin' ? 'Izin' : 'Alfa (Tanpa Keterangan)';
                              let rawPhone = student.no_hp_orang_tua.replace(/\D/g, '');
                              if (rawPhone.startsWith('0')) {
                                rawPhone = '62' + rawPhone.substring(1);
                              }
                              const textMsg = encodeURIComponent(
                                `Halo Bapak/Ibu Wali Murid dari *${student.nama_siswa}*,\n\nKami menginformasikan bahwa pada hari ini, *${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}*, putra-putri Anda tercatat *${statusCaps}* dalam presensi kehadiran di sekolah.\n\n${state.keterangan ? `Catatan guru: *"${state.keterangan}"*\n\n` : ''}Demikian informasi ini disampaikan agar menjadi perhatian Bapak/Ibu sekalian. Terima kasih.\n\nSalam,\n*Wali Kelas / Guru Pengajar*`
                              );
                              return (
                                <a
                                  href={`https://wa.me/${rawPhone}?text=${textMsg}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                                  title="Kirim pemberitahuan presensi langsung ke WhatsApp orang tua."
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>Kirim</span>
                                </a>
                              );
                            })()
                          ) : state.status !== 'hadir' ? (
                            <span className="text-[10px] text-slate-400 italic">No HP kosong</span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Form Footer action */}
            
            <div className="bg-slate-50 border-t border-slate-100 p-5 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Total data presensi yang akan dicatat: <span className="font-bold text-slate-800">{classStudents.length} siswa</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending || saveMutation.isPending || existingAttendances.length === 0}
                  className="flex items-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4.5 w-4.5" />
                  <span className="hidden sm:inline">{deleteMutation.isPending ? 'Menghapus...' : 'Hapus Presensi'}</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || deleteMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer shadow-md"
                >
                  <Check className="h-4.5 w-4.5" />
                  <span>{saveMutation.isPending ? 'Menyimpan...' : 'Simpan Presensi Harian'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Hapus Data Presensi?"
        message="Apakah Anda yakin ingin menghapus atau membatalkan seluruh data presensi pada tanggal ini untuk kelas yang dipilih? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );

}
