import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, AlertTriangle, Save, Loader2, Database, FileText as FilePdf } from 'lucide-react';
import { downloadPdfLaporan } from '../utils/pdfExport';
import { TeacherProfile } from '../types';
import { GuruService } from '../services/supabase';
import { useNotification } from './NotificationToast';
import { ConfirmModal } from './ConfirmModal';
import { SearchableSelect } from './SearchableSelect';

interface Props {
  currentUser: { id: string; email: string; profile: TeacherProfile };
}

export default function PengaturanSistem({ currentUser }: Props) {
  const notification = useNotification();
  const [tahunAjaran, setTahunAjaran] = useState('');
  const [loadingTahun, setLoadingTahun] = useState(false);
  const [loadingClean, setLoadingClean] = useState(false);
  const [showConfirmClean, setShowConfirmClean] = useState(false);

    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  useEffect(() => {
    loadTahunAjaran();
    loadTeachers();
  }, []);
  
  const loadTeachers = async () => {
    try {
      const data = await GuruService.getTeachers();
      setTeachers(data);
    } catch (e) {
      console.warn(e);
    }
  };


  const loadTahunAjaran = async () => {
    try {
      const settings = await GuruService.getGlobalTahunAjaran();
      if (settings) {
        setTahunAjaran(settings);
      } else {
        setTahunAjaran('2025/2026');
      }
    } catch (e) {
      console.warn(e);
      setTahunAjaran('2025/2026');
    }
  };

  const handleSaveTahunAjaran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tahunAjaran.trim()) {
      notification.error('Tahun ajaran tidak boleh kosong');
      return;
    }
    
    setLoadingTahun(true);
    try {
      await GuruService.setGlobalTahunAjaran(tahunAjaran);
      // Pemicu event untuk update navbar
      localStorage.setItem('gurupro_tahun_ajaran', tahunAjaran);
      window.dispatchEvent(new Event('tahun_ajaran_changed'));
      notification.success('Tahun ajaran berhasil diperbarui');
    } catch (err: any) {
      notification.error('Gagal menyimpan tahun ajaran: ' + err.message);
    } finally {
      setLoadingTahun(false);
    }
  };

  const handleCleanData = async () => {
    setLoadingClean(true);
    try {
      await GuruService.cleanTransactionalData();
      notification.success('Data transaksi lama berhasil dibersihkan');
      setShowConfirmClean(false);
    } catch (err: any) {
      notification.error('Gagal membersihkan data: ' + err.message);
    } finally {
      setLoadingClean(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Pengaturan Sistem</h2>
        <p className="text-slate-500 text-sm mt-1">Kelola konfigurasi tahun ajaran dan bersihkan data lama.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tahun Ajaran */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Tahun Ajaran Aktif</h3>
              <p className="text-xs text-slate-500">Berlaku global untuk semua pengguna</p>
            </div>
          </div>
          
          <form onSubmit={handleSaveTahunAjaran} className="flex flex-col flex-1">
            <div className="mb-6 flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tahun Ajaran</label>
              <input
                type="text"
                value={tahunAjaran}
                onChange={(e) => setTahunAjaran(e.target.value)}
                placeholder="Contoh: 2025/2026"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold text-slate-800"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loadingTahun}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all disabled:opacity-70"
            >
              {loadingTahun ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loadingTahun ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </form>
        </div>

        {/* Clean Data */}
        <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-red-700">Bersihkan Data Lama</h3>
              <p className="text-xs text-red-500/80">Hanya lakukan saat pergantian tahun ajaran</p>
            </div>
          </div>
          
          <div className="flex flex-col flex-1">
            <div className="mb-6 flex-1 text-sm text-slate-600 bg-red-50/50 p-4 rounded-xl border border-red-100">
              <p className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Peringatan Tindakan Destruktif
              </p>
              <p className="mb-2">Tindakan ini akan menghapus data transaksional lama yang tidak diperlukan lagi pada tahun ajaran baru, seperti:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Riwayat absensi siswa</li>
                <li>Jurnal mengajar guru</li>
                <li>Catatan kedisiplinan</li>
                <li>Data nilai ujian</li>
              </ul>
              <p className="mt-3 text-red-600 text-xs font-semibold">Catatan: Data profil guru, siswa, kelas, dan jadwal pelajaran TIDAK AKAN Dihapus.</p>
            </div>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await GuruService.downloadArsipData();
                    notification.success('Berhasil mengunduh arsip data global');
                  } catch(e) {
                    notification.error('Gagal mengunduh arsip data');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 text-white hover:bg-slate-900 rounded-xl font-bold transition-all"
              >
                <Database className="w-5 h-5" />
                Download Backup JSON (Global)
              </button>
              <button
                onClick={() => setShowConfirmClean(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all"
              >
                <Trash2 className="w-5 h-5" />
                Bersihkan Data Sekarang
              </button>
            </div>
          </div>
        </div>
      
        {/* Unduh Laporan PDF */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
              <FilePdf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Laporan PDF Data Transaksi</h3>
              <p className="text-xs text-slate-500">Unduh data absensi, jurnal, nilai, dll dalam PDF</p>
            </div>
          </div>
          
          <div className="flex flex-col flex-1 space-y-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Guru (Atau Semua)</label>
              <SearchableSelect
                options={[
                  { value: '', label: 'Semua Guru (Global)' },
                  ...teachers.map(t => ({ value: t.id, label: t.nama_lengkap, searchStr: t.nip }))
                ]}
                value={selectedTeacherId}
                onChange={(val) => setSelectedTeacherId(val)}
                placeholder="Semua Guru (Global)"
              />
            </div>
            
            <button
              onClick={async () => {
                try {
                  await downloadPdfLaporan(selectedTeacherId || undefined);
                  notification.success('Berhasil mengunduh laporan PDF');
                } catch(e) {
                  notification.error('Gagal mengunduh laporan PDF');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm"
            >
              <FilePdf className="w-5 h-5" />
              Download Laporan PDF
            </button>
          </div>
        </div>

      </div>

      <ConfirmModal
        isOpen={showConfirmClean}
        title="Bersihkan Data Transaksional?"
        message="Anda yakin ingin menghapus semua data absensi, jurnal, nilai, dan catatan kedisiplinan lama? Tindakan ini TIDAK DAPAT DIBATALKAN."
        confirmText={loadingClean ? 'Membersihkan...' : 'Ya, Bersihkan Data'}
        cancelText="Batal"
        onConfirm={handleCleanData}
        onCancel={() => setShowConfirmClean(false)}
        variant="danger"
      />
    </div>
  );
}
