import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GuruService } from '../services/supabase';
import { Calendar, Plus, Trash2, Edit2, AlertCircle, Save, X } from 'lucide-react';
import { useNotification } from './NotificationToast';
import { TeacherProfile } from '../types';

import { ConfirmModal } from './ConfirmModal';

interface Props {
  currentUser: {
    profile: TeacherProfile;
  };
}

export const KalenderAkademik: React.FC<Props> = ({ currentUser }) => {
  const isAdmin = currentUser.profile.role === 'admin';
  const toast = useNotification();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirm Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tanggal: '',
    keterangan: '',
    is_exam: false
  });

  const { data: holidays = [], isLoading: isLoadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => GuruService.getHolidays()
  });

  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  // Filter holidays based on role
  // Admins only see admin-created. Teachers see admin-created + their own.
  const visibleHolidays = holidays.filter(h => {
    const creatorProfile = teachers.find(t => t.id === h.created_by);
    // Treat as admin-created if created_by is missing, or the creator's role is 'admin'
    const isByAdmin = !h.created_by || creatorProfile?.role === 'admin';
    if (isAdmin) {
      return isByAdmin;
    }
    return isByAdmin || h.created_by === currentUser.profile.id;
  });

  const saveMutation = useMutation({
    mutationFn: async (holiday: any) => {
      await GuruService.saveHoliday(holiday);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Berhasil menyimpan jadwal akademik');
      setShowModal(false);
      resetForm();
    },
    onError: () => {
      toast.error('Gagal menyimpan jadwal');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await GuruService.deleteHoliday(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Jadwal berhasil dihapus');
      setConfirmDeleteId(null);
    }
  });

  const resetForm = () => {
    setFormData({ tanggal: '', keterangan: '', is_exam: false });
    setEditingId(null);
  };

  const handleEdit = (h: any) => {
    setFormData({
      tanggal: h.tanggal,
      keterangan: h.keterangan,
      is_exam: h.is_exam || false
    });
    setEditingId(h.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tanggal || !formData.keterangan) {
      toast.error('Lengkapi form terlebih dahulu');
      return;
    }
    
    saveMutation.mutate({
      id: editingId || 'h_' + Date.now(),
      created_by: editingId 
        ? holidays.find(h => h.id === editingId)?.created_by || currentUser.profile.id 
        : currentUser.profile.id,
      ...formData
    });
  };

  if (isLoadingHolidays || isLoadingTeachers) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mr-3"></div>
        <span>Memuat kalender akademik...</span>
      </div>
    );
  }

  // Sort by date ascending
  const sortedHolidays = [...visibleHolidays].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <span>Kalender Akademik</span>
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Kelola hari libur nasional dan jadwal ujian. (Akan mencegah pengisian jurnal saat libur)
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Jadwal</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Jenis</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedHolidays.length > 0 ? (
                sortedHolidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-800">
                      {(() => {
                        if (!h.tanggal) return '-';
                        const d = new Date(h.tanggal);
                        return isNaN(d.getTime()) ? h.tanggal : d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{h.keterangan}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {h.is_exam ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Jadwal Ujian</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">Hari Libur</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {(isAdmin || h.created_by === currentUser.profile.id) && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(h)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteId(h.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <Calendar className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="font-medium text-slate-500">Belum ada kalender akademik yang ditambahkan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-zoomIn">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Edit Jadwal' : 'Tambah Jadwal'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal</label>
                <input 
                  type="date"
                  required
                  value={formData.tanggal}
                  onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                  className="w-full border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Keterangan</label>
                <input 
                  type="text"
                  required
                  placeholder="Misal: Libur Idul Fitri"
                  value={formData.keterangan}
                  onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                  className="w-full border-slate-200 rounded-xl focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group p-3 border border-slate-200 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="checkbox"
                      checked={formData.is_exam}
                      onChange={e => setFormData({ ...formData, is_exam: e.target.checked })}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors"></div>
                    <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">
                    Tandai sebagai Jadwal Ujian (Bukan Libur)
                  </span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {saveMutation.isPending ? 'Menyimpan...' : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Hapus Kalender Akademik"
        message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
