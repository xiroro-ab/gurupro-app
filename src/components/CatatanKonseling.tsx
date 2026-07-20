import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GuruService } from '../services/supabase';
import { TeacherProfile, Student, CounselingRecord } from '../types';
import { AlertCircle, Plus, Trash2, Edit2, ShieldAlert, Award, FileText, Search, X, Save, User, Download, Printer, Image as ImageIcon } from 'lucide-react';
import Papa from 'papaparse';
import { useNotification } from './NotificationToast';
import { ConfirmModal } from './ConfirmModal';
import { SearchableSelect } from './SearchableSelect';

interface Props {
  currentUser: {
    profile: TeacherProfile;
  };
}

export const CatatanKonseling: React.FC<Props> = ({ currentUser }) => {
  const isAdmin = currentUser.profile.role === 'admin';
  const toast = useNotification();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('all');
  
  const [kepalaSekolahNama, setKepalaSekolahNama] = useState('Drs. H. M. Ali, M.Pd');
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState('196503141990021001');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [viewPhotoData, setViewPhotoData] = useState<{url: string, title: string} | null>(null);

  const getLocalDate = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    student_id: '',
    tanggal: getLocalDate(),
    jenis: 'pelanggaran' as 'pelanggaran' | 'prestasi' | 'bimbingan',
    deskripsi: '',
    tindak_lanjut: '',
    poin: 0,
    foto: ''
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => GuruService.getStudents()
  });

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['counseling'],
    queryFn: () => GuruService.getCounselingRecords()
  });
  
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  const saveMutation = useMutation({
    mutationFn: async (record: CounselingRecord) => {
      await GuruService.saveCounselingRecord(record);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling'] });
      toast.success('Catatan berhasil disimpan');
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await GuruService.deleteCounselingRecord(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counseling'] });
      toast.success('Catatan berhasil dihapus');
      setConfirmDeleteId(null);
    }
  });

  const resetForm = () => {
    setFormData({ 
      student_id: '', 
      tanggal: getLocalDate(), 
      jenis: 'pelanggaran', 
      deskripsi: '', 
      tindak_lanjut: '', 
      poin: 0,
      foto: ''
    });
    setEditingId(null);
  };

  const handleEdit = (r: CounselingRecord) => {
    setFormData({
      student_id: r.student_id,
      tanggal: r.tanggal,
      jenis: r.jenis,
      deskripsi: r.deskripsi,
      tindak_lanjut: r.tindak_lanjut || '',
      poin: r.poin || 0,
      foto: r.foto || ''
    });
    setEditingId(r.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id || !formData.deskripsi) {
      toast.error('Lengkapi semua form wajib');
      return;
    }
    
    saveMutation.mutate({
      id: editingId || 'c_' + Date.now(),
      ...formData,
      poin: formData.jenis === 'bimbingan' ? 0 : Number(formData.poin),
      created_at: editingId ? records.find(r => r.id === editingId)?.created_at || new Date().toISOString() : new Date().toISOString(),
      teacher_id: editingId ? records.find(r => r.id === editingId)?.teacher_id || currentUser.profile.id : currentUser.profile.id
    });
  };

  // Filter records matching search
  const filteredRecords = records.filter(r => {
    const student = students.find(s => s.id === r.student_id);
    if (!student) return false;
    
    const studentNama = student.nama_siswa || '';
    const studentNisn = student.nisn || '';
    
    if (searchQuery && !studentNama.toLowerCase().includes(searchQuery.toLowerCase()) && !studentNisn.includes(searchQuery)) {
      return false;
    }
    
    // Non-admin can only see their own recorded counseling (or maybe homeroom can see their class, but keeping it simple for now)
    if (currentUser.profile.role !== 'admin' && r.teacher_id !== currentUser.profile.id) {
      return false;
    }

    if (isAdmin && filterTeacherId !== 'all' && r.teacher_id !== filterTeacherId) {
      return false;
    }
    
    return true;
  });

  // Sort by date descending
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
    const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
    const validA = !isNaN(timeA) ? timeA : 0;
    const validB = !isNaN(timeB) ? timeB : 0;
    return validB - validA;
  });

  const handleExportCSV = () => {
    if (sortedRecords.length === 0) return;

    const dataToExport = sortedRecords.map((r, idx) => {
      const student = students.find(s => s.id === r.student_id);
      const recorder = teachers.find(t => t.id === r.teacher_id);
      return {
        No: idx + 1,
        Tanggal: r.tanggal,
        'Nama Siswa': student?.nama_siswa || '-',
        NISN: student?.nisn || '-',
        Kategori: r.jenis,
        Poin: r.poin,
        Deskripsi: r.deskripsi,
        'Tindak Lanjut': r.tindak_lanjut || '-',
        'Ada Foto': r.foto ? 'Ya' : 'Tidak',
        'Dicatat Oleh': recorder?.nama_lengkap || 'Admin'
      };
    });

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Catatan_Kedisiplinan_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        toast.error('Ukuran foto maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mr-3"></div>
        <span>Memuat data konseling...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Only Kop Surat Wrapper */}
      <div className="hidden print:block print-area">
        <div className="kop-surat" style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
          <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style={{ width: '80px', height: '80px' }} alt="Logo Pemkot" />
          <div style={{ textAlign: 'center', flexGrow: 1 }}>
            <h3 style={{ margin: 0, fontSize: '14pt' }}>PEMERINTAH KOTA PALEMBANG</h3>
            <h3 style={{ margin: 0, fontSize: '14pt' }}>DINAS PENDIDIKAN</h3>
            <h3 style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>SMP NEGERI 58 PALEMBANG</h3>
            <p style={{ fontSize: '0.9em', margin: 0 }}>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
          </div>
          <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo SMP 58" />
        </div>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>
            LAPORAN CATATAN KEDISIPLINAN & KONSELING
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '11pt' }}>
            {isAdmin && filterTeacherId !== 'all' 
              ? `Guru: ${teachers.find(t => t.id === filterTeacherId)?.nama_lengkap || '-'}` 
              : `Bulan: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
            }
          </p>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>No</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Tanggal</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Nama Siswa</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Kategori</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Poin</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Deskripsi</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Foto Bukti</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.map((r, idx) => {
              const student = students.find(s => s.id === r.student_id);
              return (
                <tr key={r.id}>
                  <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{r.tanggal}</td>
                  <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{student?.nama_siswa || '-'}</td>
                  <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{r.jenis === 'pelanggaran' ? 'Pelanggaran' : r.jenis === 'prestasi' ? 'Prestasi' : 'Bimbingan'}</td>
                  <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{r.poin}</td>
                  <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{r.deskripsi}</td>
                  <td style={{ border: '1px solid black', padding: '5px', textAlign: 'center' }}>
                    {r.foto ? <img src={r.foto} alt="Bukti" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} /> : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          <div>
            <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
            <div style={{ height: '70px' }}></div>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>{isAdmin ? 'Administrator' : 'Guru Bimbingan/Wali Kelas'}</p>
            <div style={{ height: '70px' }}></div>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{currentUser.profile.nama_lengkap}</p>
            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {currentUser.profile.nip || '-'}</p>
          </div>
        </div>
      </div>

      <div className="no-print space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            Catatan Kedisiplinan & Konseling
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Catat dan pantau pelanggaran, prestasi, atau bimbingan siswa secara terstruktur.
          </p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Catatan</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Cari nama atau NISN siswa..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-shadow"
              />
            </div>
            
            {isAdmin && (
              <div className="w-full sm:w-48">
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'Semua Guru' },
                    ...teachers.map(t => ({ value: t.id, label: t.nama_lengkap, searchStr: t.nip }))
                  ]}
                  value={filterTeacherId}
                  onChange={(val) => setFilterTeacherId(val)}
                  placeholder="Semua Guru"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowPrintPreview(true)}
              disabled={sortedRecords.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={sortedRecords.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Siswa</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Keterangan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRecords.length > 0 ? (
                sortedRecords.map((r) => {
                  const student = students.find(s => s.id === r.student_id);
                  const recorder = teachers.find(t => t.id === r.teacher_id);
                  
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {(() => {
                          if (!r.tanggal) return '-';
                          const d = new Date(r.tanggal);
                          return isNaN(d.getTime()) ? r.tanggal : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{student?.nama_siswa || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{student?.nisn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {r.jenis === 'pelanggaran' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                            <ShieldAlert className="w-3.5 h-3.5" /> <span>Pelanggaran ({r.poin} poin)</span>
                          </span>
                        )}
                        {r.jenis === 'prestasi' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <Award className="w-3.5 h-3.5" /> <span>Prestasi (+{r.poin} poin)</span>
                          </span>
                        )}
                        {r.jenis === 'bimbingan' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            <FileText className="w-3.5 h-3.5" /> <span>Bimbingan</span>
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700 line-clamp-2">{r.deskripsi}</p>
                        {r.tindak_lanjut && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1"><span className="font-semibold">Tindak Lanjut:</span> {r.tindak_lanjut}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">Oleh: {recorder?.nama_lengkap || 'Admin'}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          {r.foto && (
                            <button
                              onClick={() => setViewPhotoData({ url: r.foto!, title: `Foto Kedisiplinan - ${student?.nama_siswa}` })}
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Foto"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEdit(r)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteId(r.id);
                            }}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-slate-200 mb-3" />
                      <p className="font-medium text-slate-500">Tidak ada catatan yang ditemukan</p>
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-zoomIn flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Edit Catatan' : 'Tambah Catatan Baru'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="counseling-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pilih Siswa *</label>
                  <SearchableSelect
                    options={students.map(s => ({ value: s.id, label: `${s.nama_siswa} (${s.nisn})`, searchStr: s.nisn }))}
                    value={formData.student_id}
                    onChange={(val) => setFormData({ ...formData, student_id: val })}
                    placeholder="-- Pilih Siswa --"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tanggal Kejadian *</label>
                  <input 
                    type="date"
                    required
                    value={formData.tanggal}
                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-rose-500 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all text-center ${formData.jenis === 'pelanggaran' ? 'bg-red-50 border-red-300 text-red-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="jenis" className="sr-only" checked={formData.jenis === 'pelanggaran'} onChange={() => setFormData({ ...formData, jenis: 'pelanggaran' })} />
                      <ShieldAlert className="w-5 h-5 mb-1" />
                      <span className="text-xs">Pelanggaran</span>
                    </label>
                    <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all text-center ${formData.jenis === 'prestasi' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="jenis" className="sr-only" checked={formData.jenis === 'prestasi'} onChange={() => setFormData({ ...formData, jenis: 'prestasi' })} />
                      <Award className="w-5 h-5 mb-1" />
                      <span className="text-xs">Prestasi</span>
                    </label>
                    <label className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all text-center ${formData.jenis === 'bimbingan' ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <input type="radio" name="jenis" className="sr-only" checked={formData.jenis === 'bimbingan'} onChange={() => setFormData({ ...formData, jenis: 'bimbingan' })} />
                      <FileText className="w-5 h-5 mb-1" />
                      <span className="text-xs">Bimbingan</span>
                    </label>
                  </div>
                </div>
                
                {formData.jenis !== 'bimbingan' && (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      {formData.jenis === 'prestasi' ? 'Poin Prestasi (Bonus)' : 'Poin Pelanggaran (Minus)'}
                    </label>
                    <input 
                      type="number"
                      min="0"
                      value={formData.poin}
                      onChange={e => setFormData({ ...formData, poin: Number(e.target.value) })}
                      className="w-full border-slate-200 rounded-xl focus:border-rose-500 focus:ring-rose-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi / Kronologi *</label>
                  <textarea 
                    required
                    rows={3}
                    placeholder="Ceritakan dengan singkat dan jelas..."
                    value={formData.deskripsi}
                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-rose-500 focus:ring-rose-500 resize-none"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tindak Lanjut (Opsional)</label>
                  <textarea 
                    rows={2}
                    placeholder="Penanganan yang telah atau akan dilakukan..."
                    value={formData.tindak_lanjut}
                    onChange={e => setFormData({ ...formData, tindak_lanjut: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-rose-500 focus:ring-rose-500 resize-none"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Bukti (Opsional)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl hover:border-rose-500 hover:bg-rose-50 cursor-pointer transition-colors text-sm font-medium text-slate-600">
                      <ImageIcon className="w-4 h-4" />
                      <span>{formData.foto ? 'Ganti Foto' : 'Unggah Foto'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                      />
                    </label>
                    {formData.foto && (
                      <div className="relative">
                        <img src={formData.foto} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-slate-200 shadow-sm" />
                        <button 
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, foto: '' }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
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
                form="counseling-form"
                disabled={saveMutation.isPending}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {saveMutation.isPending ? 'Menyimpan...' : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Catatan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-start justify-center p-4 md:p-6 no-print">
          <div className="bg-slate-100 rounded-2xl w-full max-w-[220mm] shadow-2xl overflow-hidden flex flex-col my-8">
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Printer className="h-5 w-5 text-rose-600" />
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Pratinjau Cetak</h3>
                  <p className="text-xs text-slate-500">Gunakan kertas ukuran A4 (Portrait)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Sekarang</span>
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border-b border-amber-200/60 px-6 py-3 text-xs text-amber-800 font-medium">
              💡 <strong>Tips:</strong> Jika tombol "Cetak Sekarang" di atas terhambat oleh kebijakan keamanan, silakan cetak menggunakan tombol <strong>Ctrl + P</strong>, atau buka aplikasi di <strong>Tab Baru</strong>.
            </div>

            <div className="bg-white border-b border-slate-200 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs no-print">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Kepala Sekolah (Bisa Diubah):</label>
                <input
                  type="text"
                  value={kepalaSekolahNama}
                  onChange={e => setKepalaSekolahNama(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">NIP Kepala Sekolah (Bisa Diubah):</label>
                <input
                  type="text"
                  value={kepalaSekolahNip}
                  onChange={e => setKepalaSekolahNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-8 flex justify-center bg-slate-200">
               <div className="w-full bg-white shadow-sm p-4 text-center rounded-lg border border-slate-300">
                  <p className="text-sm font-medium text-slate-600">Tekan "Cetak Sekarang" untuk melihat pratinjau asli sesuai format cetak browser.</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {viewPhotoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm no-print" onClick={() => setViewPhotoData(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                {viewPhotoData.title}
              </h3>
              <button 
                onClick={() => setViewPhotoData(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-50">
              <img 
                src={viewPhotoData.url} 
                alt="Bukti Foto" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Hapus Catatan Kedisiplinan"
        message="Apakah Anda yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
