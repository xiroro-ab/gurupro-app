/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Papa from 'papaparse';
import { 
  BarChart, 
  Printer, 
  Download, 
  Layers, 
  FolderLock, 
  FileText, 
  ClipboardCheck, 
  HelpCircle,
  TrendingUp,
  UserX,
  X
} from 'lucide-react';
import { GuruService } from '../services/supabase';
import { Student, ClassRoom, TeacherProfile, DailyAttendance } from '../types';
import { SearchableSelect } from './SearchableSelect';

interface LaporanAbsensiProps {
  currentUser: { id: string; email: string; profile: TeacherProfile };
}

export default function LaporanAbsensi({ currentUser }: LaporanAbsensiProps) {
  const profile = currentUser.profile;
  const isWalikelas = profile.role === 'walikelas';

  const [reportType, setReportType] = useState<'walikelas' | 'mapel' | 'kegiatan'>(isWalikelas ? 'walikelas' : 'mapel');
  const [selectedClassId, setSelectedClassId] = useState('');
  const getLocalMonth = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(getLocalMonth());
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedKegiatan, setSelectedKegiatan] = useState('');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const tahunAjaran = localStorage.getItem('gurupro_tahun_ajaran') || '2025/2026';

  const [kepalaSekolahNama, setKepalaSekolahNama] = useState(localStorage.getItem('gurupro_kepala_sekolah_nama') || 'Dr. H. Ahmad Fauzi, M.Si');
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState(localStorage.getItem('gurupro_kepala_sekolah_nip') || '197402121998031001');

  // Queries
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => GuruService.getStudents()
  });

  const { data: attendances = [], isLoading: loadingAttendances } = useQuery({
    queryKey: ['attendances'],
    queryFn: () => GuruService.getAttendances()
  });

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  const { data: journals = [] } = useQuery({
    queryKey: ['journals'],
    queryFn: () => GuruService.getJournals()
  });

  // Handle class default setup
  const walikelasClass = isWalikelas ? classes.find(c => c.walikelas_id === profile.id) : null;
  const walikelasClassId = walikelasClass?.id;
  const firstClassId = classes[0]?.id;

  // Classes to show in dropdown
  const filteredClassesList = React.useMemo(() => {
    if (reportType === 'walikelas' && isWalikelas && walikelasClassId) {
      return classes.filter(c => c.id === walikelasClassId);
    }
    return classes;
  }, [classes, reportType, isWalikelas, walikelasClassId]);

  React.useEffect(() => {
    if (reportType === 'walikelas' && isWalikelas && walikelasClassId) {
      setSelectedClassId(walikelasClassId);
    } else if (filteredClassesList.length > 0) {
      // Reset selected class if current one is not in the filtered list
      const isStillValid = filteredClassesList.some(c => c.id === selectedClassId);
      if (!isStillValid) {
        setSelectedClassId(filteredClassesList[0].id);
      }
    }
  }, [filteredClassesList, isWalikelas, walikelasClassId, selectedClassId, reportType]);

  // Current active class details
  const activeClass = classes.find(c => c.id === selectedClassId);

  // Filter students for chosen class
  const classStudents = students.filter(s => s.class_id === selectedClassId);

  // Filter attendances for current month & current class's students
  const studentIds = classStudents.map(s => s.id);
  // Compute unique kegiatan names available for the selected month, class, and teacher
  const availableKegiatanList = React.useMemo(() => {
    if (reportType !== 'kegiatan') return [];
    const names = new Set<string>();
    attendances.forEach(a => {
      const isInMonth = a.tanggal.startsWith(selectedMonth);
      if (!isInMonth) return;
      if (a.keterangan && a.keterangan.startsWith('[KEG]')) {
        if (profile.role !== 'admin' && a.recorded_by !== profile.id) return;
        if (profile.role === 'admin' && selectedTeacherId && a.recorded_by !== selectedTeacherId) return;
        if (selectedClassId && !classStudents.map(s => s.id).includes(a.student_id)) return;
        
        let rest = a.keterangan.substring(5).trim();
        let name = rest.split(' - ')[0];
        if (name) names.add(name);
      }
    });
    return Array.from(names).sort();
  }, [attendances, selectedMonth, reportType, profile, selectedTeacherId, selectedClassId, classStudents]);

  React.useEffect(() => {
    if (availableKegiatanList.length > 0 && !availableKegiatanList.includes(selectedKegiatan)) {
      setSelectedKegiatan(availableKegiatanList[0]);
    } else if (availableKegiatanList.length === 0) {
      setSelectedKegiatan('');
    }
  }, [availableKegiatanList, selectedKegiatan]);

  const monthAttendances = attendances.filter(a => {
    const isInMonth = a.tanggal.startsWith(selectedMonth);
    const isOfClassStudent = studentIds.includes(a.student_id);
    if (!isInMonth || !isOfClassStudent) return false;

    const isWK = a.keterangan && a.keterangan.startsWith('[WK]');
    const isKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
    const isMapel = !isWK && !isKeg;

    if (reportType === 'walikelas') {
      return isWK;
    } else if (reportType === 'kegiatan') {
      if (!isKeg) return false;
      let rest = a.keterangan.substring(5).trim();
      let name = rest.split(' - ')[0];
      if (selectedKegiatan && name !== selectedKegiatan) return false;

      if (profile.role !== 'admin') {
        return a.recorded_by === profile.id;
      } else {
        if (selectedTeacherId) {
          return a.recorded_by === selectedTeacherId;
        }
        return true;
      }
    } else {
      // reportType === 'mapel'
      if (!isMapel) return false;
      // Filter by teacher
      if (profile.role !== 'admin') {
        // Regular teachers only print their own entries
        return a.recorded_by === profile.id;
      } else {
        // Admin can filter by a specific teacher
        if (selectedTeacherId) {
          return a.recorded_by === selectedTeacherId;
        }
        return true; // Admin views "Semua Guru Mapel"
      }
    }
  });

  const uniqueKegiatanNames = selectedKegiatan;

  // Find Wali Kelas of the active class
  const activeClassWaliKelas = React.useMemo(() => {
    if (!activeClass || !teachers) return null;
    return teachers.find(t => t.id === activeClass.walikelas_id);
  }, [activeClass, teachers]);

  // Selected Mapel Teacher (when reportType is mapel and user is admin)
  const selectedMapelTeacher = React.useMemo(() => {
    if (!selectedTeacherId || !teachers) return null;
    return teachers.find(t => t.id === selectedTeacherId);
  }, [selectedTeacherId, teachers]);

  // List of teachers for Admin Mapel filter dropdown
  const mapelTeachersList = React.useMemo(() => {
    return teachers.filter(t => t.role === 'guru' || t.role === 'walikelas');
  }, [teachers]);

  // Dynamic Signer Information
  const signerInfo = React.useMemo(() => {
    if (reportType === 'walikelas') {
      if (activeClassWaliKelas) {
        return {
          roleName: `Wali Kelas ${activeClass?.nama_kelas || ''}`,
          nama: activeClassWaliKelas.nama_lengkap,
          nip: activeClassWaliKelas.nip || '-'
        };
      }
      return {
        roleName: `Wali Kelas ${activeClass?.nama_kelas || ''}`,
        nama: '_____________________',
        nip: '.........................'
      };
    } else if (reportType === 'kegiatan') {
      return {
        roleName: 'Guru Pembina / Pelaksana Kegiatan',
        nama: profile.role === 'admin' ? profile.nama_lengkap : profile.nama_lengkap,
        nip: profile.nip || '-'
      };
    } else {
      // reportType === 'mapel'
      if (profile.role === 'admin') {
        if (selectedMapelTeacher) {
          return {
            roleName: `Guru Mata Pelajaran (${selectedMapelTeacher.mapel || 'Guru Mapel'})`,
            nama: selectedMapelTeacher.nama_lengkap,
            nip: selectedMapelTeacher.nip || '-'
          };
        }
        return {
          roleName: 'Koordinator Kurikulum / Admin',
          nama: profile.nama_lengkap,
          nip: profile.nip || '-'
        };
      } else {
        return {
          roleName: `Guru Mata Pelajaran (${profile.mapel || 'Guru Mapel'})`,
          nama: profile.nama_lengkap,
          nip: profile.nip || '-'
        };
      }
    }
  }, [reportType, activeClassWaliKelas, activeClass, profile, selectedMapelTeacher]);

  // Calculate attendance details for each student
  const studentStats = classStudents.map(student => {
    const studentAtts = monthAttendances.filter(a => a.student_id === student.id);
    
    const counts = { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
    studentAtts.forEach(a => {
      if (a.status in counts) {
        counts[a.status as keyof typeof counts]++;
      }
    });

    const totalDays = studentAtts.length;
    const rate = totalDays > 0 
      ? Math.round((counts.hadir / totalDays) * 100) 
      : 100;

    return {
      student,
      counts,
      totalDays,
      rate
    };
  });

  // Calculate overall metrics
  const totalHadir = monthAttendances.filter(a => a.status === 'hadir').length;
  const totalSakit = monthAttendances.filter(a => a.status === 'sakit').length;
  const totalIzin = monthAttendances.filter(a => a.status === 'izin').length;
  const totalAlfa = monthAttendances.filter(a => a.status === 'alfa').length;
  const totalRecords = monthAttendances.length;

  const averagePresenceRate = studentStats.length > 0
    ? Math.round(studentStats.reduce((acc, curr) => acc + curr.rate, 0) / studentStats.length)
    : 100;

  // CSV Export Trigger
  const handleExportCSV = () => {
    if (studentStats.length === 0) return;

    const dataToExport = studentStats.map((stat, idx) => ({
      No: idx + 1,
      NISN: stat.student.nisn,
      'Nama Siswa': stat.student.nama_siswa,
      Hadir: stat.counts.hadir,
      Sakit: stat.counts.sakit,
      Izin: stat.counts.izin,
      Alfa: stat.counts.alfa,
      'Persentase Kehadiran (%)': stat.rate
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const typeSuffix = reportType === 'walikelas' ? 'Wali_Kelas' : reportType === 'kegiatan' ? 'Kegiatan' : 'Guru_Mapel';
    link.setAttribute('download', `Laporan_Presensi_${activeClass?.nama_kelas || 'Kelas'}_${typeSuffix}_Bulan_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Professional Printer Function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="laporan-absensi-section" className="space-y-6">
      {/* Print Only Kop Surat Wrapper */}
      <div className="hidden print:block print-area">
        {/* Kop Surat specified in Master Prompt */}
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

        {/* Print Document Title */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline', margin: 0 }}>
            LAPORAN BULANAN PRESENSI SISWA ({reportType === 'walikelas' ? 'WALI KELAS' : reportType === 'kegiatan' ? 'KEGIATAN TAMBAHAN' : 'GURU MAPEL'})
          </h2>
          <p style={{ margin: '5px 0 0 0', fontSize: '11pt' }}>
            Kelas: <strong>{activeClass?.nama_kelas || '-'}</strong> | Periode Bulan: <strong>{selectedMonth}</strong> | Tahun Ajaran: {tahunAjaran}
          </p>
          {reportType === 'kegiatan' && uniqueKegiatanNames && (
            <p style={{ margin: '5px 0 0 0', fontSize: '11pt', fontWeight: 'bold' }}>
              Kegiatan: {uniqueKegiatanNames}
            </p>
          )}
        </div>

        {/* Print Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', wordBreak: 'break-word', border: '1px solid black' }}>
          <thead>
            <tr style={{ backgroundColor: '#f2f2f2' }}>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center', width: '5%' }}>No</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left', width: '15%' }}>NISN</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left', width: '40%' }}>Nama Siswa</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Hadir (H)</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Sakit (S)</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Izin (I)</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Alfa (A)</th>
              <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Persentase (%)</th>
            </tr>
          </thead>
          <tbody>
            {studentStats.map((stat, idx) => (
              <tr key={stat.student.id}>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{idx + 1}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', fontFamily: 'monospace' }}>{stat.student.nisn}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{stat.student.nama_siswa}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{stat.counts.hadir}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{stat.counts.sakit}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{stat.counts.izin}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{stat.counts.alfa}</td>
                <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', fontWeight: 'bold' }}>{stat.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Print Signatures */}
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
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>
              {signerInfo.roleName}
            </p>
            <div style={{ height: '70px' }}></div>
            <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{signerInfo.nama}</p>
            <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {signerInfo.nip}</p>
          </div>
        </div>
      </div>

      {/* Screen Interface Section (no-print) */}
      <div className="no-print space-y-6">
        {/* Top Controller */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Laporan Rekapitulasi Presensi</h3>
            <p className="text-xs text-slate-500">Cetak laporan bersurat dinas resmi dengan "Kop Surat" SMPN 58 Palembang atau unduh format CSV.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Report Type Toggle for Wali Kelas & Admin */}
                          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 shadow-xs">
                {(isWalikelas || profile.role === 'admin') && (
                  <button
                    onClick={() => setReportType('walikelas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reportType === 'walikelas'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    Wali Kelas
                  </button>
                )}
                <button
                  onClick={() => setReportType('mapel')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'mapel'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Guru Mapel
                </button>
                <button
                  onClick={() => setReportType('kegiatan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportType === 'kegiatan'
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Kegiatan Lain
                </button>
              </div>

            {/* Month select */}
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
            />

            {/* Class filter */}
            <div className="w-[200px]">
              <SearchableSelect
                options={[
                  { value: '', label: '-- Pilih Kelas --' },
                  ...filteredClassesList.map(c => ({
                    value: c.id,
                    label: `Kelas ${c.nama_kelas} ${isWalikelas && c.walikelas_id === profile.id ? '⭐ (Asuhan Anda)' : ''}`,
                    searchStr: c.nama_kelas
                  }))
                ]}
                value={selectedClassId}
                onChange={(val) => setSelectedClassId(val)}
                placeholder="-- Pilih Kelas --"
              />
            </div>

            {/* Teacher filter for Admin in Guru Mapel report mode */}
            {(reportType === 'mapel' || reportType === 'kegiatan') && profile.role === 'admin' && (
              <div className="w-[200px]">
                <SearchableSelect
                  options={[
                    { value: '', label: reportType === 'kegiatan' ? 'Semua Guru Pembina' : 'Semua Guru Mapel' },
                    ...mapelTeachersList.map(t => ({ 
                      value: t.id, 
                      label: `${t.nama_lengkap} (${t.mapel || 'Guru Mapel'})`,
                      searchStr: t.nip 
                    }))
                  ]}
                  value={selectedTeacherId}
                  onChange={(val) => setSelectedTeacherId(val)}
                  placeholder="Semua Guru Mapel"
                />
              </div>
            )}

            {/* Kegiatan filter */}
            {reportType === 'kegiatan' && (
              <div className="w-[200px]">
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-600 "
                >
                  {availableKegiatanList.length === 0 ? (
                    <option value="">Belum ada kegiatan</option>
                  ) : (
                    availableKegiatanList.map(k => (
                      <option key={k} value={k}>{k}</option>
                    ))
                  )}
                </select>
              </div>
            )}

            {/* Print Action */}
            <button
              onClick={() => setShowPrintPreview(true)}
              disabled={classStudents.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak PDF</span>
            </button>

            {/* Download Action */}
            <button
              onClick={handleExportCSV}
              disabled={classStudents.length === 0}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        {/* Monthly Summary Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase">Hadir Rata-rata</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-emerald-600">{averagePresenceRate}%</span>
              <span className="text-xs text-slate-400">kelas aktif</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${averagePresenceRate}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Sakit (S)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-blue-600">{totalSakit}</span>
              <span className="text-xs text-slate-400">kejadian</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${totalRecords > 0 ? (totalSakit/totalRecords)*100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Izin (I)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-amber-500">{totalIzin}</span>
              <span className="text-xs text-slate-400">kejadian</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${totalRecords > 0 ? (totalIzin/totalRecords)*100 : 0}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Alfa (A)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-extrabold text-rose-600">{totalAlfa}</span>
              <span className="text-xs text-slate-400">ketidakhadiran</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full" style={{ width: `${totalRecords > 0 ? (totalAlfa/totalRecords)*100 : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* Monthly Attendance Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {loadingClasses || loadingStudents || loadingAttendances ? (
            <div className="p-12 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
              <p className="mt-4 text-sm">Menghitung matriks presensi bulanan...</p>
            </div>
          ) : classStudents.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              <UserX className="h-10 w-10 text-slate-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-700">Roster siswa tidak ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Pilih kelas yang memiliki roster siswa terdaftar.</p>
            </div>
          ) : (
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">No</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">NISN</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Murid</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Hadir (H)</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Sakit (S)</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Izin (I)</th>
                      <th scope="col" className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Alfa (A)</th>
                      <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Rasio Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {studentStats.map((stat, idx) => (
                      <tr key={stat.student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">{stat.student.nisn}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-900">{stat.student.nama_siswa}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-emerald-600 text-sm">
                          {stat.counts.hadir}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-blue-600 text-sm">
                          {stat.counts.sakit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-amber-500 text-sm">
                          {stat.counts.izin}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center font-bold text-rose-600 text-sm">
                          {stat.counts.alfa}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm font-extrabold text-slate-800">{stat.rate}%</span>
                            <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${
                                stat.rate >= 90 ? 'bg-emerald-500' : stat.rate >= 75 ? 'bg-amber-400' : 'bg-rose-500'
                              }`} style={{ width: `${stat.rate}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                  <h3 className="font-extrabold text-slate-800 text-sm">Pratinjau Cetak Laporan</h3>
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
                    <h2 className="text-lg font-bold underline leading-none">
                      LAPORAN BULANAN PRESENSI SISWA ({reportType === 'walikelas' ? 'WALI KELAS' : reportType === 'kegiatan' ? 'KEGIATAN TAMBAHAN' : 'GURU MAPEL'})
                    </h2>
                    <p className="mt-1.5 text-sm font-medium">
                      Kelas: <strong>{activeClass?.nama_kelas || '-'}</strong> | Periode Bulan: <strong>{selectedMonth}</strong> | Tahun Ajaran: {tahunAjaran}
                    </p>
                    {reportType === 'kegiatan' && uniqueKegiatanNames && (
                      <p className="mt-1 text-sm font-bold text-slate-700">
                        Kegiatan: {uniqueKegiatanNames}
                      </p>
                    )}
                  </div>

                  {/* Table */}
                  <table className="w-full border-collapse border border-black text-xs text-black" style={{ tableLayout: 'fixed', wordBreak: 'break-word' }}>
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border border-black p-2 text-center font-bold" style={{ width: '5%' }}>No</th>
                        <th className="border border-black p-2 text-left font-bold" style={{ width: '15%' }}>NISN</th>
                        <th className="border border-black p-2 text-left font-bold" style={{ width: '40%' }}>Nama Siswa</th>
                        <th className="border border-black p-2 text-center font-bold">Hadir (H)</th>
                        <th className="border border-black p-2 text-center font-bold">Sakit (S)</th>
                        <th className="border border-black p-2 text-center font-bold">Izin (I)</th>
                        <th className="border border-black p-2 text-center font-bold">Alfa (A)</th>
                        <th className="border border-black p-2 text-center font-bold">Persentase (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentStats.map((stat, idx) => (
                        <tr key={stat.student.id}>
                          <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                          <td className="border border-black p-1.5 font-mono">{stat.student.nisn}</td>
                          <td className="border border-black p-1.5 font-semibold">{stat.student.nama_siswa}</td>
                          <td className="border border-black p-1.5 text-center">{stat.counts.hadir}</td>
                          <td className="border border-black p-1.5 text-center">{stat.counts.sakit}</td>
                          <td className="border border-black p-1.5 text-center">{stat.counts.izin}</td>
                          <td className="border border-black p-1.5 text-center">{stat.counts.alfa}</td>
                          <td className="border border-black p-1.5 text-center font-bold">{stat.rate}%</td>
                        </tr>
                      ))}
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
                      {signerInfo.roleName}
                    </p>
                    <div className="h-[75px]"></div>
                    <p className="m-0 leading-normal font-bold underline">{signerInfo.nama}</p>
                    <p className="m-0 leading-normal text-slate-600">NIP. {signerInfo.nip}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
