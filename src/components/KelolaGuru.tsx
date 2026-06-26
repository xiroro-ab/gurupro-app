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
  UserPlus, 
  Book, 
  ShieldAlert, 
  X, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { GuruService } from '../services/supabase';
import { TeacherProfile, UserRole } from '../types';
import { useNotification } from './NotificationToast';

export default function KelolaGuru() {
  const queryClient = useQueryClient();
  const toast = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nip: '',
    nama_lengkap: '',
    role: 'guru' as UserRole,
    mapel: '',
    email: '',
    password: ''
  });

  // Queries
  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      const { email, password, ...profile } = data;
      // If email and password are empty, don't pass them
      return GuruService.createTeacher(
        profile, 
        email.trim() ? email.trim() : undefined, 
        password.trim() ? password.trim() : undefined
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Berhasil menambahkan data guru baru!');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal menambahkan data guru.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TeacherProfile> }) => {
      // Exclude password from update profile updates to avoid schema cache issues
      const { email, password, ...rest } = updates as any;
      return GuruService.updateTeacher(id, { ...rest, email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Berhasil memperbarui data guru!');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal memperbarui data guru.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => GuruService.deleteTeacher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Data guru berhasil dihapus.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Gagal menghapus data guru.');
    }
  });

  const openAddModal = () => {
    setSelectedTeacher(null);
    setFormData({ nip: '', nama_lengkap: '', role: 'guru', mapel: '', email: '', password: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (teacher: TeacherProfile) => {
    setSelectedTeacher(teacher);
    setFormData({
      nip: teacher.nip,
      nama_lengkap: teacher.nama_lengkap,
      role: teacher.role,
      mapel: teacher.mapel || '',
      email: teacher.email || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTeacher(null);
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
    if (!formData.nip || !formData.nama_lengkap) {
      toast.error('NIP dan Nama Lengkap wajib diisi.');
      return;
    }

    if (selectedTeacher) {
      updateMutation.mutate({ id: selectedTeacher.id, updates: formData });
    } else {
      // Check for NIP duplication first
      const isNipDup = teachers.some(t => t.nip === formData.nip);
      if (isNipDup) {
        toast.error('NIP ini sudah terdaftar di sistem.');
        return;
      }
      
      // If email or password is filled but not both
      if ((formData.email.trim() && !formData.password.trim()) || (!formData.email.trim() && formData.password.trim())) {
        toast.error('Email dan Password harus diisi keduanya jika ingin mendaftarkan akun login guru.');
        return;
      }

      if (formData.password.trim() && formData.password.trim().length < 6) {
        toast.error('Password akun login minimal harus 6 karakter.');
        return;
      }

      createMutation.mutate(formData);
    }
  };

  // Filter & Search Logic
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.nip.includes(searchQuery) ||
      (t.mapel && t.mapel.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || t.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div id="kelola-guru-section" className="space-y-6">
      {/* Top Banner Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Daftar Tenaga Pendidik</h3>
          <p className="text-xs text-slate-500">Kelola informasi guru, penugasan mata pelajaran, dan hak akses peran.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Guru Baru</span>
        </button>
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
            placeholder="Cari guru berdasarkan nama, NIP, atau mapel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
          />
        </div>

        {/* Role filter dropdown */}
        <div className="w-full md:w-56">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm text-slate-700"
          >
            <option value="all">Semua Peran / Role</option>
            <option value="admin">Admin</option>
            <option value="walikelas">Wali Kelas</option>
            <option value="guru">Guru Biasa</option>
          </select>
        </div>
      </div>

      {/* Teachers Grid/Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-sm"><span>Memuat data guru...</span></p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <ShieldAlert className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Data Guru tidak ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Silakan sesuaikan filter pencarian Anda atau tambahkan guru baru.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap & NIP</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Peran (Role)</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mata Pelajaran (Mapel)</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                          teacher.role === 'admin' 
                            ? 'bg-red-500' 
                            : teacher.role === 'walikelas' 
                            ? 'bg-emerald-500' 
                            : 'bg-blue-500'
                        }`}>
                          {teacher.nama_lengkap.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{teacher.nama_lengkap}</div>
                          <div className="text-xs text-slate-500 font-mono">NIP. {teacher.nip || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        teacher.role === 'admin' 
                          ? 'bg-red-50 text-red-700 border border-red-100' 
                          : teacher.role === 'walikelas' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        {teacher.role === 'admin' ? 'Administrator' : teacher.role === 'walikelas' ? 'Wali Kelas' : 'Guru Mapel'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm text-slate-700">
                        <Book className="h-4 w-4 text-slate-400" />
                        <span>{teacher.mapel || 'Sistem Admin'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold space-x-2">
                      <button
                        onClick={() => openEditModal(teacher)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer"
                        title="Edit Profil"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-rose-600 hover:text-rose-700 hover:border-rose-300 hover:bg-rose-50/30 transition-all cursor-pointer"
                        title="Hapus Data"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-zoomIn">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800">
                <UserPlus className="h-5 w-5 text-blue-700" />
                <h4 className="text-base font-bold">
                  {selectedTeacher ? 'Ubah Profil Pendidik' : 'Tambah Tenaga Pendidik Baru'}
                </h4>
              </div>
              <button onClick={closeModal} className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nomor Induk Pegawai (NIP)</label>
                <input
                  type="text"
                  required
                  value={formData.nip}
                  onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                  placeholder="Misal: 198802022013021002"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nama Lengkap (Beserta Gelar)</label>
                <input
                  type="text"
                  required
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  placeholder="Misal: Budi Santoso, S.Pd"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Peran Jabatan (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm text-slate-700"
                >
                  <option value="guru">Guru Mata Pelajaran</option>
                  <option value="walikelas">Wali Kelas</option>
                  <option value="admin">Administrator Utama</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mata Pelajaran yang Diampu</label>
                <input
                  type="text"
                  value={formData.mapel}
                  onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                  placeholder="Misal: IPA Terpadu (kosongkan jika Admin)"
                  className="block w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm"
                />
              </div>

              {/* Login Account Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                  Kredensial Login Pendidik
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email Akun Guru</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama.guru@sekolah.sch.id atau email biasa"
                    className="block w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm bg-white"
                  />
                </div>

                {!selectedTeacher && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Password Akun (Min. 6 Karakter)</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Masukkan password untuk login guru"
                      className="block w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Guru dapat langsung login menggunakan email & password ini tanpa perlu melakukan pendaftaran manual lagi.
                    </p>
                  </div>
                )}
                {selectedTeacher && (
                  <p className="text-[10px] text-slate-500 italic">
                    Catatan: Password hanya dapat dibuat/diubah oleh guru yang bersangkutan saat pendaftaran atau melalui pemulihan akun.
                  </p>
                )}
              </div>

              {/* Modal Footer */}
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
                  {createMutation.isPending || updateMutation.isPending ? 'Menyimpan...' : 'Simpan Data'}
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
              Apakah Anda yakin ingin menghapus data guru ini? Tindakan ini tidak dapat dibatalkan dan juga akan berdampak pada penugasan Wali Kelas serta presensi kelas terkait.
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
