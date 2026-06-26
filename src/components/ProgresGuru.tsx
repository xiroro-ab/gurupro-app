/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Calendar, 
  BookOpen, 
  Printer, 
  Download, 
  ChevronRight, 
  Check, 
  ClipboardList, 
  FileText, 
  CheckSquare, 
  SlidersHorizontal,
  GraduationCap,
  Award,
  X
} from 'lucide-react';
import { GuruService } from '../services/supabase';
import { TeacherProfile, ClassRoom, TeachingJournal, DailyAttendance, Student } from '../types';
import { useNotification } from './NotificationToast';

export default function ProgresGuru() {
  const toast = useNotification();
  
  // States
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'jurnal' | 'absensi' | 'penilaian' | 'rekap_bulanan'>('jurnal');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [filterPeranAbsensi, setFilterPeranAbsensi] = useState<string>('all');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  const [kepalaSekolahNama, setKepalaSekolahNama] = useState(
    localStorage.getItem('gurupro_kepala_sekolah_nama') || 'Dr. H. Ahmad Fauzi, M.Si'
  );
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState(
    localStorage.getItem('gurupro_kepala_sekolah_nip') || '197402121998031001'
  );
  
  const [selectedRiwayat, setSelectedRiwayat] = useState<{
    class_id: string;
    mapel: string;
    tipe_nilai: string;
    semester: string;
    last_updated: string;
  } | null>(null);

  // Queries
  const { data: teachers = [], isLoading: loadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: () => GuruService.getStudents()
  });

  const { data: journals = [], isLoading: loadingJournals } = useQuery({
    queryKey: ['journals'],
    queryFn: () => GuruService.getJournals()
  });

  const { data: attendances = [], isLoading: loadingAttendances } = useQuery({
    queryKey: ['attendances'],
    queryFn: () => GuruService.getAttendances()
  });

  const { data: allGrades = [], isLoading: loadingGrades } = useQuery({
    queryKey: ['grades'],
    queryFn: () => GuruService.getGrades()
  });

  // Automatically select the first teacher if none is selected
  React.useEffect(() => {
    if (teachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
    }
  }, [teachers, selectedTeacherId]);

  // Selected Teacher Info
  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  // Filtered journals for chosen teacher (excluding MGMP as requested: "tidak perlu mgmp")
  const teacherJournals = journals.filter(j => 
    j.recorded_by === selectedTeacherId && 
    j.journal_type !== 'agenda_mgmp' && 
    j.journal_type !== 'jurnal_mgmp'
  );
  
  // Filtered journals with query, type, and class filters applied
  const filteredJournals = teacherJournals.filter(j => {
    const matchesType = filterType === 'all' || j.journal_type === filterType;
    const matchesClass = filterClassId === 'all' || j.class_id === filterClassId;
    
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery || 
      (j.materi && String(j.materi).toLowerCase().includes(searchLower)) ||
      (j.mapel && String(j.mapel).toLowerCase().includes(searchLower)) ||
      (j.keterangan && String(j.keterangan).toLowerCase().includes(searchLower)) ||
      (j.siswa_absen && String(j.siswa_absen).toLowerCase().includes(searchLower));

    return matchesType && matchesClass && matchesSearch;
  });

  // Attendance records grouped by Class and Date that were recorded by this teacher
  const teacherAttendances = attendances.filter(a => a.recorded_by === selectedTeacherId);

  // To group attendances: we look at unique date + class_id + type combinations
  const attendanceSessions = React.useMemo(() => {
    if (teacherAttendances.length === 0 || students.length === 0) return [];

    const sessionMap: { [key: string]: { 
      date: string; 
      classId: string; 
      type: 'WK' | 'MP';
      records: DailyAttendance[];
      counts: { hadir: number; sakit: number; izin: number; alfa: number }
    }} = {};

    teacherAttendances.forEach(att => {
      const student = students.find(s => s.id === att.student_id);
      if (!student) return;
      const classId = student.class_id;
      const isWK = att.keterangan && String(att.keterangan).startsWith('[WK]');
      const typeLabel = isWK ? 'WK' : 'MP';
      const key = `${att.tanggal}_${classId}_${typeLabel}`;

      if (!sessionMap[key]) {
        sessionMap[key] = {
          date: att.tanggal,
          classId: classId,
          type: typeLabel,
          records: [],
          counts: { hadir: 0, sakit: 0, izin: 0, alfa: 0 }
        };
      }

      sessionMap[key].records.push(att);
      const status = att.status;
      if (status === 'hadir' || status === 'sakit' || status === 'izin' || status === 'alfa') {
        sessionMap[key].counts[status]++;
      }
    });

    return Object.values(sessionMap).sort((a, b) => b.date.localeCompare(a.date));
  }, [teacherAttendances, students]);

  const filteredAttendanceSessions = React.useMemo(() => {
    if (filterPeranAbsensi === 'all') return attendanceSessions;
    return attendanceSessions.filter(session => session.type === filterPeranAbsensi);
  }, [attendanceSessions, filterPeranAbsensi]);

  // Export to CSV function
  const handleExportCSV = () => {
    if (!selectedTeacher) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeSubTab === 'jurnal') {
      csvContent += "No,Tanggal,Jenis Agenda,Kelas,Mapel,Jam Ke,Materi Pokok,Siswa Absen,Media Pembelajaran,Hambatan & Solusi,Keterangan\n";
      filteredJournals.forEach((j, idx) => {
        const cls = classes.find(c => c.id === j.class_id);
        const isMgmp = j.journal_type?.includes('mgmp');
        const className = cls ? cls.nama_kelas : (isMgmp ? 'MGMP' : '-');
        const typeLabel = j.journal_type === 'agenda_harian' ? 'Agenda Harian' : 
                          j.journal_type === 'jurnal_mengajar' ? 'Jurnal Mengajar' :
                          j.journal_type === 'agenda_mgmp' ? 'Agenda MGMP' : 'Jurnal MGMP';
        
        const row = [
          idx + 1,
          j.tanggal,
          typeLabel,
          className,
          `"${String(j.mapel || '').replace(/"/g, '""')}"`,
          `"${String(j.jam_ke || '').replace(/"/g, '""')}"`,
          `"${String(j.materi || '').replace(/"/g, '""')}"`,
          `"${String(isMgmp ? '-' : (j.siswa_absen || 'Hadir Semua')).replace(/"/g, '""')}"`,
          `"${String(j.media_pembelajaran || '').replace(/"/g, '""')}"`,
          `"${String(j.hambatan_solusi || '').replace(/"/g, '""')}"`,
          `"${String(j.keterangan || '').replace(/"/g, '""')}"`
        ].join(",");
        csvContent += row + "\n";
      });
    } else if (activeSubTab === 'absensi') {
      csvContent += "No,Tanggal,Kelas,Peran Presensi,Hadir,Sakit,Izin,Alfa,Total Siswa\n";
      filteredAttendanceSessions.forEach((session, idx) => {
        const cls = classes.find(c => c.id === session.classId);
        const className = cls ? cls.nama_kelas : 'Tidak Diketahui';
        const total = session.counts.hadir + session.counts.sakit + session.counts.izin + session.counts.alfa;
        const roleLabel = session.type === 'WK' ? 'Wali Kelas' : 'Guru Mapel';
        
        const row = [
          idx + 1,
          session.date,
          className,
          roleLabel,
          session.counts.hadir,
          session.counts.sakit,
          session.counts.izin,
          session.counts.alfa,
          total
        ].join(",");
        csvContent += row + "\n";
      });
    } else if (activeSubTab === 'penilaian') {
      csvContent += "No,Waktu Terakhir,Kelas,Mata Pelajaran,Tipe Nilai,Semester,Jumlah Siswa Dinilai\n";
      const myGrades = allGrades.filter(g => g.recorded_by === selectedTeacher.id);
      const groups: any = {};
      myGrades.forEach(g => {
        const key = `${g.class_id}_${g.mapel}_${g.tipe_nilai}_${g.semester}`;
        if (!groups[key]) { groups[key] = { class_id: g.class_id, mapel: g.mapel, tipe_nilai: g.tipe_nilai, semester: g.semester, count: 0, last_updated: g.created_at || new Date().toISOString() }; }
        groups[key].count++;
        if (g.created_at && g.created_at > groups[key].last_updated) { groups[key].last_updated = g.created_at; }
      });
      const groupArray = Object.values(groups).sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
      
      groupArray.forEach((g: any, idx: number) => {
        const cls = classes.find(c => c.id === g.class_id);
        const timeStr = new Date(g.last_updated).toLocaleString('id-ID', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        });
        const row = [
          idx + 1,
          `"${timeStr}"`,
          `"${cls?.nama_kelas || 'Unknown'}"`,
          `"${g.mapel}"`,
          `"${g.tipe_nilai.replace('_', ' ')}"`,
          `"${g.semester}"`,
          g.count
        ].join(",");
        csvContent += row + "\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Progres_${String(selectedTeacher.nama_lengkap).replace(/\s+/g, '_')}_${activeSubTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Berhasil mengunduh data format CSV!");
  };

  const handlePrint = () => {
    toast.info('Gunakan Ctrl+P untuk mencetak jika pratinjau cetak tidak muncul secara otomatis.', 'Info Cetak');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const renderPrintableDocument = (keyPrefix: string) => {
    if (!selectedTeacher) return null;
    return (
      <div className="bg-white text-slate-800 w-full" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
            
            {/* KOP SURAT */}
            <div style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
              <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style={{ width: '80px', height: '80px' }} alt="Logo Pemkot" referrerPolicy="no-referrer" />
              <div style={{ textAlign: 'center', flexGrow: 1 }}>
                <h3 style={{ margin: 0, fontSize: '14pt' }}>PEMERINTAH KOTA PALEMBANG</h3>
                <h3 style={{ margin: 0, fontSize: '14pt' }}>DINAS PENDIDIKAN</h3>
                <h3 style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>SMP NEGERI 58 PALEMBANG</h3>
                <p style={{ fontSize: '0.9em', margin: 0 }}>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
              </div>
              <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo SMP 58" referrerPolicy="no-referrer" />
            </div>

                {/* LAPORAN JUDUL */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '12pt', fontWeight: 'bold', textDecoration: 'underline', textTransform: 'uppercase' }}>
                    LAPORAN PROGRES KERJA GURU
                  </h3>
                  <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>
                    Kategori: {activeSubTab === 'jurnal' ? 'Jurnal Agenda Mengajar' : activeSubTab === 'absensi' ? 'Rekap Presensi Kehadiran Siswa' : activeSubTab === 'rekap_bulanan' ? 'Rekapitulasi Kinerja Bulanan' : 'Riwayat Input Nilai Siswa'}
                  </p>
                </div>

                {/* BIODATA GURU */}
                <div style={{ marginBottom: '20px', fontSize: '10pt' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '150px', padding: '3px 0' }}>Nama Lengkap Guru</td>
                        <td style={{ width: '15px' }}>:</td>
                        <td style={{ fontWeight: 'bold' }}>{selectedTeacher.nama_lengkap}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '3px 0' }}>NIP / NUPTK</td>
                        <td>:</td>
                        <td>{selectedTeacher.nip || '...................................'}</td>
                      </tr>
                      {activeSubTab !== 'jurnal' && (
                        <tr>
                          <td style={{ padding: '3px 0' }}>Jabatan / Peran</td>
                          <td>:</td>
                          <td style={{ textTransform: 'capitalize' }}>
                            {selectedTeacher.role === 'walikelas' ? 'Wali Kelas' : selectedTeacher.role === 'admin' ? 'Administrator (Master)' : 'Guru Mata Pelajaran'}
                          </td>
                        </tr>
                      )}
                      {selectedTeacher.mapel && (
                        <tr>
                          <td style={{ padding: '3px 0' }}>Mata Pelajaran Utama</td>
                          <td>:</td>
                          <td>{selectedTeacher.mapel}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* DATA TABLE */}
                {activeSubTab === 'jurnal' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center', width: '40px' }}>No</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center', width: '90px' }}>Tanggal</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Jenis</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center', width: '70px' }}>Kelas</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center', width: '60px' }}>Jam</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Materi / Rencana Kegiatan</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left', width: '150px' }}>Siswa Absen / Keterangan</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left', width: '120px' }}>Media Pembelajaran</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJournals.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ border: '1px solid black', padding: '10px', fontSize: '9pt', textAlign: 'center', fontStyle: 'italic' }}>
                            Tidak ada data agenda jurnal mengajar yang ditemukan untuk filter ini.
                          </td>
                        </tr>
                      ) : (
                        filteredJournals.map((j, idx) => {
                          const cls = classes.find(c => c.id === j.class_id);
                          const isMgmp = j.journal_type?.includes('mgmp');
                          const className = cls ? `Kelas ${cls.nama_kelas}` : (isMgmp ? '-' : '-');
                          const typeLabel = j.journal_type === 'agenda_harian' ? 'Agenda Harian' : 
                                            j.journal_type === 'jurnal_mengajar' ? 'Jurnal Mengajar' :
                                            j.journal_type === 'agenda_mgmp' ? 'Agenda MGMP' : 'Jurnal MGMP';
                          return (
                            <tr key={`${keyPrefix}-jurnal-layout-${idx}`}>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{idx + 1}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{j.tanggal}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{typeLabel}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{className}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', fontWeight: 'bold' }}>{j.jam_ke || '-'}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>
                                <strong>{j.materi}</strong>
                                {j.keterangan && <div style={{ fontStyle: 'italic', color: '#475569', marginTop: '2px' }}>Catatan: "{j.keterangan}"</div>}
                                {j.hambatan_solusi && (
                                  <div style={{ marginTop: '4px', backgroundColor: '#f8fafc', padding: '4px', border: '1px solid #e2e8f0' }}>
                                    <strong>Kendala & Solusi:</strong> {j.hambatan_solusi}
                                  </div>
                                )}
                              </td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', color: '#9f1239', fontWeight: 'bold' }}>
                                {isMgmp ? '-' : (j.siswa_absen || 'Hadir Semua')}
                              </td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', color: '#334155' }}>
                                {j.media_pembelajaran || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}
                
                {activeSubTab === 'absensi' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>No</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Tanggal Presensi</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Kelas Binaan / Mapel</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Hadir (H)</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Sakit (S)</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Izin (I)</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Alfa (A)</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Rasio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendanceSessions.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ border: '1px solid black', padding: '12px', fontSize: '9pt', textAlign: 'center', fontStyle: 'italic' }}>
                            Tidak ada data presensi siswa yang dicatat oleh guru ini.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendanceSessions.map((session, idx) => {
                          const cls = classes.find(c => c.id === session.classId);
                          const className = cls ? cls.nama_kelas : 'Tidak Diketahui';
                          const total = session.counts.hadir + session.counts.sakit + session.counts.izin + session.counts.alfa;
                          const rate = total > 0 ? Math.round((session.counts.hadir / total) * 100) : 100;
                          return (
                            <tr key={`${keyPrefix}-absensi-layout-${idx}`}>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{idx + 1}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{session.date}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>
                                Kelas {className} <span style={{ fontSize: '8pt', color: '#666' }}>({session.type === 'WK' ? 'Wali Kelas' : 'Guru Mapel'})</span>
                              </td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{session.counts.hadir}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', color: '#2563eb' }}>{session.counts.sakit}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', color: '#d97706' }}>{session.counts.izin}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>{session.counts.alfa}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', fontWeight: 'bold' }}>{rate}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {activeSubTab === 'penilaian' && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                      <tr>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>No</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Waktu Terakhir</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Kelas Binaan / Mapel</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Tipe Nilai</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'left' }}>Semester</th>
                        <th style={{ border: '1px solid black', padding: '6px', fontSize: '10pt', textAlign: 'center' }}>Siswa Dinilai</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const myGrades = allGrades.filter(g => g.recorded_by === selectedTeacher.id);
                        if (myGrades.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} style={{ border: '1px solid black', padding: '12px', fontSize: '9pt', textAlign: 'center', fontStyle: 'italic' }}>
                                Tidak ada data nilai yang dicatat oleh guru ini.
                              </td>
                            </tr>
                          );
                        }
                        const groups: any = {};
                        myGrades.forEach(g => {
                          const key = `${g.class_id}_${g.mapel}_${g.tipe_nilai}_${g.semester}`;
                          if (!groups[key]) { groups[key] = { class_id: g.class_id, mapel: g.mapel, tipe_nilai: g.tipe_nilai, semester: g.semester, count: 0, last_updated: g.created_at || new Date().toISOString() }; }
                          groups[key].count++;
                          if (g.created_at && g.created_at > groups[key].last_updated) { groups[key].last_updated = g.created_at; }
                        });
                        const groupArray = Object.values(groups).sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());

                        return groupArray.map((g: any, idx: number) => {
                          const cls = classes.find(c => c.id === g.class_id);
                          return (
                            <tr key={`${keyPrefix}-penilaian-layout-${idx}`}>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center' }}>{idx + 1}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{new Date(g.last_updated).toLocaleString('id-ID', {day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>
                                Kelas {cls?.nama_kelas || 'Unknown'} <span style={{ fontSize: '8pt', color: '#666' }}>({g.mapel})</span>
                              </td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textTransform: 'capitalize' }}>{g.tipe_nilai.replace('_', ' ')}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt' }}>{g.semester}</td>
                              <td style={{ border: '1px solid black', padding: '5px', fontSize: '9pt', textAlign: 'center', fontWeight: 'bold' }}>{g.count}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                )}

                {activeSubTab === 'rekap_bulanan' && (
                  <div style={{ marginTop: '20px' }}>
                    {(() => {
                      const now = new Date();
                      const currentMonth = now.getMonth();
                      const currentYear = now.getFullYear();
                      
                      // Filter by current month
                      const monthlyJournals = journals.filter(j => {
                        if (j.recorded_by !== selectedTeacher.id) return false;
                        const date = new Date(j.tanggal);
                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                      });

                      const monthlyAttendances = attendances.filter(a => {
                        if (a.recorded_by !== selectedTeacher.id) return false;
                        const date = new Date(a.tanggal);
                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                      });

                      const monthlyGrades = allGrades.filter(g => {
                        if (g.recorded_by !== selectedTeacher.id) return false;
                        const date = new Date(g.created_at || now);
                        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                      });

                      let totalHadir = 0;
                      let totalSiswa = 0;
                      monthlyAttendances.forEach(a => {
                        totalSiswa++;
                        if (a.status === 'hadir') totalHadir++;
                      });
                      const rataRataHadir = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

                      // For Guru Kehadiran (Count distinct days of journal entries as attendance)
                      const distinctDays = new Set(monthlyJournals.map(j => j.tanggal)).size;

                      return (
                        <div style={{ border: '1px solid black', padding: '20px' }}>
                          <h4 style={{ margin: '0 0 15px 0', fontSize: '11pt', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
                            Ringkasan Kinerja Bulan {now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                          </h4>
                          
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
                            <tbody>
                              <tr>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc', width: '60%' }}>Kehadiran Pendidik (Hari Mengajar)</td>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc', fontWeight: 'bold' }}>{distinctDays} Hari</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>Total Jurnal / Agenda Terisi</td>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc', fontWeight: 'bold' }}>{monthlyJournals.length} Agenda</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>Total Input Nilai Siswa</td>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc', fontWeight: 'bold' }}>{monthlyGrades.length} Siswa Dinilai</td>
                              </tr>
                              <tr>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc' }}>Rata-rata Kehadiran Siswa di Kelas Binaan/Mapel</td>
                                <td style={{ padding: '8px 0', borderBottom: '1px dashed #ccc', fontWeight: 'bold' }}>
                                  {totalSiswa > 0 ? `${rataRataHadir}% (${totalHadir} dari ${totalSiswa} log absensi)` : 'Belum ada data'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                          
                          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '9pt' }}>
                            <strong>Kesimpulan & Evaluasi:</strong><br />
                            Berdasarkan data sistem bulan ini, guru yang bersangkutan telah melaksanakan tugas pembelajaran dan pengisian administrasi (jurnal, absensi, dan nilai) sesuai dengan rekapitulasi di atas. Laporan ini dapat digunakan sebagai lampiran pencairan tunjangan/honor kinerja bulanan.
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SIGNATURE SECTION */}
                <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
                    <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
                    <div style={{ height: '70px' }}></div>
                    <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
                    <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Guru Pengampu / Pendidik</p>
                    <div style={{ height: '70px' }}></div>
                    <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{selectedTeacher.nama_lengkap}</p>
                    <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {selectedTeacher.nip || '.........................'}</p>
                  </div>
                </div>

      </div>
    );
  };

  return (
    <div id="progres-guru-section" className="space-y-6">
      {/* Printable Area - Hide from Screen */}
      <div className="hidden print:block print-area">
        {renderPrintableDocument('print')}
      </div>

      {/* Main Admin Screen Interface (no-print) */}
      <div className="print:hidden space-y-6">
        
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <Award className="h-5 w-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-800">Panel Pemantauan Progres Guru</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Sebagai Administrator Utama, Anda dapat memantau, mencetak, dan mengunduh seluruh progres kerja harian seluruh guru secara realtime.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
            
            <div className="flex flex-col gap-2 items-end">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintPreview(true)}
                  disabled={!selectedTeacherId}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak PDF Laporan</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={!selectedTeacherId}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Teacher Selector Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar: Teacher List */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Pilih Pendidik</h3>
              <p className="text-[10px] text-slate-400">Pilih salah satu guru untuk melacak progresnya.</p>
            </div>

            {/* Teacher search/filter inside sidebar list */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Render teachers */}
            <div className="overflow-y-auto max-h-[350px] divide-y divide-slate-100 pr-1">
              {loadingTeachers ? (
                <div className="py-8 text-center text-xs text-slate-400"><span>Memuat profil pendidik...</span></div>
              ) : teachers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Tidak ada guru terdaftar.</div>
              ) : (
                teachers
                  .filter(t => t.nama_lengkap && String(t.nama_lengkap).toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(teacher => {
                    const isSelected = teacher.id === selectedTeacherId;
                    return (
                      <button
                        key={teacher.id}
                        onClick={() => {
                          setSelectedTeacherId(teacher.id);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group mt-1 cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-50 border border-blue-100 text-blue-900 font-semibold' 
                            : 'hover:bg-slate-50 border border-transparent text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className={`text-xs truncate ${isSelected ? 'font-bold' : ''}`}>{teacher.nama_lengkap}</div>
                          <div className="text-[9px] text-slate-400 truncate font-mono">NIP: {teacher.nip || '-'}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              teacher.role === 'walikelas' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {teacher.role === 'walikelas' ? 'Wali Kelas' : 'Guru'}
                            </span>
                            {teacher.mapel && (
                              <span className="text-[8px] text-slate-500 truncate max-w-[80px]">
                                • {teacher.mapel}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform shrink-0 ${
                          isSelected ? 'text-blue-600 translate-x-0.5' : 'text-slate-300 group-hover:translate-x-0.5'
                        }`} />
                      </button>
                    );
                  })
              )}
            </div>
          </div>

          {/* Main Workspace Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* selected teacher bio header */}
            {selectedTeacher ? (
              <div className="bg-slate-800 text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                    Guru Terpilih
                  </span>
                  <h3 className="text-lg font-bold mt-1 text-white">{selectedTeacher.nama_lengkap}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-300 font-medium">
                    <span>NIP. {selectedTeacher.nip || 'Tidak Ada'}</span>
                    <span>•</span>
                    <span className="capitalize">Peran: {selectedTeacher.role === 'walikelas' ? 'Wali Kelas' : 'Guru Mapel'}</span>
                    {selectedTeacher.mapel && (
                      <>
                        <span>•</span>
                        <span>Mapel Utama: {selectedTeacher.mapel}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-700/50 p-1.5 rounded-xl border border-slate-600/30">
                  <button
                    onClick={() => setActiveSubTab('jurnal')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSubTab === 'jurnal' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Jurnal & Agenda
                  </button>
                  <button
                    onClick={() => setActiveSubTab('absensi')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSubTab === 'absensi' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Kehadiran Siswa
                  </button>
                  <button
                    onClick={() => setActiveSubTab('penilaian')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSubTab === 'penilaian' 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Penilaian Siswa
                  </button>
                  <button
                    onClick={() => setActiveSubTab('rekap_bulanan')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeSubTab === 'rekap_bulanan' 
                        ? 'bg-emerald-600 text-white' 
                        : 'text-emerald-400 hover:text-white'
                    }`}
                  >
                    Rekap Bulanan
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 p-8 text-center rounded-2xl border border-dashed border-slate-300 text-slate-500">
                Pilih guru dari daftar di samping untuk memulai.
              </div>
            )}

            {/* Sub-Tab Workspaces */}
            {selectedTeacher && (
              <div>
                {activeSubTab === 'jurnal' && (
                  <div key="tab-jurnal" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
                    
                    {/* Inner workspace filters */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Filter by Type */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipe Agenda</label>
                          <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden"
                          >
                            <option value="all">Semua Tipe</option>
                            <option value="agenda_harian">Agenda Harian</option>
                            <option value="jurnal_mengajar">Jurnal Mengajar</option>
                          </select>
                        </div>

                        {/* Filter by Class */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kelas</label>
                          <select
                            value={filterClassId}
                            onChange={(e) => setFilterClassId(e.target.value)}
                            className="bg-white border border-slate-300 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-hidden"
                          >
                            <option value="all">Semua Kelas</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>Kelas {c.nama_kelas}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Display metric totals */}
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Progres Entri</span>
                        <span className="text-2xl font-extrabold text-blue-700">{filteredJournals.length}</span>
                        <span className="text-[10px] text-slate-500 ml-1">agenda</span>
                      </div>
                    </div>

                    {/* Table list */}
                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="px-4 py-3 text-left">No</th>
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Tipe</th>
                            <th className="px-4 py-3 text-left">Kelas/Mapel</th>
                            <th className="px-4 py-3 text-left">Materi Pokok & Kegiatan</th>
                            <th className="px-4 py-3 text-left">Media</th>
                            <th className="px-4 py-3 text-left">Hambatan/Solusi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {loadingJournals ? (
                            <tr>
                              <td colSpan={7} className="text-center py-8 text-slate-400 font-medium"><span>Memuat jurnal mengajar...</span></td>
                            </tr>
                          ) : filteredJournals.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="text-center py-12 text-slate-400 font-medium italic">
                                Belum ada agenda jurnal mengajar yang sesuai filter atau diinput guru ini.
                              </td>
                            </tr>
                          ) : (
                            filteredJournals.map((j, idx) => {
                              const cls = classes.find(c => c.id === j.class_id);
                              const className = cls ? cls.nama_kelas : 'MGMP';
                              const typeLabel = j.journal_type === 'agenda_harian' ? 'Agenda Harian' : 
                                                j.journal_type === 'jurnal_mengajar' ? 'Jurnal Mengajar' :
                                                j.journal_type === 'agenda_mgmp' ? 'Agenda MGMP' : 'Jurnal MGMP';
                              return (
                                <tr key={`view-jurnal-${j.id || idx}`} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{j.tanggal}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      j.journal_type === 'agenda_harian' ? 'bg-amber-100 text-amber-800' :
                                      j.journal_type === 'jurnal_mengajar' ? 'bg-blue-100 text-blue-800' :
                                      j.journal_type === 'agenda_mgmp' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'
                                    }`}>
                                      {typeLabel}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-slate-900">Kelas {className}</div>
                                    <div className="text-[10px] text-slate-400 truncate">{j.mapel}</div>
                                    {j.jam_ke && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-sm font-medium">Jam: {j.jam_ke}</span>}
                                  </td>
                                  <td className="px-4 py-3 max-w-[200px] break-words">
                                    <div className="font-bold text-slate-800">{j.materi}</div>
                                    {j.keterangan && <div className="text-[10px] text-slate-400 mt-1">{j.keterangan}</div>}
                                    {j.siswa_absen && <div className="text-[10px] text-rose-600 mt-1 font-semibold">Absen: {j.siswa_absen}</div>}
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 italic max-w-[120px] truncate">{j.media_pembelajaran || '-'}</td>
                                  <td className="px-4 py-3 text-slate-600 max-w-[150px] break-words">{j.hambatan_solusi || '-'}</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSubTab === 'absensi' && (
                  <div key="tab-absensi" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">Sesi Presensi Siswa</h4>
                        <p className="text-[10px] text-slate-500">Daftar waktu dan kelas di mana guru ini mencatat kehadiran siswa.</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Peran Saat Absen</label>
                          <select 
                            className="w-40 border border-slate-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            value={filterPeranAbsensi}
                            onChange={(e) => setFilterPeranAbsensi(e.target.value)}
                          >
                            <option value="all">Semua Peran</option>
                            <option value="WK">Wali Kelas</option>
                            <option value="MP">Guru Mata Pelajaran</option>
                          </select>
                        </div>
                        <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-right">
                          <span className="text-[9px] font-bold text-emerald-700 block uppercase">Jumlah Sesi Input</span>
                          <span className="text-lg font-extrabold text-emerald-800">{filteredAttendanceSessions.length} sesi</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="min-w-full divide-y divide-slate-200 text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-bold">
                          <tr>
                            <th className="px-4 py-3 text-left">No</th>
                            <th className="px-4 py-3 text-left">Tanggal</th>
                            <th className="px-4 py-3 text-left">Kelas Binaan</th>
                            <th className="px-4 py-3 text-center">Hadir (H)</th>
                            <th className="px-4 py-3 text-center">Sakit (S)</th>
                            <th className="px-4 py-3 text-center">Izin (I)</th>
                            <th className="px-4 py-3 text-center">Alfa (A)</th>
                            <th className="px-4 py-3 text-right">Persentase Hadir</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {loadingAttendances ? (
                            <tr>
                              <td colSpan={8} className="text-center py-8 text-slate-400 font-medium">Memproses presensi...</td>
                            </tr>
                          ) : filteredAttendanceSessions.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-12 text-slate-400 font-medium italic">
                                Belum ada data presensi yang diinput oleh guru ini.
                              </td>
                            </tr>
                          ) : (
                            filteredAttendanceSessions.map((session, idx) => {
                              const cls = classes.find(c => c.id === session.classId);
                              const className = cls ? cls.nama_kelas : 'Tidak Diketahui';
                              const total = session.counts.hadir + session.counts.sakit + session.counts.izin + session.counts.alfa;
                              const rate = total > 0 ? Math.round((session.counts.hadir / total) * 100) : 100;
                              return (
                                <tr key={`view-absensi-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{session.date}</td>
                                  <td className="px-4 py-3">
                                    <div className="font-bold text-slate-900">Kelas {className}</div>
                                    <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                                      session.type === 'WK' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                                    }`}>
                                      {session.type === 'WK' ? 'Wali Kelas' : 'Guru Mapel'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center font-bold text-emerald-600">{session.counts.hadir}</td>
                                  <td className="px-4 py-3 text-center text-blue-600">{session.counts.sakit}</td>
                                  <td className="px-4 py-3 text-center text-amber-500">{session.counts.izin}</td>
                                  <td className="px-4 py-3 text-center font-bold text-rose-500">{session.counts.alfa}</td>
                                  <td className="px-4 py-3 text-right font-extrabold text-slate-800">{rate}%</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeSubTab === 'penilaian' && (
                  <div key="tab-penilaian" className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden space-y-4 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-800">Riwayat Input Nilai Siswa</h4>
                        <p className="text-xs text-slate-500 mt-1">Daftar kelas dan mata pelajaran yang telah dinilai.</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto text-sm border border-slate-100 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-3 w-12">No</th>
                            <th className="px-4 py-3">Waktu Terakhir</th>
                            <th className="px-4 py-3">Kelas</th>
                            <th className="px-4 py-3">Mata Pelajaran</th>
                            <th className="px-4 py-3">Tipe Nilai</th>
                            <th className="px-4 py-3">Semester</th>
                            <th className="px-4 py-3 text-center">Siswa Dinilai</th>
                            <th className="px-4 py-3 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(() => {
                            const myGrades = allGrades.filter(g => g.recorded_by === selectedTeacher.id);
                            if (loadingGrades) {
                              return <tr><td colSpan={8} className="text-center py-8 text-slate-400 font-medium">Memproses data nilai...</td></tr>;
                            }
                            if (myGrades.length === 0) {
                              return <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-medium italic">Belum ada riwayat input nilai.</td></tr>;
                            }
                            const groups: any = {};
                            myGrades.forEach(g => {
                              const key = `${g.class_id}_${g.mapel}_${g.tipe_nilai}_${g.semester}`;
                              if (!groups[key]) { groups[key] = { class_id: g.class_id, mapel: g.mapel, tipe_nilai: g.tipe_nilai, semester: g.semester, count: 0, last_updated: g.created_at || new Date().toISOString() }; }
                              groups[key].count++;
                              if (g.created_at && g.created_at > groups[key].last_updated) { groups[key].last_updated = g.created_at; }
                            });
                            const groupArray = Object.values(groups).sort((a: any, b: any) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());

                            return groupArray.map((g: any, idx: number) => {
                              const cls = classes.find(c => c.id === g.class_id);
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                                  <td className="px-4 py-3 text-sm text-slate-500">
                                    {new Date(g.last_updated).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-slate-800">{cls?.nama_kelas || 'Unknown'}</td>
                                  <td className="px-4 py-3 text-slate-700">{g.mapel}</td>
                                  <td className="px-4 py-3 text-slate-600 capitalize">{g.tipe_nilai.replace('_', ' ')}</td>
                                  <td className="px-4 py-3 text-slate-600">{g.semester}</td>
                                  <td className="px-4 py-3 text-center font-bold text-blue-600">{g.count} Siswa</td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => setSelectedRiwayat(g)}
                                      className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition-colors text-xs"
                                    >
                                      Lihat Detail
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                {activeSubTab === 'rekap_bulanan' && (
                  <div key="tab-rekap-bulanan" className="bg-white rounded-2xl border border-emerald-200/80 shadow-xs overflow-hidden p-8 text-center space-y-6">
                    <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl shadow-sm">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Laporan Kinerja Bulanan Siap Cetak</h3>
                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        Klik tombol di bawah ini untuk melihat dan mencetak Laporan Rekapitulasi Kinerja Bulanan untuk guru ini. Laporan ini cocok untuk keperluan administratif dan evaluasi.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPrintPreview(true)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-5 h-5" />
                      Lihat & Cetak Laporan Bulanan
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
      
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
              <button 
                onClick={() => setSelectedRiwayat(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 border-b border-slate-100">
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
                      const details = allGrades.filter(g => 
                        g.class_id === selectedRiwayat.class_id &&
                        g.mapel === selectedRiwayat.mapel &&
                        g.tipe_nilai === selectedRiwayat.tipe_nilai &&
                        g.semester === selectedRiwayat.semester &&
                        g.created_at === selectedRiwayat.last_updated &&
                        g.recorded_by === selectedTeacherId
                      );
                      
                      const exactMatches = details.length > 0 ? details : allGrades.filter(g => 
                        g.class_id === selectedRiwayat.class_id &&
                        g.mapel === selectedRiwayat.mapel &&
                        g.tipe_nilai === selectedRiwayat.tipe_nilai &&
                        g.semester === selectedRiwayat.semester &&
                        g.recorded_by === selectedTeacherId
                      );

                      return exactMatches.map((d, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 text-center">{idx + 1}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-slate-800">
                            {students.find(s => s.id === d.student_id)?.nama_siswa || 'Unknown'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-bold text-blue-600">{d.nilai}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{d.keterangan || '-'}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Print Preview Modal - Only visible on screen */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-start justify-center p-4 md:p-6 no-print">
          <div className="bg-slate-100 rounded-2xl w-full max-w-[220mm] shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Control Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Printer className="h-5 w-5 text-blue-700" />
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Pratinjau Cetak Laporan Progres</h3>
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
              💡 <strong>Tips:</strong> Jika tombol "Cetak" di atas terhambat oleh kebijakan keamanan, silakan cetak menggunakan tombol <strong>Ctrl + P</strong>, atau buka aplikasi di <strong>Tab Baru</strong>.
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
            <div className="overflow-y-auto p-8 max-h-[70vh] flex justify-center bg-slate-200/50">
              {/* Paper emulation sheet */}
              <div className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left">
                {renderPrintableDocument('preview')}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
