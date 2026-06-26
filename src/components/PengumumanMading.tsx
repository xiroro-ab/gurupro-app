import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GuruService } from '../services/supabase';
import { TeacherProfile, Announcement } from '../types';
import { Megaphone, Plus, Trash2, Edit2, Clock, Users, X, Save } from 'lucide-react';
import { useNotification } from './NotificationToast';

import { ConfirmModal } from './ConfirmModal';

interface Props {
  currentUser: {
    profile: TeacherProfile;
  };
}

export const PengumumanMading: React.FC<Props> = ({ currentUser }) => {
  const isAdmin = currentUser.profile.role === 'admin';
  const toast = useNotification();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal' as 'low' | 'normal' | 'high',
    target_role: 'all' as 'all' | 'guru' | 'walikelas'
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => GuruService.getAnnouncements()
  });

  const saveMutation = useMutation({
    mutationFn: async (announcement: Announcement) => {
      await GuruService.saveAnnouncement(announcement);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Pengumuman berhasil dipublikasikan');
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await GuruService.deleteAnnouncement(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Pengumuman berhasil dihapus');
      setConfirmDeleteId(null);
    }
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', priority: 'normal', target_role: 'all' });
    setEditingId(null);
  };

  const handleEdit = (a: Announcement) => {
    setFormData({
      title: a.title,
      content: a.content,
      priority: a.priority,
      target_role: a.target_role
    });
    setEditingId(a.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Lengkapi semua form');
      return;
    }
    
    saveMutation.mutate({
      id: editingId || 'a_' + Date.now(),
      ...formData,
      created_at: editingId ? announcements.find(a => a.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
      created_by: editingId ? announcements.find(a => a.id === editingId)?.created_by || currentUser.profile.id : currentUser.profile.id
    });
  };

  // Filter announcements for non-admins based on their role
  const visibleAnnouncements = isAdmin ? announcements : announcements.filter(a => {
    if (a.target_role === 'all') return true;
    if (a.target_role === currentUser.profile.role) return true;
    return false;
  });

  // Sort by date descending (newest first)
  const sortedAnnouncements = [...visibleAnnouncements].sort((a, b) => 
    new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime()
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mr-3"></div>
        <span>Memuat mading digital...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-600" />
            Pengumuman & Mading Digital
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Publikasikan informasi dan pengumuman sekolah.' : 'Informasi dan pengumuman terbaru dari sekolah.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Pengumuman</span>
          </button>
        )}
      </div>

      {sortedAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Megaphone className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-700">Belum Ada Pengumuman</h3>
          <p className="text-slate-500 mt-1">Belum ada informasi terbaru di mading digital.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAnnouncements.map((a) => (
            <div 
              key={a.id} 
              className={`bg-white rounded-2xl border shadow-sm flex flex-col ${
                a.priority === 'high' ? 'border-red-200 shadow-red-50' : 
                a.priority === 'normal' ? 'border-blue-200 shadow-blue-50' : 'border-slate-200'
              }`}
            >
              <div className={`p-4 border-b flex items-start justify-between gap-2 ${
                a.priority === 'high' ? 'bg-red-50/50 border-red-100' : 
                a.priority === 'normal' ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'
              } rounded-t-2xl`}>
                <div>
                  <h3 className="font-bold text-slate-800 line-clamp-2">{a.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {(() => {
                        if (!a.created_at) return '-';
                        const d = new Date(a.created_at);
                        return isNaN(d.getTime()) ? a.created_at : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                      })()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {a.target_role === 'all' ? 'Semua' : a.target_role === 'guru' ? 'Guru' : 'Wali Kelas'}
                    </span>
                  </div>
                </div>
                {a.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0">
                    Penting
                  </span>
                )}
              </div>
              <div className="p-5 flex-1">
                <p className="text-slate-600 text-sm whitespace-pre-wrap">{a.content}</p>
              </div>
              {isAdmin && (
                <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50 rounded-b-2xl">
                  <button
                    onClick={() => handleEdit(a)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setConfirmDeleteId(a.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-zoomIn flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Edit Pengumuman' : 'Buat Pengumuman'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="announcement-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Judul Pengumuman</label>
                  <input 
                    type="text"
                    required
                    placeholder="Contoh: Rapat Evaluasi Bulanan"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Target Penerima</label>
                  <select
                    value={formData.target_role}
                    onChange={e => setFormData({ ...formData, target_role: e.target.value as any })}
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="all">Semua Staff (Guru & Wali Kelas)</option>
                    <option value="guru">Guru Mapel Saja</option>
                    <option value="walikelas">Wali Kelas Saja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tingkat Kepentingan (Prioritas)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.priority === 'low' ? 'bg-slate-100 border-slate-300 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="priority" className="sr-only" checked={formData.priority === 'low'} onChange={() => setFormData({ ...formData, priority: 'low' })} />
                      <span className="text-sm text-slate-600">Biasa</span>
                    </label>
                    <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.priority === 'normal' ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="priority" className="sr-only" checked={formData.priority === 'normal'} onChange={() => setFormData({ ...formData, priority: 'normal' })} />
                      <span className="text-sm">Menengah</span>
                    </label>
                    <label className={`flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-all ${formData.priority === 'high' ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="priority" className="sr-only" checked={formData.priority === 'high'} onChange={() => setFormData({ ...formData, priority: 'high' })} />
                      <span className="text-sm">Penting</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Isi Pengumuman</label>
                  <textarea 
                    required
                    rows={6}
                    placeholder="Tuliskan isi pesan atau informasi di sini..."
                    value={formData.content}
                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 shrink-0 flex gap-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                form="announcement-form"
                disabled={saveMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {saveMutation.isPending ? 'Menyimpan...' : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Publikasikan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Hapus Pengumuman"
        message="Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
