/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  UserPlus, 
  Upload, 
  Download, 
  Users, 
  X, 
  CheckCircle,
  AlertCircle,
  FolderLock,
  Phone,
  MessageCircle
} from 'lucide-react';
import { GuruService } from '../services/supabase';
import { Student, ClassRoom, TeacherProfile } from '../types';
import { useNotification } from './NotificationToast';

interface KelolaSiswaProps {
  currentUser: { id: string; email: string; profile: TeacherProfile };
}

export default function KelolaSiswa({ currentUser }: KelolaSiswaProps) {
  const queryClient = useQueryClient();
  const toast = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nisn: '',
    nama_siswa: '',
    jenis_kelamin: 'L' as 'L' | 'P',
    class_id: '',
    no_hp_orang_tua: ''
  });

  // Queries
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => GuruService.getStudents()
  });

  const profile = currentUser.profile;
  const isWalikelas = profile.role === 'walikelas';

  // Find Walikelas designated class room
  const walikelasClass = isWalikelas 
    ? classes.find(c => c.walikelas_id === profile.id) 
    : null;
  const walikelasClassId = walikelasClass?.id;

  // Set active class filter default
  React.useEffect(() => {
    if (isWalikelas && walikelasClassId) {
      setClassFilter(walikelasClassId);
    }
  }, [isWalikelas, walikelasClassId]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newStudent: Omit<Student, 'id'>) => GuruService.createStudent(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showNotification('Berhasil mendaftarkan siswa baru!', 'success');
      closeModal();
    },
    onError: () => {
      showNotification('Gagal mendaftarkan siswa. Periksa apakah NISN sudah digunakan.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Student> }) => 
      GuruService.updateStudent(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showNotification('Berhasil memperbarui data siswa!', 'success');
      closeModal();
    },
    onError: () => {
      showNotification('Gagal memperbarui data siswa.', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => GuruService.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showNotification('Data siswa berhasil dihapus.', 'success');
    },
    onError: (err: any) => {
      showNotification(err?.message || 'Gagal menghapus data siswa.', 'error');
    }
  });

  const bulkMutation = useMutation({
    mutationFn: (list: Omit<Student, 'id'>[]) => GuruService.bulkInsertStudents(list),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      showNotification(`Berhasil mengimpor ${data.length} siswa secara massal!`, 'success');
    },
    onError: () => {
      showNotification('Gagal melakukan impor massal. Pastikan format CSV valid.', 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const openAddModal = () => {
    setSelectedStudent(null);
    setFormData({
      nisn: '',
      nama_siswa: '',
      jenis_kelamin: 'L',
      class_id: isWalikelas && walikelasClass ? walikelasClass.id : (classes[0]?.id || ''),
      no_hp_orang_tua: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      nisn: student.nisn,
      nama_siswa: student.nama_siswa,
      jenis_kelamin: student.jenis_kelamin,
      class_id: student.class_id,
      no_hp_orang_tua: student.no_hp_orang_tua || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
      setDeleteId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nisn || !formData.nama_siswa || !formData.class_id) {
      showNotification('Semua bidang isian wajib dilengkapi.', 'error');
      return;
    }

    if (selectedStudent) {
      updateMutation.mutate({ id: selectedStudent.id, updates: formData });
    } else {
      // Check duplicate NISN
      const isNisnDup = students.some(s => s.nisn === formData.nisn);
      if (isNisnDup) {
        showNotification('NISN ini sudah terdaftar di sistem.', 'error');
        return;
      }
      createMutation.mutate(formData);
    }
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    const dataToExport = filteredStudents.map((s, index) => {
      const cls = classes.find(c => c.id === s.class_id);
      return {
        No: index + 1,
        NISN: s.nisn,
        'Nama Siswa': s.nama_siswa,
        'Jenis Kelamin': s.jenis_kelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
        Kelas: cls ? cls.nama_kelas : 'Tidak Terdaftar'
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Roster_Siswa_${isWalikelas ? walikelasClass?.nama_kelas : 'Semua'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Import Parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data as any[];
        const validStudents: Omit<Student, 'id'>[] = [];
        const errors: string[] = [];

        parsedRows.forEach((row, idx) => {
          const nisn = row.NISN || row.nisn;
          const nama = row['Nama Siswa'] || row.nama || row.nama_siswa;
          const jk = row['Jenis Kelamin'] || row.jenis_kelamin || row.jk;
          const kelasNama = row.Kelas || row.kelas || row.nama_kelas;

          if (!nisn || !nama) {
            errors.push(`Baris ${idx + 1}: NISN atau Nama kosong.`);
            return;
          }

          // Class resolution
          let resolvedClassId = '';
          if (isWalikelas && walikelasClass) {
            resolvedClassId = walikelasClass.id;
          } else {
            const foundClass = classes.find(c => c.nama_kelas.toLowerCase() === (kelasNama || '').toLowerCase());
            resolvedClassId = foundClass ? foundClass.id : (classes[0]?.id || '');
          }

          // Gender resolution
          let gender: 'L' | 'P' = 'L';
          const normalizedJk = (jk || '').toUpperCase();
          if (normalizedJk.startsWith('P') || normalizedJk === 'W' || normalizedJk.includes('PEREMPUAN')) {
            gender = 'P';
          }

          const phone = row['No HP Orang Tua'] || row['no_hp_orang_tua'] || row.no_hp || row.whatsapp || row['No HP'] || '';

          validStudents.push({
            nisn: nisn.trim(),
            nama_siswa: nama.trim(),
            jenis_kelamin: gender,
            class_id: resolvedClassId,
            no_hp_orang_tua: phone.trim()
          });
        });

        if (errors.length > 0) {
          showNotification(`Kesalahan saat membaca CSV:\n${errors.slice(0,3).join('\n')}`, 'error');
        }

        if (validStudents.length > 0) {
          // Check for NISN duplicates in current loaded list
          const currentNisns = students.map(s => s.nisn);
          const duplicates = validStudents.filter(s => currentNisns.includes(s.nisn));

          if (duplicates.length > 0) {
            showNotification(`${duplicates.length} siswa dilewati karena NISN duplikat.`, 'error');
          }

          const nonDuplicates = validStudents.filter(s => !currentNisns.includes(s.nisn));
          if (nonDuplicates.length > 0) {
            bulkMutation.mutate(nonDuplicates);
          } else {
            showNotification('Tidak ada siswa baru yang diimpor (semua NISN duplikat).', 'error');
          }
        }
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter & Search Logic
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.nama_siswa.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nisn.includes(searchQuery);
    
    const matchesClass = classFilter === 'all' || s.class_id === classFilter;

    return matchesSearch && matchesClass;
  });

  return (
    <div id="kelola-siswa-section" className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">
            {isWalikelas ? `Siswa Kelas ${walikelasClass?.nama_kelas || ''}` : 'Siswa GuruPro'}
          </h3>
          <p className="text-xs text-slate-500">
            {isWalikelas 
              ? 'Kelola roster siswa kelas binaan asuhan Anda secara mandiri.' 
              : 'Daftar rekapitulasi seluruh murid terdaftar di sekolah.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Import */}
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:border-blue-400 text-slate-700 bg-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            title="Unggah CSV Massal"
          >
            <Upload className="h-4 w-4 text-blue-600" />
            <span>Impor CSV</span>
          </button>

          {/* Export button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-300 hover:border-emerald-400 text-slate-700 bg-white rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            title="Download Spreadsheet"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Ekspor CSV</span>
          </button>

          {/* Add Student */}
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>
      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari siswa berdasarkan nama atau nomor NISN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
          />
        </div>

        {/* Class filter dropdown */}
        <div className="w-full md:w-56">
          {isWalikelas ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-medium">
              <FolderLock className="h-4 w-4 text-slate-400" />
              <span>Kelas: {walikelasClass?.nama_kelas || 'Memuat...'}</span>
            </div>
          ) : (
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm text-slate-700"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Kelas {cls.nama_kelas}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Roster Grid/Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadingStudents || loadingClasses ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-sm"><span>Memuat data roster...</span></p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Users className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Tidak ada siswa terdaftar</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol Tambah Siswa atau Impor CSV di atas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nomor NISN</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap Murid</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis Kelamin</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">HP Orang Tua</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredStudents.map((student, idx) => {
                  const studentClass = classes.find(c => c.id === student.class_id);
                  const hpOrtu = student.no_hp_orang_tua || '';
                  
                  // Setup WhatsApp Link helper
                  let cleanPhone = hpOrtu.replace(/\D/g, '');
                  if (cleanPhone.startsWith('0')) {
                    cleanPhone = '62' + cleanPhone.substring(1);
                  }
                  const waTestText = encodeURIComponent(`Halo Bapak/Ibu Wali Murid dari *${student.nama_siswa}*,\n\nIni adalah pesan konfirmasi bahwa nomor telepon Anda terdaftar dalam sistem informasi GuruPro sebagai sarana komunikasi guru, wali kelas, dan sekolah terkait presensi serta perkembangan belajar putra-putri Anda.\n\nTerima kasih atas perhatiannya.\n\nSalam,\n*Wali Kelas / Manajemen Sekolah*`);
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waTestText}` : '';

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                          {student.nisn}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-slate-900">{student.nama_siswa}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          student.jenis_kelamin === 'L' 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'bg-pink-50 text-pink-700'
                        }`}>
                          {student.jenis_kelamin === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {studentClass ? `Kelas ${studentClass.nama_kelas}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {hpOrtu ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700 text-xs">{hpOrtu}</span>
                            <a
                              href={waUrl}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              className="p-1 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
                              title="Kirim Tes Hubungi via WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Belum diisi</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold space-x-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Ubah</span>
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-rose-600 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-zoomIn">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <UserPlus className="h-5 w-5 text-blue-700" />
                <h4 className="text-base font-bold">
                  {selectedStudent ? 'Ubah Roster Murid' : 'Tambah Murid Baru'}
                </h4>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor Induk Siswa Nasional (NISN)</label>
                <input
                  type="text"
                  required
                  value={formData.nisn}
                  onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                  placeholder="Misal: 0081234561"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap Murid</label>
                <input
                  type="text"
                  required
                  value={formData.nama_siswa}
                  onChange={(e) => setFormData({ ...formData, nama_siswa: e.target.value })}
                  placeholder="Misal: Adi Nugroho"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer font-semibold transition-all ${
                    formData.jenis_kelamin === 'L' 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 ring-2 ring-blue-600/20' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="jenis_kelamin"
                      value="L"
                      checked={formData.jenis_kelamin === 'L'}
                      onChange={() => setFormData({ ...formData, jenis_kelamin: 'L' })}
                      className="sr-only"
                    />
                    <span>Laki-Laki (L)</span>
                  </label>
                  <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer font-semibold transition-all ${
                    formData.jenis_kelamin === 'P' 
                      ? 'border-pink-600 bg-pink-50/50 text-pink-700 ring-2 ring-pink-600/20' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="jenis_kelamin"
                      value="P"
                      checked={formData.jenis_kelamin === 'P'}
                      onChange={() => setFormData({ ...formData, jenis_kelamin: 'P' })}
                      className="sr-only"
                    />
                    <span>Perempuan (P)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Penempatan Kelas</label>
                {isWalikelas ? (
                  <div className="p-3 border border-slate-200 bg-slate-50 text-slate-600 font-semibold rounded-xl text-sm">
                    LOCKED: Kelas {walikelasClass?.nama_kelas || ''} (Binaan Anda)
                  </div>
                ) : (
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm text-slate-700"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        Kelas {cls.nama_kelas}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  No. HP / WhatsApp Orang Tua <span className="text-slate-400 font-normal text-xs">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={formData.no_hp_orang_tua}
                  onChange={(e) => setFormData({ ...formData, no_hp_orang_tua: e.target.value })}
                  placeholder="Misal: 081234567890"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  Gunakan format nomor lokal (08xx...) atau internasional (628xx...). Digunakan untuk fitur kirim laporan instan via WhatsApp.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Murid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 animate-zoomIn">
            <div className="flex items-center gap-3 text-amber-600 mb-4">
              <AlertCircle className="h-6 w-6 shrink-0" />
              <h4 className="text-lg font-bold text-slate-800">Konfirmasi Hapus</h4>
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan dan seluruh data presensi siswa yang bersangkutan juga akan terhapus secara permanen.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
