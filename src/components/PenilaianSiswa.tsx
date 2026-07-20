import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GuruService as db } from '../services/supabase';
import { TeacherProfile, ClassRoom, Student, GradeType, StudentGrade } from '../types';
import { Save, AlertCircle, CheckCircle2, Search, FileText, Printer, Download, X, Trash2 } from 'lucide-react';
import { useNotification } from './NotificationToast';
import { SearchableSelect } from './SearchableSelect';

interface PenilaianSiswaProps {
  currentUser: {
    id: string;
    email: string;
    profile: TeacherProfile;
  };
}

export default function PenilaianSiswa({ currentUser }: PenilaianSiswaProps) {
  const { profile } = currentUser;
  const isWaliKelas = profile.role === 'walikelas';
  
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'riwayat_input' | 'rekap'>('input');
  
  // Print & Download states
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [kepalaSekolahNama, setKepalaSekolahNama] = useState(
    localStorage.getItem('gurupro_kepala_sekolah_nama') || 'Dr. H. Ahmad Fauzi, M.Si'
  );
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState(
    localStorage.getItem('gurupro_kepala_sekolah_nip') || '197402121998031001'
  );

  // Data Fetching
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => db.getClasses()
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: () => db.getStudents()
  });

  const { data: allGrades = [] } = useQuery({
    queryKey: ['grades'],
    queryFn: () => db.getGrades()
  });

  const deleteGradesMutation = useMutation({
    mutationFn: (group: any) => db.deleteGrades(group.class_id, group.mapel, group.tipe_nilai, group.semester, profile.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Berhasil menghapus data nilai!');
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus data nilai: ' + error.message);
    }
  });

  const handleDeleteRiwayat = (group: any) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus seluruh nilai ${group.tipe_nilai.replace('_', ' ')} mapel ${group.mapel} kelas ini?`)) {
      deleteGradesMutation.mutate(group);
    }
  };

  // State for Input
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedMapel, setSelectedMapel] = useState(profile.mapel || '');
  const [selectedTipe, setSelectedTipe] = useState<GradeType>('tugas');
  const [semester, setSemester] = useState('Ganjil 2026/2027');
  const [keterangan, setKeterangan] = useState('');
  
  const [gradesInput, setGradesInput] = useState<Record<string, number | ''>>({});
  const [selectedRiwayat, setSelectedRiwayat] = useState<{
    class_id: string;
    mapel: string;
    tipe_nilai: string;
    semester: string;
    last_updated: string;
  } | null>(null);

  const queryClient = useQueryClient();
  const toast = useNotification();

  const myClass = isWaliKelas ? classes.find(c => c.walikelas_id === profile.id) : null;
  const inputClassStudents = students.filter(s => s.class_id === selectedClassId);
  const recapStudents = myClass ? students.filter(s => s.class_id === myClass.id) : [];

  const dbValuesString = JSON.stringify(
    inputClassStudents.map(s => {
      const found = allGrades.find(g => 
        g.student_id === s.id &&
        g.class_id === selectedClassId &&
        g.mapel === selectedMapel &&
        g.tipe_nilai === selectedTipe &&
        g.semester === semester
      );
      return { id: s.id, val: found ? found.nilai : '' };
    })
  );

  // Update grades input when filters change or when DB data changes
  useEffect(() => {
    if (selectedClassId && selectedMapel && selectedTipe && semester) {
      const parsed = JSON.parse(dbValuesString);
      const newInputs: Record<string, number | ''> = {};
      parsed.forEach((item: any) => {
        newInputs[item.id] = item.val;
      });
      setGradesInput(newInputs);
    } else {
      setGradesInput({});
    }
  }, [selectedClassId, selectedMapel, selectedTipe, semester, dbValuesString]);

  const saveMutation = useMutation({
    mutationFn: async (gradesToSave: Omit<StudentGrade, 'id' | 'created_at'>[]) => {
      return db.saveGrades(gradesToSave);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast.success('Nilai berhasil disimpan!');
    },
    onError: (err: any) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] }); // Still invalidate so UI updates with local data
      if (err.message && err.message.includes('penyimpanan lokal')) {
        toast.warn(err.message, 'Info Penyimpanan', 8000);
      } else {
        toast.error('Gagal menyimpan nilai: ' + err.message);
      }
    }
  });

  const handleSaveGrades = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !selectedMapel || !selectedTipe || !semester) {
      toast.error('Lengkapi semua filter terlebih dahulu.');
      return;
    }

    const gradesToSave: Omit<StudentGrade, 'id' | 'created_at'>[] = [];
    inputClassStudents.forEach(s => {
      const val = gradesInput[s.id];
      if (val !== '' && val !== undefined) {
        gradesToSave.push({
          student_id: s.id,
          class_id: selectedClassId,
          mapel: selectedMapel,
          tipe_nilai: selectedTipe,
          nilai: Number(val),
          keterangan: keterangan,
          semester: semester,
          recorded_by: profile.id
        });
      }
    });

    saveMutation.mutate(gradesToSave);
  };

  const calculateStudentRecap = (studentId: string, mapel: string) => {
    const sGrades = allGrades.filter(g => g.student_id === studentId && g.mapel === mapel && g.semester === semester);
    if (sGrades.length === 0) return null;
    
    // Average by type
    const getAvg = (t: GradeType) => {
      const arr = sGrades.filter(g => g.tipe_nilai === t);
      if (arr.length === 0) return 0;
      const sum = arr.reduce((a, b) => a + b.nilai, 0);
      return sum / arr.length;
    };
    
    const tugas = getAvg('tugas');
    const uh = getAvg('ulangan_harian');
    const uts = getAvg('uts');
    const uas = getAvg('uas');
    
    // Simple weighting example: Tugas 20%, UH 30%, UTS 20%, UAS 30%
    const total = (tugas * 0.2) + (uh * 0.3) + (uts * 0.2) + (uas * 0.3);
    
    return {
      tugas: tugas > 0 ? tugas.toFixed(1) : '-',
      uh: uh > 0 ? uh.toFixed(1) : '-',
      uts: uts > 0 ? uts.toFixed(1) : '-',
      uas: uas > 0 ? uas.toFixed(1) : '-',
      akhir: total > 0 ? total.toFixed(1) : '-'
    };
  };

  const handleDownloadCSV = () => {
    if (!myClass || mapelsInClass.length === 0) {
      toast.error('Tidak ada data nilai untuk diunduh.');
      return;
    }
    let csv = `Rekap Nilai Kelas ${myClass.nama_kelas} - ${semester}\n\n`;
    
    mapelsInClass.forEach(mapel => {
      csv += `Mata Pelajaran: ${mapel}\n`;
      csv += `Nama Siswa,Rata-rata Tugas,Rata-rata UH,UTS,UAS,Nilai Akhir\n`;
      recapStudents.forEach(s => {
        const recap = calculateStudentRecap(s.id, mapel);
        if (recap) {
          csv += `"${s.nama_siswa}",${recap.tugas},${recap.uh},${recap.uts},${recap.uas},${recap.akhir}\n`;
        } else {
          csv += `"${s.nama_siswa}",-,-,-,-,-\n`;
        }
      });
      csv += `\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Rekap_Nilai_${myClass.nama_kelas.replace(/\s+/g, '_')}_${semester.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Berhasil mengunduh data format CSV!');
  };

  const handleDownloadRiwayatCSV = (groupArray: any[]) => {
    if (groupArray.length === 0) {
      toast.error('Tidak ada riwayat input untuk diunduh.');
      return;
    }
    let csv = `Riwayat Input Nilai - ${profile.nama_lengkap}\n\n`;
    
    groupArray.forEach(g => {
      const cls = classes.find(c => c.id === g.class_id);
      const timeStr = new Date(g.last_updated).toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      csv += `Waktu Input: "${timeStr}"\n`;
      csv += `Kelas: "${cls?.nama_kelas || 'Unknown'}"\n`;
      csv += `Mata Pelajaran: "${g.mapel}"\n`;
      csv += `Tipe Nilai: "${g.tipe_nilai.replace('_', ' ')}"\n`;
      csv += `Semester: "${g.semester}"\n\n`;
      
      csv += `No,Nama Siswa,Nilai,Keterangan\n`;
      
      const details = allGrades.filter(ag => 
        ag.class_id === g.class_id &&
        ag.mapel === g.mapel &&
        ag.tipe_nilai === g.tipe_nilai &&
        ag.semester === g.semester &&
        ag.created_at === g.last_updated
      );
      
      const exactMatches = details.length > 0 ? details : allGrades.filter(ag => 
        ag.class_id === g.class_id &&
        ag.mapel === g.mapel &&
        ag.tipe_nilai === g.tipe_nilai &&
        ag.semester === g.semester
      );

      exactMatches.forEach((d, idx) => {
        const student = students.find(s => s.id === d.student_id);
        csv += `${idx + 1},"${student?.nama_siswa || 'Unknown'}",${d.nilai},"${d.keterangan || '-'}"\n`;
      });
      csv += `\n----------------------------------------\n\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Riwayat_Input_Nilai_${profile.nama_lengkap.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Berhasil mengunduh riwayat format CSV!');
  };

  const mapelsInClass = Array.from(new Set(allGrades.filter(g => g.class_id === myClass?.id).map(g => g.mapel)));

  const myGrades = allGrades.filter(g => g.recorded_by === profile.id);
  const riwayatGroups: any = {};
  myGrades.forEach(g => {
    const key = `${g.class_id}_${g.mapel}_${g.tipe_nilai}_${g.semester}`;
    if (!riwayatGroups[key]) { riwayatGroups[key] = { class_id: g.class_id, mapel: g.mapel, tipe_nilai: g.tipe_nilai, semester: g.semester, count: 0, last_updated: g.created_at || new Date().toISOString() }; }
    riwayatGroups[key].count++;
    if (g.created_at && g.created_at > riwayatGroups[key].last_updated) { riwayatGroups[key].last_updated = g.created_at; }
  });
  const riwayatGroupArray = Object.values(riwayatGroups).sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <FileText className="w-32 h-32" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          {isWaliKelas ? 'Penilaian Siswa & Rekap Nilai' : 'Penilaian Siswa'}
        </h2>
        <p className="text-slate-500 mt-2 font-medium max-w-2xl">
          {isWaliKelas 
            ? 'Sistem input nilai terpadu. Anda dapat menginput nilai untuk mapel yang diajarkan, dan melihat rekapitulasi nilai untuk kelas binaan Anda.'
            : 'Sistem input nilai terpadu. Pilih kelas dan mata pelajaran untuk mulai memasukkan nilai siswa.'}
        </p>
      </div>

      {/* Tabs */}
      <div className="print:hidden flex flex-wrap bg-white rounded-2xl p-1 border border-slate-200 shadow-xs max-w-lg">
        <button
          onClick={() => setActiveSubTab('input')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'input' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          Form Input Nilai
        </button>
        <button
          onClick={() => setActiveSubTab('riwayat_input')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'riwayat_input' 
              ? 'bg-blue-600 text-white shadow-sm' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          Riwayat Input
        </button>
        {isWaliKelas && (
          <button
            onClick={() => setActiveSubTab('rekap')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeSubTab === 'rekap' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            Rekap Nilai Kelas
          </button>
        )}
      </div>

      {activeSubTab === 'input' && (
        <div className="print:hidden bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kelas</label>
              <SearchableSelect
                options={[
                  { value: '', label: '-- Pilih Kelas --' },
                  ...classes.map(c => ({ value: c.id, label: c.nama_kelas, searchStr: c.nama_kelas }))
                ]}
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(val)}
                placeholder="-- Pilih Kelas --"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                placeholder="Cth: Matematika"
                className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipe Nilai</label>
              <select
                value={selectedTipe}
                onChange={(e) => setSelectedTipe(e.target.value as GradeType)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="tugas">Tugas</option>
                <option value="ulangan_harian">Ulangan Harian</option>
                <option value="uts">UTS</option>
                <option value="uas">UAS</option>
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semester</label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Ganjil 2026/2027">Ganjil 2026/2027</option>
                <option value="Genap 2026/2027">Genap 2026/2027</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Keterangan Tambahan (Opsional)</label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder="Cth: Tugas 1 Menggambar"
                className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-6">
            {!selectedClassId ? (
              <div className="text-center py-12 text-slate-400 italic font-medium">
                Pilih kelas terlebih dahulu untuk mulai menginput nilai.
              </div>
            ) : inputClassStudents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic font-medium">
                Belum ada siswa di kelas ini.
              </div>
            ) : (
              <form onSubmit={handleSaveGrades} className="space-y-6">
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">No</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">NISN</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nama Siswa</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">L/P</th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-32">Nilai (0-100)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {inputClassStudents.map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">{s.nisn}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">{s.nama_siswa}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{s.jenis_kelamin}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={gradesInput[s.id] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setGradesInput(prev => ({
                                  ...prev,
                                  [s.id]: val === '' ? '' : Number(val)
                                }));
                              }}
                              className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              placeholder="-"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'riwayat_input' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible">
          <div className="print:hidden p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Riwayat Input Nilai Anda</h3>
              <p className="text-xs text-slate-500 mt-1">Daftar kelas dan mata pelajaran yang sudah Anda input nilainya.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              {riwayatGroupArray.length > 0 && (
                <>
                  <button 
                    onClick={() => handleDownloadRiwayatCSV(riwayatGroupArray)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Unduh CSV</span>
                  </button>
                  <button 
                    onClick={() => {
                      setTimeout(() => window.print(), 500);
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Riwayat</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Nama Kepala Sekolah (Cetak):</label>
                <input type="text" value={kepalaSekolahNama} onChange={e => setKepalaSekolahNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">NIP Kepala Sekolah (Cetak):</label>
                <input type="text" value={kepalaSekolahNip} onChange={e => setKepalaSekolahNip(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            
            {riwayatGroupArray.length === 0 ? (
              <div className="print:hidden text-center py-12 text-slate-400 italic font-medium">
                Belum ada riwayat input nilai.
              </div>
            ) : (
              <div className="print:hidden overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Waktu Terakhir</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Kelas</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Mata Pelajaran</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tipe Nilai</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Semester</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Siswa Dinilai</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {riwayatGroupArray.map((g: any, idx: number) => {
                      const cls = classes.find(c => c.id === g.class_id);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                            {new Date(g.last_updated).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">{cls?.nama_kelas || 'Unknown'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">{g.mapel}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 capitalize">{g.tipe_nilai.replace('_', ' ')}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{g.semester}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-blue-600">{g.count} Siswa</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedRiwayat(g)}
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
                            >
                              Lihat Detail
                            </button>
                            <button
                              onClick={() => {
                                setSelectedClassId(g.class_id);
                                setSelectedMapel(g.mapel);
                                setSelectedTipe(g.tipe_nilai);
                                setSemester(g.semester);
                                setActiveSubTab('input');
                              }}
                              className="text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRiwayat(g)}
                              className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                              title="Hapus Nilai"
                            >
                              <Trash2 className="w-4 h-4" />
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
        </div>
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && isWaliKelas && myClass && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Pratinjau Cetak: Rekap Nilai</h3>
                <p className="text-sm text-slate-500 mt-1">Sesuaikan informasi sebelum mencetak</p>
              </div>
              <button 
                onClick={() => setShowPrintPreview(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nama Kepala Sekolah</label>
                  <input
                    type="text"
                    value={kepalaSekolahNama}
                    onChange={(e) => {
                      setKepalaSekolahNama(e.target.value);
                      localStorage.setItem('gurupro_kepala_sekolah_nama', e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">NIP Kepala Sekolah</label>
                  <input
                    type="text"
                    value={kepalaSekolahNip}
                    onChange={(e) => {
                      setKepalaSekolahNip(e.target.value);
                      localStorage.setItem('gurupro_kepala_sekolah_nip', e.target.value);
                    }}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                {/* Instruction Warning for Iframe */}
                <div className="bg-amber-50 border border-amber-200/60 px-4 py-3 rounded-xl text-xs text-amber-800 font-medium">
                  💡 <strong>Tips:</strong> Jika tombol "Cetak" di bawah terhambat oleh kebijakan keamanan (misalnya di preview browser), silakan cetak menggunakan <strong>Ctrl + P</strong> pada keyboard Anda.
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Cetak Dokumen</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Riwayat Detail Modal */}
      {selectedRiwayat && (
        <div className="fixed inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm print:hidden overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Detail Riwayat Nilai</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Kelas {classes.find(c => c.id === selectedRiwayat.class_id)?.nama_kelas || 'Unknown'} - {selectedRiwayat.mapel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    setTimeout(() => window.print(), 500);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Cetak Dokumen</span>
                </button>
                <button 
                  onClick={() => setSelectedRiwayat(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Nama Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNama} onChange={e => setKepalaSekolahNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">NIP Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNip} onChange={e => setKepalaSekolahNip(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-12">No</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nama Siswa</th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-32">Nilai</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {(() => {
                      const detailGrades = allGrades.filter(g => 
                        g.recorded_by === profile.id &&
                        g.class_id === selectedRiwayat.class_id &&
                        g.mapel === selectedRiwayat.mapel &&
                        g.tipe_nilai === selectedRiwayat.tipe_nilai &&
                        g.semester === selectedRiwayat.semester
                      );
                      
                      const clsStudents = students.filter(s => s.class_id === selectedRiwayat.class_id).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));
                      
                      let printedIdx = 0;
                      return clsStudents.map((student) => {
                        const grade = detailGrades.find(g => g.student_id === student.id);
                        if (!grade) return null;
                        
                        printedIdx++;
                        return (
                          <tr key={student.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 text-center">{printedIdx}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">
                              {student.nama_siswa}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-blue-600">{grade.nilai}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{grade.keterangan || '-'}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Content for Detail Riwayat */}
      {selectedRiwayat && (
        <div className="hidden print:block print-area print:p-8 bg-white" id="print-detail-riwayat">
          {/* Kop Surat Header */}
                    {/* Kop Surat Header */}
          <div className="kop-surat" style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style={{ width: '80px', height: '80px' }} alt="Logo Pemkot" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            <div style={{ textAlign: 'center', flexGrow: 1 }}>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>PEMERINTAH KOTA PALEMBANG</h3>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>DINAS PENDIDIKAN</h3>
              <h3 style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>SMP NEGERI 58 PALEMBANG</h3>
              <p style={{ fontSize: '0.9em', margin: 0 }}>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
            </div>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo SMP 58" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-bold uppercase underline">Detail Input Nilai</h3>
          </div>

          <div className="mb-6 text-sm">
            <table className="w-full">
              <tbody>
                <tr><td className="py-1 w-32 font-bold">Nama Guru</td><td className="py-1">: {profile.nama_lengkap}</td></tr>
                <tr><td className="py-1 font-bold">NIP</td><td className="py-1 font-mono">: {profile.nip || '-'}</td></tr>
                <tr><td className="py-1 font-bold">Kelas</td><td className="py-1">: {classes.find(c => c.id === selectedRiwayat.class_id)?.nama_kelas || 'Unknown'}</td></tr>
                <tr><td className="py-1 font-bold">Mata Pelajaran</td><td className="py-1">: {selectedRiwayat.mapel}</td></tr>
                <tr><td className="py-1 font-bold">Tipe Nilai</td><td className="py-1 capitalize">: {selectedRiwayat.tipe_nilai.replace('_', ' ')}</td></tr>
                <tr><td className="py-1 font-bold">Semester</td><td className="py-1">: {selectedRiwayat.semester}</td></tr>
                <tr><td className="py-1 font-bold">Waktu Terakhir</td><td className="py-1">: {new Date(selectedRiwayat.last_updated).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
              </tbody>
            </table>
          </div>

          <table className="w-full text-sm mb-12" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black py-2 px-3 text-center" style={{ width: '8%' }}>No</th>
                <th className="border border-black py-2 px-3 text-left">Nama Siswa</th>
                <th className="border border-black py-2 px-3 text-center" style={{ width: '15%' }}>Nilai</th>
                <th className="border border-black py-2 px-3 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const detailGrades = allGrades.filter(g => 
                  g.recorded_by === profile.id &&
                  g.class_id === selectedRiwayat.class_id &&
                  g.mapel === selectedRiwayat.mapel &&
                  g.tipe_nilai === selectedRiwayat.tipe_nilai &&
                  g.semester === selectedRiwayat.semester
                );
                
                const clsStudents = students.filter(s => s.class_id === selectedRiwayat.class_id).sort((a, b) => a.nama_siswa.localeCompare(b.nama_siswa));
                
                let printedIdx = 0;
                return clsStudents.map((student) => {
                  const grade = detailGrades.find(g => g.student_id === student.id);
                  if (!grade) return null;
                  
                  printedIdx++;
                  return (
                    <tr key={student.id}>
                      <td className="border border-black py-2 px-3 text-center">{printedIdx}</td>
                      <td className="border border-black py-2 px-3">{student.nama_siswa}</td>
                      <td className="border border-black py-2 px-3 text-center font-bold">{grade.nilai}</td>
                      <td className="border border-black py-2 px-3">{grade.keterangan || '-'}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip}</p>
            </div>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Guru Mata Pelajaran</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{profile.nama_lengkap}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {profile.nip || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Content for Riwayat */}
      {activeSubTab === 'riwayat_input' && !selectedRiwayat && (
        <div className="hidden print:block print-area print:p-8 bg-white" id="print-riwayat-nilai">
          {/* Kop Surat Header */}
          <div className="kop-surat" style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style={{ width: '80px', height: '80px' }} alt="Logo Pemkot" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            <div style={{ textAlign: 'center', flexGrow: 1 }}>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>PEMERINTAH KOTA PALEMBANG</h3>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>DINAS PENDIDIKAN</h3>
              <h3 style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>SMP NEGERI 58 PALEMBANG</h3>
              <p style={{ fontSize: '0.9em', margin: 0 }}>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
            </div>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo SMP 58" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-bold uppercase underline">Riwayat Input Nilai Guru</h3>
          </div>

          <div className="mb-6 text-sm">
            <table className="w-full">
              <tbody>
                <tr><td className="py-1 w-32 font-bold">Nama Guru</td><td className="py-1">: {profile.nama_lengkap}</td></tr>
                <tr><td className="py-1 font-bold">NIP</td><td className="py-1 font-mono">: {profile.nip || '-'}</td></tr>
              </tbody>
            </table>
          </div>

          <table className="w-full border-collapse border border-black text-sm" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-black p-2 text-center w-12">No</th>
                <th className="border border-black p-2 text-left">Waktu Terakhir</th>
                <th className="border border-black p-2 text-center">Kelas</th>
                <th className="border border-black p-2 text-left">Mata Pelajaran</th>
                <th className="border border-black p-2 text-center">Tipe Nilai</th>
                <th className="border border-black p-2 text-center">Semester</th>
                <th className="border border-black p-2 text-center">Siswa Dinilai</th>
              </tr>
            </thead>
            <tbody>
              {riwayatGroupArray.map((g: any, idx: number) => {
                const cls = classes.find(c => c.id === g.class_id);
                return (
                  <tr key={idx}>
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2">
                      {new Date(g.last_updated).toLocaleString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="border border-black p-2 text-center font-bold">{cls?.nama_kelas || 'Unknown'}</td>
                    <td className="border border-black p-2">{g.mapel}</td>
                    <td className="border border-black p-2 text-center capitalize">{g.tipe_nilai.replace('_', ' ')}</td>
                    <td className="border border-black p-2 text-center">{g.semester}</td>
                    <td className="border border-black p-2 text-center font-bold">{g.count} Siswa</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip || '-'}</p>
            </div>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Guru Mata Pelajaran</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{profile.nama_lengkap}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {profile.nip || '-'}</p>
            </div>
          </div>
        </div>
      )}

            {activeSubTab === 'rekap' && isWaliKelas && myClass && (
        <div className="print:hidden bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">Rekap Nilai: Kelas {myClass.nama_kelas}</h3>
              <div className="flex gap-4 mt-2">
                <select 
                  value={semester} 
                  onChange={(e) => setSemester(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  <option value="Ganjil 2026/2027">Ganjil 2026/2027</option>
                  <option value="Genap 2026/2027">Genap 2026/2027</option>
                  <option value="Ganjil 2027/2028">Ganjil 2027/2028</option>
                  <option value="Genap 2027/2028">Genap 2027/2028</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={handleDownloadCSV}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                Download CSV
              </button>
              <button 
                onClick={() => setTimeout(() => window.print(), 500)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                Cetak Laporan
              </button>
            </div>
          </div>
          
          <div className="p-4 sm:p-6 overflow-x-auto">
            {mapelsInClass.filter(mapel => recapStudents.some(s => calculateStudentRecap(s.id, mapel) !== null)).length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-500 font-medium">Belum ada data nilai di kelas ini pada semester yang dipilih.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {mapelsInClass.filter(mapel => recapStudents.some(s => calculateStudentRecap(s.id, mapel) !== null)).map(mapel => (
                  <div key={mapel} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
                      <span>Mata Pelajaran: {mapel}</span>
                    </div>
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase w-16">No</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Nama Siswa</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">Tugas</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">UH</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">UTS</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase w-20">UAS</th>
                          <th className="px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase w-24">Akhir</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {recapStudents.map((s, idx) => {
                          const recap = calculateStudentRecap(s.id, mapel);
                          if (!recap) return null; // Don't show students without grades
                          return (
                            <tr key={s.id} className="hover:bg-slate-50">
                              <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{idx + 1}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap font-medium text-slate-800">{s.nama_siswa}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-center text-slate-600 font-mono">{recap.tugas}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-center text-slate-600 font-mono">{recap.uh}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-center text-slate-600 font-mono">{recap.uts}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-center text-slate-600 font-mono">{recap.uas}</td>
                              <td className="px-4 py-2.5 whitespace-nowrap text-center font-bold text-blue-600 font-mono bg-blue-50/50">{recap.akhir}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Print Content */}
      {activeSubTab === 'rekap' && isWaliKelas && myClass && (
        <div className="hidden print:block print-area print:p-8 bg-white" id="print-rekap-nilai">
          {/* Kop Surat Header */}
                    {/* Kop Surat Header */}
          <div className="kop-surat" style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style={{ width: '80px', height: '80px' }} alt="Logo Pemkot" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            <div style={{ textAlign: 'center', flexGrow: 1 }}>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>PEMERINTAH KOTA PALEMBANG</h3>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>DINAS PENDIDIKAN</h3>
              <h3 style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>SMP NEGERI 58 PALEMBANG</h3>
              <p style={{ fontSize: '0.9em', margin: 0 }}>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
            </div>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo SMP 58" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          </div>

          <div className="text-center mb-8">
            <h3 className="text-lg font-bold uppercase underline">Rekapitulasi Nilai Siswa</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 w-32 font-bold">Wali Kelas</td><td className="py-1">: {profile.nama_lengkap}</td></tr>
                  <tr><td className="py-1 font-bold">NIP</td><td className="py-1 font-mono">: {profile.nip}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <table className="w-full">
                <tbody>
                  <tr><td className="py-1 w-32 font-bold">Kelas</td><td className="py-1 font-bold">: {myClass.nama_kelas}</td></tr>
                  <tr><td className="py-1 font-bold">Semester</td><td className="py-1">: {semester}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-8">
            {mapelsInClass.map(mapel => (
              <div key={mapel}>
                <div className="font-bold text-sm mb-2 border-b border-black pb-1">Mata Pelajaran: {mapel}</div>
                <table className="w-full border-collapse border border-black text-[11px]" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black p-2 text-left w-10">No</th>
                      <th className="border border-black p-2 text-left">Nama Siswa</th>
                      <th className="border border-black p-2 text-center w-16">Tugas</th>
                      <th className="border border-black p-2 text-center w-16">UH</th>
                      <th className="border border-black p-2 text-center w-16">UTS</th>
                      <th className="border border-black p-2 text-center w-16">UAS</th>
                      <th className="border border-black p-2 text-center w-20">Nilai Akhir</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recapStudents.map((s, idx) => {
                      const recap = calculateStudentRecap(s.id, mapel);
                      return (
                        <tr key={s.id}>
                          <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-bold">{s.nama_siswa}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{recap ? recap.tugas : '-'}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{recap ? recap.uh : '-'}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{recap ? recap.uts : '-'}</td>
                          <td className="border border-black p-1.5 text-center font-mono">{recap ? recap.uas : '-'}</td>
                          <td className="border border-black p-1.5 text-center font-bold font-mono">{recap ? recap.akhir : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

                    <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip}</p>
            </div>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Wali Kelas {myClass.nama_kelas}</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{profile.nama_lengkap}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {profile.nip || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
