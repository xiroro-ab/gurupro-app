/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Layers, 
  X, 
  CheckCircle,
  AlertCircle,
  UserCheck
} from 'lucide-react';
import { GuruService } from '../services/supabase';
import { ClassRoom, TeacherProfile } from '../types';
import { useNotification } from './NotificationToast';

export default function KelolaKelas() {
  const queryClient = useQueryClient();
  const toast = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRoom | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_kelas: '',
    walikelas_id: '',
    tahun_ajaran: '2025/2026'
  });

  // Queries
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => GuruService.getStudents()
  });

  // Filter to find teachers who can be Walikelas (not administrative or simply available)
  const availableWalikelas = teachers.filter(t => t.role === 'walikelas' || t.role === 'guru');

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newClass: Omit<ClassRoom, 'id'>) => GuruService.createClass(newClass),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      showNotification('Berhasil membuat kelas baru!', 'success');
      closeModal();
    },
    onError: () => {
      showNotification('Gagal membuat kelas.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ClassRoom> }) => 
      GuruService.updateClass(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      showNotification('Berhasil memperbarui data kelas!', 'success');
      closeModal();
    },
    onError: () => {
      showNotification('Gagal memperbarui data kelas.', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => GuruService.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      showNotification('Kelas berhasil dihapus.', 'success');
    },
    onError: (err: any) => {
      showNotification(err?.message || 'Gagal menghapus kelas.', 'error');
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
    setSelectedClass(null);
    setFormData({
      nama_kelas: '',
      walikelas_id: availableWalikelas[0]?.id || '',
      tahun_ajaran: '2025/2026'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cls: ClassRoom) => {
    setSelectedClass(cls);
    setFormData({
      nama_kelas: cls.nama_kelas,
      walikelas_id: cls.walikelas_id,
      tahun_ajaran: cls.tahun_ajaran
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
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
    if (!formData.nama_kelas || !formData.walikelas_id || !formData.tahun_ajaran) {
      showNotification('Nama Kelas, Wali Kelas, dan Tahun Ajaran wajib ditentukan.', 'error');
      return;
    }

    if (selectedClass) {
      updateMutation.mutate({ id: selectedClass.id, updates: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredClasses = classes.filter(c => 
    c.nama_kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.tahun_ajaran.includes(searchQuery)
  );

  return (
    <div id="kelola-kelas-section" className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Manajemen Struktur Kelas</h3>
          <p className="text-xs text-slate-500">Mendaftarkan kelompok kelas, menetapkan penanggung jawab Wali Kelas, serta menyelaraskan periode ajaran.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Buat Kelas Baru</span>
        </button>
      </div>
      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari kelas berdasarkan nama kelas atau periode tahun ajaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
          />
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loadingClasses || loadingTeachers ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-sm">Menyelaraskan struktur kelas...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <Layers className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Data Kelas belum tersedia</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan tombol Buat Kelas Baru di atas untuk mendaftarkan kelas perdana.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Kelas</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Wali Kelas Terpilih</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tahun Ajaran</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Siswa</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredClasses.map((cls) => {
                  const wkl = teachers.find(t => t.id === cls.walikelas_id);
                  const classSize = students.filter(s => s.class_id === cls.id).length;
                  return (
                    <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Layers className="h-4.5 w-4.5 text-blue-700" />
                          <span className="text-sm font-bold text-slate-900">Kelas {cls.nama_kelas}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-emerald-600" />
                          <div className="text-sm text-slate-800">
                            {wkl ? wkl.nama_lengkap : <span className="text-rose-500 italic font-semibold">Belum Ditugaskan</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        Periode {cls.tahun_ajaran}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-700">
                        {classSize} murid
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold space-x-2">
                        <button
                          onClick={() => openEditModal(cls)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>Ubah</span>
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
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

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-zoomIn">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <Layers className="h-5 w-5 text-blue-700" />
                <h4 className="text-base font-bold">
                  {selectedClass ? 'Ubah Rincian Kelas' : 'Pendaftaran Kelas Baru'}
                </h4>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Kelompok Kelas</label>
                <input
                  type="text"
                  required
                  value={formData.nama_kelas}
                  onChange={(e) => setFormData({ ...formData, nama_kelas: e.target.value })}
                  placeholder="Misal: VIII-A"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Wali Kelas Pengampu</label>
                <select
                  value={formData.walikelas_id}
                  onChange={(e) => setFormData({ ...formData, walikelas_id: e.target.value })}
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm text-slate-700 cursor-pointer"
                >
                  <option value="">-- Pilih Wali Kelas --</option>
                  {availableWalikelas.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama_lengkap} ({t.role === 'walikelas' ? 'Wali Kelas' : 'Guru'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  required
                  value={formData.tahun_ajaran}
                  onChange={(e) => setFormData({ ...formData, tahun_ajaran: e.target.value })}
                  placeholder="Misal: 2025/2026"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
                />
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
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Kelas'}
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
              Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan, dan dapat mereset data roster siswa di dalamnya secara permanen.
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
