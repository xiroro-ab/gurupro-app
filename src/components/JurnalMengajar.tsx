/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  BookOpen, 
  Plus, 
  Trash2, Edit2, 
  Calendar, 
  Layers, 
  User, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Briefcase,
  Users,
  Clock,
  UserMinus,
  Monitor,
  HelpCircle,
  Printer,
  Download,
  X
} from 'lucide-react';
import { GuruService } from '../services/supabase';
import { TeachingJournal, TeacherProfile } from '../types';
import { useNotification } from './NotificationToast';
import { SearchableSelect } from './SearchableSelect';

interface JurnalMengajarProps {
  currentUser: { id: string; email: string; profile: TeacherProfile };
  type?: 'jurnal_mengajar' | 'agenda_harian' | 'agenda_mgmp' | 'jurnal_mgmp';
}

export default function JurnalMengajar({ currentUser, type = 'jurnal_mengajar' }: JurnalMengajarProps) {
  const queryClient = useQueryClient();
  const toast = useNotification();
  const profile = currentUser.profile;

  // Form states
  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [tanggal, setTanggal] = useState(getLocalDate());
  const [classId, setClassId] = useState('');
  const [mapel, setMapel] = useState(type.includes('mgmp') ? `MGMP ${profile.mapel || 'Umum'}` : (profile.mapel || ''));
  const [materi, setMateri] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [jamKe, setJamKe] = useState('');
    const [mediaPembelajaran, setMediaPembelajaran] = useState('');
  const [hambatanSolusi, setHambatanSolusi] = useState('');
  const [siswaAbsen, setSiswaAbsen] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [kepalaSekolahNama, setKepalaSekolahNama] = useState(localStorage.getItem('gurupro_kepala_sekolah_nama') || 'Dr. H. Ahmad Fauzi, M.Si');
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState(localStorage.getItem('gurupro_kepala_sekolah_nip') || '197402121998031001');

  
  const handleEdit = (j: TeachingJournal) => {
    setEditingId(j.id);
    setTanggal(j.tanggal);
    if (!type.includes('mgmp') && j.class_id) setClassId(j.class_id);
    setMapel(j.mapel);
    setMateri(j.materi);
    setKeterangan(j.keterangan || '');
    setJamKe(j.jam_ke || '');
    setMediaPembelajaran(j.media_pembelajaran || '');
    setHambatanSolusi(j.hambatan_solusi || '');
    setSiswaAbsen(j.siswa_absen || '');
    
    document.getElementById(`${type}-section`)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrint = () => {
    window.print();
  };

  // Queries
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: journals = [], isLoading: loadingJournals } = useQuery({
    queryKey: ['journals'],
    queryFn: () => GuruService.getJournals()
  });

  const { data: holidays = [], isLoading: loadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => GuruService.getHolidays()
  });

  // Filter journals recorded by this specific teacher and matches this specific type
  const myJournals = journals.filter(j => {
    const journalType = j.journal_type || 'jurnal_mengajar';
    return j.recorded_by === profile.id && journalType === type;
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newJournal: Omit<TeachingJournal, 'id'>) => GuruService.createJournal(newJournal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      showNotification(`Catatan ${getFeatureTitle()} berhasil disimpan!`, 'success');
      // Reset form fields
      setMateri('');
      setKeterangan('');
      setJamKe('');
      setMediaPembelajaran('');
      setHambatanSolusi('');
      setSiswaAbsen('');
      setEditingId(null);
    },
    onError: (err: any) => {
      showNotification(err?.message || 'Gagal menyimpan data.', 'error');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: {id: string, updates: Partial<TeachingJournal>}) => GuruService.updateJournal(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      showNotification(`Catatan ${getFeatureTitle()} berhasil diperbarui!`, 'success');
      setMateri('');
      setKeterangan('');
      setJamKe('');
      setMediaPembelajaran('');
      setHambatanSolusi('');
      setSiswaAbsen('');
      setEditingId(null);
    },
    onError: (err: any) => {
      showNotification(err?.message || 'Gagal memperbarui data.', 'error');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => GuruService.deleteJournal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journals'] });
      showNotification('Catatan berhasil dihapus.', 'success');
    },
    onError: (err: any) => {
      showNotification(err?.message || 'Gagal menghapus catatan.', 'error');
    }
  });

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  const getFeatureTitle = () => {
    switch (type) {
      case 'agenda_harian':
        return 'Agenda Harian';
      case 'agenda_mgmp':
        return 'Agenda MGMP';
      case 'jurnal_mgmp':
        return 'Jurnal MGMP';
      case 'jurnal_mengajar':
      default:
        return 'Jurnal Mengajar';
    }
  };

  const getFeatureSubtitle = () => {
    switch (type) {
      case 'agenda_harian':
        return 'Isi rencana agenda pembelajaran harian yang akan dilaksanakan di kelas.';
      case 'agenda_mgmp':
        return 'Isi rencana pertemuan, koordinasi, dan agenda kegiatan MGMP Anda.';
      case 'jurnal_mgmp':
        return 'Isi realisasi materi, hasil pembahasan, dan catatan penting pertemuan MGMP.';
      case 'jurnal_mengajar':
      default:
        return 'Isi catatan materi pembelajaran yang diajarkan pada kelas bersangkutan.';
    }
  };

  const getMapelLabel = () => {
    return type.includes('mgmp') ? 'Nama Forum MGMP *' : 'Mata Pelajaran (Mapel) *';
  };

  const getMapelPlaceholder = () => {
    return type.includes('mgmp') ? 'Misal: MGMP Matematika' : 'Misal: Matematika';
  };

  const getMateriLabel = () => {
    switch (type) {
      case 'agenda_harian':
        return 'Rencana Kegiatan / Agenda *';
      case 'agenda_mgmp':
        return 'Rencana Bahasan / Agenda Pertemuan *';
      case 'jurnal_mgmp':
        return 'Materi Pembahasan & Hasil Diskusi *';
      case 'jurnal_mengajar':
      default:
        return 'Materi / Bahasan Pokok *';
    }
  };

  const getMateriPlaceholder = () => {
    switch (type) {
      case 'agenda_harian':
        return 'Melaksanakan ulangan harian, melanjutkan bab 3 logaritma...';
      case 'agenda_mgmp':
        return 'Membahas penyusunan soal ujian tengah semester...';
      case 'jurnal_mgmp':
        return 'Telah disepakati modul ajar kelas 8 semester ganjil...';
      case 'jurnal_mengajar':
      default:
        return 'Membahas logaritma, latihan soal halaman 45...';
    }
  };

  const getKeteranganLabel = () => {
    return type.includes('mgmp') ? 'Catatan / Keterangan Tambahan' : 'Keterangan / Catatan Kejadian';
  };

  const getKeteranganPlaceholder = () => {
    return 'Misal: Berjalan lancar, dihadiri 12 orang...';
  };

  
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setMateri('');
    setKeterangan('');
    setJamKe('');
    setMediaPembelajaran('');
    setHambatanSolusi('');
    setSiswaAbsen('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapel || !materi || (!type.includes('mgmp') && !classId)) {
      showNotification('Mohon lengkapi data yang wajib!', 'error');
      return;
    }
    
    const journalData = {
      tanggal,
      class_id: type.includes('mgmp') ? null : classId,
      mapel,
      materi,
      keterangan,
      jam_ke: jamKe,
      siswa_absen: siswaAbsen,
      media_pembelajaran: mediaPembelajaran,
      hambatan_solusi: hambatanSolusi,
      recorded_by: profile.id,
      journal_type: type
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: journalData });
    } else {
      createMutation.mutate(journalData as Omit<TeachingJournal, 'id'>);
    }
  };
const handleExportCSV = () => {
    if (myJournals.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (type.includes('mgmp')) {
      csvContent += "No,Tanggal,Nama Forum MGMP,Materi/Bahasan,Keterangan\n";
      myJournals.forEach((j, idx) => {
        const row = [
          idx + 1,
          j.tanggal,
          j.mapel,
          `"${(j.materi || '').replace(/"/g, '""')}"`,
          `"${(j.keterangan || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    } else {
      csvContent += "No,Tanggal,Kelas,Mata Pelajaran,Materi Pokok,Jam Ke,Media Pembelajaran,Hambatan & Solusi,Keterangan\n";
      myJournals.forEach((j, idx) => {
        const cls = classes.find(c => c.id === j.class_id);
        const className = cls ? cls.nama_kelas : '-';
        const row = [
          idx + 1,
          j.tanggal,
          className,
          j.mapel,
          `"${(j.materi || '').replace(/"/g, '""')}"`,
          `"${(j.jam_ke || '').replace(/"/g, '""')}"`,
          `"${(j.siswa_absen || '').replace(/"/g, '""')}"`,
          `"${(j.media_pembelajaran || '').replace(/"/g, '""')}"`,
          `"${(j.hambatan_solusi || '').replace(/"/g, '""')}"`,
          `"${(j.keterangan || '').replace(/"/g, '""')}"`
        ];
        csvContent += row.join(",") + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${getFeatureTitle().replace(/\s+/g, '_')}_${String(profile.nama_lengkap).replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengunduh data format CSV!");
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

  const getIcon = () => {
    switch (type) {
      case 'agenda_harian':
        return <Briefcase className="h-5 w-5 text-indigo-700" />;
      case 'agenda_mgmp':
        return <Users className="h-5 w-5 text-emerald-700" />;
      case 'jurnal_mgmp':
        return <BookOpen className="h-5 w-5 text-teal-700" />;
      case 'jurnal_mengajar':
      default:
        return <BookOpen className="h-5 w-5 text-blue-700" />;
    }
  };

  const selectedHoliday = holidays.find(h => h.tanggal === tanggal);

  return (
    <div className="w-full relative">
      <div id={`${type}-section`} className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:hidden">
      {/* Recording Form Column */}
      <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-fit space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {getIcon()}
            <span>{editingId ? 'Edit' : 'Catat'} {getFeatureTitle()}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">{getFeatureSubtitle()}</p>
        </div>
        
        {selectedHoliday && !selectedHoliday.is_exam && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
            <Calendar className="w-8 h-8 text-red-500" />
            <h4 className="font-bold text-red-800 text-sm">Hari Libur Akademik</h4>
            <p className="text-xs text-red-600">{selectedHoliday.keterangan}</p>
            <p className="text-xs font-semibold mt-2 text-red-700 border-t border-red-100 pt-2 w-full">Pengisian jurnal tidak diperlukan.</p>
          </div>
        )}

        {selectedHoliday && selectedHoliday.is_exam && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-sm mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-amber-800">Jadwal Ujian</p>
              <p className="text-xs text-amber-700">{selectedHoliday.keterangan}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Kegiatan *</label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          {/* Hide rest of form if holiday */}
          {(!selectedHoliday || selectedHoliday.is_exam) && (
            <>
              {!type.includes('mgmp') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kelas *</label>
              <SearchableSelect
                options={[
                  { value: '', label: '-- Pilih Kelas --' },
                  ...classes.map(c => ({ value: c.id, label: `Kelas ${c.nama_kelas}`, searchStr: c.nama_kelas }))
                ]}
                value={classId}
                onChange={(val) => setClassId(val)}
                placeholder="-- Pilih Kelas --"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{getMapelLabel()}</label>
            <input
              type="text"
              required
              value={mapel}
              onChange={(e) => setMapel(e.target.value)}
              placeholder={getMapelPlaceholder()}
              className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{getMateriLabel()}</label>
            <textarea
              required
              rows={3}
              value={materi}
              onChange={(e) => setMateri(e.target.value)}
              placeholder={getMateriPlaceholder()}
              className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          {!(type === 'agenda_harian' || type === 'agenda_mgmp') && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{getKeteranganLabel()}</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={getKeteranganPlaceholder()}
              className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        )}

          {!type.includes('mgmp') && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Pelajaran / Jam Masuk Kelas</label>
                <input
                  type="text"
                  list="jam-pelajaran-options"
                  value={jamKe}
                  onChange={(e) => setJamKe(e.target.value)}
                  placeholder="Contoh: Jam ke 1-2 atau 07:30 - 08:50"
                  className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
                <datalist id="jam-pelajaran-options">
                  <option value="Jam ke-1 (07:00 - 07:40)" />
                  <option value="Jam ke-2 (07:40 - 08:20)" />
                  <option value="Jam ke-3 (08:20 - 09:00)" />
                  <option value="Jam ke-1 & 2 (07:00 - 08:20)" />
                  <option value="Jam ke-3 & 4 (08:20 - 09:55)" />
                  <option value="Jam ke-5 & 6 (09:55 - 11:15)" />
                  <option value="Jam ke-7 & 8 (11:15 - 13:10)" />
                  <option value="Jam ke-9 & 10 (13:10 - 14:30)" />
                </datalist>
              </div>

              

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Media & Sumber Pembelajaran</label>
                <input
                  type="text"
                  value={mediaPembelajaran}
                  onChange={(e) => setMediaPembelajaran(e.target.value)}
                  placeholder="Contoh: LCD Projector, Slides PowerPoint, Canva, Buku Paket"
                  className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              {type !== 'agenda_harian' && (
              <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Siswa Absen / Keterangan Kehadiran</label>
                <input
                  type="text"
                  value={siswaAbsen}
                  onChange={(e) => setSiswaAbsen(e.target.value)}
                  placeholder="Contoh: Hadir Semua, atau Budi (Sakit), Ani (Izin)"
                  className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hambatan & Solusi Pembelajaran</label>
                <textarea
                  rows={2}
                  value={hambatanSolusi}
                  onChange={(e) => setHambatanSolusi(e.target.value)}
                  placeholder="Tuliskan hambatan yang ditemui saat pembelajaran dan solusi/tindak lanjutnya..."
                  className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              </>
            )}
            </>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
            >
              {editingId ? <CheckCircle className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              <span>
                {editingId 
                  ? (updateMutation.isPending ? 'Menyimpan...' : `Perbarui ${getFeatureTitle()}`)
                  : (createMutation.isPending ? 'Menyimpan...' : `Simpan ${getFeatureTitle()}`)
                }
              </span>
            </button>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>
            </>
          )}
        </form>
      </div>

      {/* History Table Column */}
      <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Riwayat {getFeatureTitle()}</h3>
            <p className="text-xs text-slate-500">Daftar catatan {getFeatureTitle().toLowerCase()} yang telah Anda daftarkan ke sistem.</p>
          </div>
          {myJournals.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Unduh CSV</span>
              </button>
              <button
                onClick={() => setShowPrintPreview(true)}
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Cetak {getFeatureTitle()}</span>
              </button>
            </div>
          )}
        </div>

        {loadingJournals || loadingClasses ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-4 text-sm">Menyelaraskan data...</p>
          </div>
        ) : myJournals.length === 0 ? (
          <div className="p-16 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <FileText className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Belum ada catatan</p>
            <p className="text-xs text-slate-400 mt-1">Silakan isi formulir di samping untuk menambahkan catatan {getFeatureTitle().toLowerCase()} pertama Anda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myJournals.map((journal) => {
              const jClass = classes.find(c => c.id === journal.class_id);
              return (
                <div key={journal.id} className="border border-slate-200 hover:border-blue-200 hover:bg-slate-50/20 transition-all rounded-xl p-5 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md">
                        {journal.tanggal}
                      </span>
                      {!type.includes('mgmp') && (
                        <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-md">
                          Kelas {jClass ? jClass.nama_kelas : 'Umum / Tidak Diketahui'}
                        </span>
                      )}
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-md">
                        {journal.mapel}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {type === 'agenda_harian' || type === 'agenda_mgmp' ? 'Agenda: ' : 'Materi: '}
                        {journal.materi}
                      </h4>
                      {journal.keterangan && !(type === 'agenda_harian' || type === 'agenda_mgmp') && (
                        <p className="text-xs text-slate-500 mt-1 italic">Catatan: "{journal.keterangan}"</p>
                      )}
                    </div>

                    {!type.includes('mgmp') && (journal.jam_ke || journal.siswa_absen || journal.media_pembelajaran) && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                        {journal.jam_ke && (
                          <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-md px-2 py-0.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400 mr-1" />
                            <span>Jam: <span className="font-semibold text-slate-800">{journal.jam_ke}</span></span>
                          </div>
                        )}
                        
                        {journal.siswa_absen && type !== 'agenda_harian' && (
                          <div className="flex items-center bg-rose-50/40 border border-rose-100 rounded-md px-2 py-0.5">
                            <Users className="h-3.5 w-3.5 text-rose-500 mr-1" />
                            <span>Absen: <span className="font-semibold text-rose-700">{journal.siswa_absen}</span></span>
                          </div>
                        )}
                        
                        {journal.media_pembelajaran && (
                          <div className="flex items-center bg-indigo-50/40 border border-indigo-100 rounded-md px-2 py-0.5">
                            <Monitor className="h-3.5 w-3.5 text-indigo-500 mr-1" />
                            <span>Media: <span className="font-semibold text-indigo-700">{journal.media_pembelajaran}</span></span>
                          </div>
                        )}
                      </div>
                    )}

                    {!type.includes('mgmp') && type !== 'agenda_harian' && journal.hambatan_solusi && (
                      <div className="mt-2 text-xs bg-slate-50 border border-slate-200/60 rounded-lg p-2.5">
                        <span className="font-bold text-slate-700 flex items-center mb-0.5">
                          <HelpCircle className="h-3.5 w-3.5 text-blue-600 mr-1" />
                          Hambatan & Tindak Lanjut:
                        </span>
                        <p className="text-slate-600 leading-relaxed font-medium">{journal.hambatan_solusi}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => handleEdit(journal)}
                      className="p-1.5 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                      title={`Edit ${getFeatureTitle()}`}
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(journal.id)}
                      className="p-1.5 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title={`Hapus ${getFeatureTitle()}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
      {/* Printable Area - Hide from Screen */}
      <div className="hidden print:block print-area">
        <div className="flex justify-center w-full print:block print:w-full">
              {/* Paper emulation sheet */}
              <div className="bg-white w-[210mm] min-w-[210mm] shrink-0 min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between print:w-full print:min-h-0 print:block print:p-6 print:shadow-none print:border-none print:m-0 print:overflow-visible print:min-w-0 print:w-full">
                <div>
                  {/* Kop Surat */}
                  <div className="flex items-center border-b-3 border-black pb-3 mb-6">
                    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" className="w-[80px] h-[80px] shrink-0" alt="Logo Pemkot" />
                    <div className="text-center flex-1">
                      <h3 className="m-0 text-lg font-bold leading-tight text-slate-900">PEMERINTAH KOTA PALEMBANG</h3>
                      <h3 className="m-0 text-lg font-bold leading-tight text-slate-900">DINAS PENDIDIKAN</h3>
                      <h3 className="m-0 text-xl font-black leading-tight text-slate-900">SMP NEGERI 58 PALEMBANG</h3>
                      <p className="m-0 text-xs text-slate-700 leading-normal font-medium">Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
                    </div>
                    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" className="w-[80px] h-[80px] shrink-0 object-contain" alt="Logo SMP 58" />
                  </div>

                  {/* Document Title */}
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold underline leading-none uppercase">LAPORAN {getFeatureTitle()} GURU</h2>
                    <p className="mt-1.5 text-xs text-slate-700 leading-normal font-semibold">Tahun Pelajaran: 2025/2026</p>
                  </div>

                  {/* Metadata block */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-black mb-4 pb-2 border-b border-dashed border-slate-300">
                    <div>
                      <span>Nama Guru: <strong>{profile.nama_lengkap}</strong></span>
                    </div>
                    <div>
                      <span>NIP: <strong>{profile.nip || '-'}</strong></span>
                    </div>
                    <div>
                      <span>Mata Pelajaran: <strong>{profile.mapel || '-'}</strong></span>
                    </div>
                  </div>

                  {/* Table of Journals */}
                  <table className="w-full border-collapse border border-black text-xs text-black" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
                    <thead>
                      {type.includes('mgmp') ? (
                        <tr className="bg-slate-100">
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '5%' }}>No.</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '15%' }}>Tanggal</th>
                          <th className="border border-black p-2 text-left font-bold">Materi / Agenda Musyawarah</th>
                          <th className="border border-black p-2 text-left font-bold">Hasil Pertemuan / Catatan</th>
                        </tr>
                      ) : (
                        <tr className="bg-slate-100">
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '5%' }}>No.</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '12%' }}>Tanggal</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '10%' }}>Kelas</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '12%' }}>Jam</th>
                          <th className="border border-black p-2 text-left font-bold">Materi / Rencana Kegiatan</th>
                          {type !== 'agenda_harian' && (
                            <th className="border border-black p-2 text-left font-bold" style={{ width: '15%' }}>Absensi Siswa</th>
                          )}
                          <th className="border border-black p-2 text-left font-bold" style={{ width: '15%' }}>Media Pembelajaran</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {myJournals.map((journal, idx) => {
                        const jClass = classes.find(c => c.id === journal.class_id);
                        return type.includes('mgmp') ? (
                          <tr key={journal.id}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center">{journal.tanggal}</td>
                            <td className="border border-black p-1.5 font-bold">{journal.materi}</td>
                            {!(type === 'agenda_harian' || type === 'agenda_mgmp') && <td className="border border-black p-1.5">{journal.keterangan || '-'}</td>}
                          </tr>
                        ) : (
                          <tr key={journal.id}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center">{journal.tanggal}</td>
                            <td className="border border-black p-1.5 text-center">Kelas {jClass ? jClass.nama_kelas : '-'}</td>
                            <td className="border border-black p-1.5 text-center font-semibold text-slate-800">{journal.jam_ke || '-'}</td>
                            <td className="border border-black p-1.5">
                              <p className="font-bold">{journal.materi}</p>
                              {journal.keterangan && type !== 'agenda_harian' && <p className="text-slate-600 italic mt-0.5">Catatan: "{journal.keterangan}"</p>}
                              {journal.hambatan_solusi && type !== 'agenda_harian' && (
                                <p className="mt-1 text-slate-700 bg-slate-50 p-1 rounded-sm border border-slate-200">
                                  <strong>Kendala & Solusi:</strong> {journal.hambatan_solusi}
                                </p>
                              )}
                            </td>
                            {type !== 'agenda_harian' && (
                              <td className="border border-black p-1.5 text-rose-800 font-semibold">{journal.siswa_absen || 'Hadir Semua'}</td>
                            )}
                            <td className="border border-black p-1.5 text-slate-700">{journal.media_pembelajaran || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="mt-12 flex justify-between text-xs px-10" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div>
                    <p className="m-0 leading-normal">Mengetahui,</p>
                    <p className="m-0 leading-normal font-bold">Kepala SMP Negeri 58 Palembang</p>
                    <div className="h-[75px]"></div>
                    <p className="m-0 leading-normal font-bold underline">{kepalaSekolahNama}</p>
                    <p className="m-0 leading-normal text-slate-600">NIP. {kepalaSekolahNip}</p>
                  </div>
                  <div className="text-right">
                    <p className="m-0 leading-normal font-medium">Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p className="m-0 leading-normal font-bold">
                      Guru Mata Pelajaran
                    </p>
                    <div className="h-[75px]"></div>
                    <p className="m-0 leading-normal font-bold underline">{profile.nama_lengkap || '_____________________'}</p>
                    <p className="m-0 leading-normal text-slate-600">NIP. {profile.nip || '.........................'}</p>
                  </div>
                </div>
              </div>

        </div>
      </div>
      
      {/* Print Preview Modal - Only visible on screen */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-start justify-center p-4 md:p-6 no-print">
          <div className="bg-slate-100 rounded-2xl w-full max-w-[220mm] shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Control Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Printer className="h-5 w-5 text-blue-700" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Pratinjau Cetak {getFeatureTitle()}</h3>
                  <p className="text-xs text-slate-500 font-semibold">Tampilan dokumen sebelum dicetak ke kertas atau PDF.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Hubungkan Printer / Cetak
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  title="Tutup Pratinjau"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Instruction Warning for Iframe */}
            <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-3 text-xs text-amber-800 font-medium">
              💡 <strong>Tips:</strong> Jika tombol "Cetak" di atas terhambat oleh kebijakan keamanan iFrame peninjau, silakan cetak menggunakan tombol <strong>Ctrl + P</strong>, atau buka aplikasi di <strong>Tab Baru</strong> melalui menu di pojok kanan atas layar AI Studio Anda.
            </div>

            {/* Signature Customizer (no-print) */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs no-print">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Kepala Sekolah (Bisa Diubah):</label>
                <input
                  type="text"
                  value={kepalaSekolahNama}
                  onChange={(e) => {
                    setKepalaSekolahNama(e.target.value);
                    localStorage.setItem('gurupro_kepala_sekolah_nama', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">NIP Kepala Sekolah (Bisa Diubah):</label>
                <input
                  type="text"
                  value={kepalaSekolahNip}
                  onChange={(e) => {
                    setKepalaSekolahNip(e.target.value);
                    localStorage.setItem('gurupro_kepala_sekolah_nip', e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                />
              </div>
            </div>

            {/* Scrollable Document Container */}
            <div className="overflow-auto p-8 max-h-[70vh] flex justify-center bg-slate-200/50">
              {/* Paper emulation sheet */}
              <div className="bg-white w-[210mm] min-w-[210mm] shrink-0 min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between print:w-full print:min-h-0 print:block print:p-6 print:shadow-none print:border-none print:m-0 print:overflow-visible print:min-w-0 print:w-full">
                <div>
                  {/* Kop Surat */}
                  <div className="flex items-center border-b-3 border-black pb-3 mb-6">
                    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" className="w-[80px] h-[80px] shrink-0" alt="Logo Pemkot" />
                    <div className="text-center flex-1">
                      <h3 className="m-0 text-lg font-bold leading-tight text-slate-900">PEMERINTAH KOTA PALEMBANG</h3>
                      <h3 className="m-0 text-lg font-bold leading-tight text-slate-900">DINAS PENDIDIKAN</h3>
                      <h3 className="m-0 text-xl font-black leading-tight text-slate-900">SMP NEGERI 58 PALEMBANG</h3>
                      <p className="m-0 text-xs text-slate-700 leading-normal font-medium">Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
                    </div>
                    <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" className="w-[80px] h-[80px] shrink-0 object-contain" alt="Logo SMP 58" />
                  </div>

                  {/* Document Title */}
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold underline leading-none uppercase">LAPORAN {getFeatureTitle()} GURU</h2>
                    <p className="mt-1.5 text-xs text-slate-700 leading-normal font-semibold">Tahun Pelajaran: 2025/2026</p>
                  </div>

                  {/* Metadata block */}
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-black mb-4 pb-2 border-b border-dashed border-slate-300">
                    <div>
                      <span>Nama Guru: <strong>{profile.nama_lengkap}</strong></span>
                    </div>
                    <div>
                      <span>NIP: <strong>{profile.nip || '-'}</strong></span>
                    </div>
                    <div>
                      <span>Mata Pelajaran: <strong>{profile.mapel || '-'}</strong></span>
                    </div>
                  </div>

                  {/* Table of Journals */}
                  <table className="w-full border-collapse border border-black text-xs text-black" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
                    <thead>
                      {type.includes('mgmp') ? (
                        <tr className="bg-slate-100">
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '5%' }}>No.</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '15%' }}>Tanggal</th>
                          <th className="border border-black p-2 text-left font-bold">Materi / Agenda Musyawarah</th>
                          <th className="border border-black p-2 text-left font-bold">Hasil Pertemuan / Catatan</th>
                        </tr>
                      ) : (
                        <tr className="bg-slate-100">
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '5%' }}>No.</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '12%' }}>Tanggal</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '10%' }}>Kelas</th>
                          <th className="border border-black p-2 text-center font-bold" style={{ width: '12%' }}>Jam</th>
                          <th className="border border-black p-2 text-left font-bold">Materi / Rencana Kegiatan</th>
                          {type !== 'agenda_harian' && (
                            <th className="border border-black p-2 text-left font-bold" style={{ width: '15%' }}>Absensi Siswa</th>
                          )}
                          <th className="border border-black p-2 text-left font-bold" style={{ width: '15%' }}>Media Pembelajaran</th>
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {myJournals.map((journal, idx) => {
                        const jClass = classes.find(c => c.id === journal.class_id);
                        return type.includes('mgmp') ? (
                          <tr key={journal.id}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center">{journal.tanggal}</td>
                            <td className="border border-black p-1.5 font-bold">{journal.materi}</td>
                            {!(type === 'agenda_harian' || type === 'agenda_mgmp') && <td className="border border-black p-1.5">{journal.keterangan || '-'}</td>}
                          </tr>
                        ) : (
                          <tr key={journal.id}>
                            <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-black p-1.5 text-center">{journal.tanggal}</td>
                            <td className="border border-black p-1.5 text-center">Kelas {jClass ? jClass.nama_kelas : '-'}</td>
                            <td className="border border-black p-1.5 text-center font-semibold text-slate-800">{journal.jam_ke || '-'}</td>
                            <td className="border border-black p-1.5">
                              <p className="font-bold">{journal.materi}</p>
                              {journal.keterangan && type !== 'agenda_harian' && <p className="text-slate-600 italic mt-0.5">Catatan: "{journal.keterangan}"</p>}
                              {journal.hambatan_solusi && type !== 'agenda_harian' && (
                                <p className="mt-1 text-slate-700 bg-slate-50 p-1 rounded-sm border border-slate-200">
                                  <strong>Kendala & Solusi:</strong> {journal.hambatan_solusi}
                                </p>
                              )}
                            </td>
                            {type !== 'agenda_harian' && (
                              <td className="border border-black p-1.5 text-rose-800 font-semibold">{journal.siswa_absen || 'Hadir Semua'}</td>
                            )}
                            <td className="border border-black p-1.5 text-slate-700">{journal.media_pembelajaran || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="mt-12 flex justify-between text-xs px-10" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                  <div>
                    <p className="m-0 leading-normal">Mengetahui,</p>
                    <p className="m-0 leading-normal font-bold">Kepala SMP Negeri 58 Palembang</p>
                    <div className="h-[75px]"></div>
                    <p className="m-0 leading-normal font-bold underline">{kepalaSekolahNama}</p>
                    <p className="m-0 leading-normal text-slate-600">NIP. {kepalaSekolahNip}</p>
                  </div>
                  <div className="text-right">
                    <p className="m-0 leading-normal font-medium">Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p className="m-0 leading-normal font-bold">
                      Guru Mata Pelajaran
                    </p>
                    <div className="h-[75px]"></div>
                    <p className="m-0 leading-normal font-bold underline">{profile.nama_lengkap || '_____________________'}</p>
                    <p className="m-0 leading-normal text-slate-600">NIP. {profile.nip || '.........................'}</p>
                  </div>
                </div>
              </div>
            </div>
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
              Apakah Anda yakin ingin menghapus catatan {getFeatureTitle()} ini? Tindakan ini bersifat permanen dan tidak dapat dibatalkan.
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
