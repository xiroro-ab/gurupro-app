/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Layers, 
  UserCheck, 
  ClipboardList, 
  CheckCircle, 
  AlertTriangle, 
  Activity, 
  ArrowRight,
  TrendingUp,
  Calendar,
  Database,
  Copy,
  Check,
  BookOpen,
  FileText,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { GuruService } from '../services/supabase';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
  userRole: 'admin' | 'walikelas' | 'guru';
  currentUser?: { id: string; email: string; profile: any };
}

export default function DashboardOverview({ setActiveTab, userRole, currentUser }: DashboardOverviewProps) {
  const [copiedSql, setCopiedSql] = React.useState(false);
  const [tahunAjaran, setTahunAjaran] = React.useState(
    localStorage.getItem('gurupro_tahun_ajaran') || '2025/2026'
  );

  React.useEffect(() => {
    const handleChanged = () => {
      setTahunAjaran(localStorage.getItem('gurupro_tahun_ajaran') || '2025/2026');
    };
    window.addEventListener('tahun_ajaran_changed', handleChanged);
    return () => {
      window.removeEventListener('tahun_ajaran_changed', handleChanged);
    };
  }, []);
  const sqlDisableRLS = `ALTER TABLE teachers_profile DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_attendances DISABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_journals DISABLE ROW LEVEL SECURITY;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlDisableRLS);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // TanStack Queries
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

  const { data: attendances = [], isLoading: loadingAttendances } = useQuery({
    queryKey: ['attendances'],
    queryFn: () => GuruService.getAttendances()
  });

  const { data: journals = [], isLoading: loadingJournals } = useQuery({
    queryKey: ['journals'],
    queryFn: () => GuruService.getJournals()
  });

  const { data: holidays = [], isLoading: loadingHolidays } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => GuruService.getHolidays()
  });

  // Today's Date String
  const _d = new Date();
  const todayStr = `${_d.getFullYear()}-${String(_d.getMonth() + 1).padStart(2, '0')}-${String(_d.getDate()).padStart(2, '0')}`;

  // Filter today's attendances
  const todayAttendances = attendances.filter(a => a.tanggal === todayStr);

  // Stats calculations
  const totalTeachers = teachers.length;
  const totalClasses = classes.length;
  const totalStudents = students.length;

  // Attendance status mapping
  const attCount = { hadir: 0, sakit: 0, izin: 0, alfa: 0 };
  todayAttendances.forEach(a => {
    if (a.status in attCount) {
      attCount[a.status as keyof typeof attCount]++;
    }
  });

  // Calculate percentage
  const recordedCount = todayAttendances.length;
  const presenceRate = recordedCount > 0 
    ? Math.round((attCount.hadir / recordedCount) * 100) 
    : 100;

  // Chart Data: Attendance Status
  const attendanceChartData = [
    { name: 'Hadir', value: attCount.hadir || 15, color: '#10B981' }, // emerald-500
    { name: 'Sakit', value: attCount.sakit || 2, color: '#3B82F6' }, // blue-500
    { name: 'Izin', value: attCount.izin || 1, color: '#F59E0B' }, // amber-500
    { name: 'Alfa', value: attCount.alfa || 1, color: '#EF4444' }  // red-500
  ];

  // Chart Data: Student Demographics
  const genderCount = { L: 0, P: 0 };
  students.forEach(s => {
    if (s.jenis_kelamin === 'L' || s.jenis_kelamin === 'P') {
      genderCount[s.jenis_kelamin]++;
    }
  });

  const genderChartData = [
    { name: 'Laki-Laki (L)', Jumlah: genderCount.L || 12 },
    { name: 'Perempuan (P)', Jumlah: genderCount.P || 8 }
  ];

  // Calculate students with consecutive absences (2 or more days of consecutive 'alfa')
  const studentsWithConsecutiveAbsences = React.useMemo(() => {
    const attendanceByStudent: Record<string, typeof attendances> = {};
    attendances.forEach(att => {
      if (!attendanceByStudent[att.student_id]) {
        attendanceByStudent[att.student_id] = [];
      }
      attendanceByStudent[att.student_id].push(att);
    });

    const flaggedStudents: { student: any; class: any; consecutiveDays: number; dates: string[] }[] = [];

    students.forEach(student => {
      const myAtts = attendanceByStudent[student.id] || [];
      
      // Group by date to prevent duplicate counts for the same day
      const statusByDate: Record<string, string> = {};
      myAtts.forEach(att => {
        if (att.status === 'alfa') {
          statusByDate[att.tanggal] = 'alfa';
        } else if (!statusByDate[att.tanggal]) {
          statusByDate[att.tanggal] = att.status;
        }
      });

      const uniqueDates = Object.keys(statusByDate).sort((a, b) => b.localeCompare(a));

      let consecutiveDays = 0;
      const dates: string[] = [];
      for (const date of uniqueDates) {
        if (statusByDate[date] === 'alfa') {
          consecutiveDays++;
          dates.push(date);
        } else {
          break;
        }
      }

      if (consecutiveDays >= 2) {
        const classInfo = classes.find(c => c.id === student.class_id);
        flaggedStudents.push({
          student,
          class: classInfo,
          consecutiveDays,
          dates
        });
      }
    });

    return flaggedStudents.sort((a, b) => b.consecutiveDays - a.consecutiveDays);
  }, [students, attendances, classes]);

  // Fast Navigation Handlers
  const handleNav = (tabId: string) => {
    setActiveTab(tabId);
  };

  // --- ANALYTICS CHART DATA ---
  const attendanceTrendData = React.useMemo(() => {
    const dataByDate: Record<string, { tanggal: string; Hadir: number; Sakit: number; Izin: number; Alfa: number; total: number }> = {};
    attendances.forEach(a => {
      if (!dataByDate[a.tanggal]) {
        dataByDate[a.tanggal] = { tanggal: a.tanggal, Hadir: 0, Sakit: 0, Izin: 0, Alfa: 0, total: 0 };
      }
      const status = a.status.charAt(0).toUpperCase() + a.status.slice(1);
      if (status in dataByDate[a.tanggal]) {
        (dataByDate[a.tanggal] as any)[status]++;
      }
      dataByDate[a.tanggal].total++;
    });

    // Sort by date and take the last 10 days
    return Object.values(dataByDate)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      .slice(-10)
      .map(d => ({
        ...d,
        PersentaseHadir: d.total > 0 ? Math.round((d.Hadir / d.total) * 100) : 0,
        // Shorten date for display (e.g., "23 Jun")
        displayDate: (() => {
          if (!d.tanggal) return '-';
          const parsed = new Date(d.tanggal);
          return isNaN(parsed.getTime()) ? d.tanggal : parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        })()
      }));
  }, [attendances]);

  // --- TEACHER PROGRESS CALCULATIONS (FOR ADMIN) ---
  const teacherStatsList = React.useMemo(() => {
    return teachers.map(teacher => {
      // Journals count (excluding MGMP as previously done)
      const myJournals = journals.filter(j => 
        j.recorded_by === teacher.id && 
        j.journal_type !== 'agenda_mgmp' && 
        j.journal_type !== 'jurnal_mgmp'
      );
      
      // Attendance sessions count
      const teacherAtts = attendances.filter(a => a.recorded_by === teacher.id);
      const sessionsSet = new Set(teacherAtts.map(a => {
        const student = students.find(s => s.id === a.student_id);
        const classId = student?.class_id || 'unknown';
        const isWK = a.keterangan && a.keterangan.startsWith('[WK]');
        const isKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
        const type = isWK ? 'WK' : isKeg ? 'KEG' : 'MP';
        return `${a.tanggal}_${classId}_${type}`;
      }));

      // Last active date
      const dates = [
        ...myJournals.map(j => j.tanggal),
        ...teacherAtts.map(a => a.tanggal)
      ].sort();
      const lastActive = dates.length > 0 ? dates[dates.length - 1] : '-';

      return {
        id: teacher.id,
        nama: teacher.nama_lengkap,
        role: teacher.role,
        journalsCount: myJournals.length,
        attendanceSessionsCount: sessionsSet.size,
        lastActive,
      };
    });
  }, [teachers, journals, attendances, students]);

  const teacherComplianceData = React.useMemo(() => {
    // Find all distinct dates to use as a baseline for total possible working days
    const allDates = new Set([...journals.map(j => j.tanggal), ...attendances.map(a => a.tanggal)]);
    const totalDays = allDates.size || 1;

    return teacherStatsList
      .filter(t => t.role !== 'admin')
      .map(t => {
        // Find distinct days this teacher filled a journal
        const teacherJournals = journals.filter(j => j.recorded_by === t.id && j.journal_type !== 'agenda_mgmp' && j.journal_type !== 'jurnal_mgmp');
        const teacherDates = new Set(teacherJournals.map(j => j.tanggal));
        const percentage = Math.round((teacherDates.size / totalDays) * 100);

        return {
          name: t.nama.split(' ')[0], // short name
          Kepatuhan: percentage > 100 ? 100 : percentage,
          'Total Jurnal': teacherJournals.length
        };
      })
      .sort((a, b) => b.Kepatuhan - a.Kepatuhan)
      .slice(0, 8); // Top 8 teachers
  }, [teacherStatsList, journals, attendances]);

  // --- SELF PROGRESS CALCULATIONS (FOR WALI KELAS & GURU MAPEL) ---
  const loggedInTeacher = currentUser?.profile;
  
  const myJournalsList = React.useMemo(() => {
    if (!loggedInTeacher) return [];
    return journals.filter(j => j.recorded_by === loggedInTeacher.id);
  }, [journals, loggedInTeacher]);

  const myAttendances = React.useMemo(() => {
    if (!loggedInTeacher) return [];
    return attendances.filter(a => a.recorded_by === loggedInTeacher.id);
  }, [attendances, loggedInTeacher]);

  const mySessionsCount = React.useMemo(() => {
    const sessionsSet = new Set(myAttendances.map(a => {
      const student = students.find(s => s.id === a.student_id);
      const classId = student?.class_id || 'unknown';
      const isWK = a.keterangan && a.keterangan.startsWith('[WK]');
        const isKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
        const type = isWK ? 'WK' : isKeg ? 'KEG' : 'MP';
      return `${a.tanggal}_${classId}_${type}`;
    }));
    return sessionsSet.size;
  }, [myAttendances, students]);

  const myPresenceRate = React.useMemo(() => {
    if (myAttendances.length === 0) return 100;
    const hadir = myAttendances.filter(a => a.status === 'hadir').length;
    return Math.round((hadir / myAttendances.length) * 100);
  }, [myAttendances]);

  // Last 3 activities of the teacher (journals)
  const myRecentJournals = React.useMemo(() => {
    return [...myJournalsList]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 3);
  }, [myJournalsList]);

  // SMART REMINDERS
  const smartReminders = React.useMemo(() => {
    if (!loggedInTeacher || userRole === 'admin') return [];
    
    const reminders: { id: string; type: 'warning' | 'danger' | 'info'; message: string; actionText?: string; actionTab?: string }[] = [];
    
    // Check if today is a holiday
    const todayHoliday = holidays.find(h => h.tanggal === todayStr);
    
    if (todayHoliday) {
      reminders.push({
        id: 'holiday',
        type: 'info',
        message: `Hari ini adalah hari libur: ${todayHoliday.keterangan}. Anda tidak diwajibkan mengisi Jurnal Mengajar.`
      });
      return reminders; // Skip other checks if it's a holiday
    }

    // 1. Check if Journal has been filled today
    const journalToday = journals.find(j => j.tanggal === todayStr && j.recorded_by === loggedInTeacher.id);
    if (!journalToday) {
      reminders.push({
        id: 'missing_journal',
        type: 'danger',
        message: 'Anda belum mengisi Jurnal Mengajar hari ini.',
        actionText: 'Isi Jurnal',
        actionTab: 'jurnal'
      });
    }

    // 2. Check if Attendance has been filled today (If Wali Kelas)
    if (userRole === 'walikelas') {
      const myClass = classes.find(c => c.walikelas_id === loggedInTeacher.id);
      if (myClass) {
        const hasAttendanceToday = attendances.some(a => 
          a.tanggal === todayStr && 
          students.find(s => s.id === a.student_id)?.class_id === myClass.id
        );
        
        if (!hasAttendanceToday) {
          reminders.push({
            id: 'missing_attendance',
            type: 'warning',
            message: `Presensi kelas ${myClass.nama_kelas} hari ini belum diinput.`,
            actionText: 'Input Presensi',
            actionTab: 'absensi'
          });
        }
      }
    }

    return reminders;
  }, [loggedInTeacher, userRole, journals, attendances, classes, students, holidays, todayStr]);

  return (
    <div id="dashboard-overview" className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-blue-900 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-bold tracking-tight">Selamat Datang di GuruPro</h2>
          <p className="mt-2 text-slate-300 text-sm leading-relaxed">
            Sistem manajemen sekolah terpadu SMP Negeri 58 Palembang. Anda masuk sebagai 
            <span className="font-bold text-white uppercase ml-1">[{userRole}]</span>. Silakan gunakan panel navigasi atau pintasan di bawah untuk mengelola pendidik, siswa, presensi harian, dan mencetak laporan resmi.
          </p>
          <div className="mt-6 flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-blue-800/40 border border-blue-700/50 px-3 py-1.5 rounded-lg">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span>Tahun Ajaran: {tahunAjaran}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-blue-800/40 border border-blue-700/50 px-3 py-1.5 rounded-lg">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Presensi Aktif</span>
            </span>
          </div>
        </div>
        
        {/* Subtle Decorative Circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-2xl"></div>
      </div>

      {/* Smart Reminders */}
      {smartReminders.length > 0 && (
        <div className="space-y-3">
          {smartReminders.map(reminder => (
            <div 
              key={reminder.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-l-4 shadow-sm ${
                reminder.type === 'danger' 
                  ? 'bg-red-50 border-red-500 text-red-800' 
                  : reminder.type === 'warning'
                    ? 'bg-amber-50 border-amber-500 text-amber-800'
                    : 'bg-blue-50 border-blue-500 text-blue-800'
              }`}
            >
              <div className="flex items-center gap-3">
                {reminder.type === 'danger' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                {reminder.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                {reminder.type === 'info' && <Calendar className="h-5 w-5 text-blue-500" />}
                <p className="font-medium text-sm">{reminder.message}</p>
              </div>
              
              {reminder.actionText && (
                <button
                  onClick={() => setActiveTab(reminder.actionTab || 'jurnal')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    reminder.type === 'danger'
                      ? 'bg-red-100 hover:bg-red-200 text-red-700'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                  }`}
                >
                  {reminder.actionText}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Guru</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {loadingTeachers ? '...' : totalTeachers}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Pendidik Terdaftar</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shadow-xs">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Kelas</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {loadingClasses ? '...' : totalClasses}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Kelompok Belajar</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-700 flex items-center justify-center shadow-xs">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {loadingStudents ? '...' : totalStudents}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Siswa Terdata</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rasio Kehadiran</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
              {loadingAttendances ? '...' : `${presenceRate}%`}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-emerald-500" />
              <span>Hadir ({attCount.hadir} siswa)</span>
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shadow-xs">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Analytics Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Status Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-800">Status Kehadiran Hari Ini</h4>
              <p className="text-xs text-slate-500">Persentase status presensi seluruh siswa</p>
            </div>
            <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-md font-semibold text-slate-600">
              {todayStr}
            </span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={attendanceChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {attendanceChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Bar Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-base font-bold text-slate-800">Demografi Siswa</h4>
              <p className="text-xs text-slate-500">Pembagian jumlah siswa berdasarkan jenis kelamin</p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold">
              Siswa: {totalStudents}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={genderChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="Jumlah" fill="#3B82F6" radius={[8, 8, 0, 0]}>
                  <Cell fill="#1D4ED8" />
                  <Cell fill="#EC4899" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Analytics Charts Panel */}
      {userRole === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trend Line Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Tren Kehadiran Siswa</h4>
                <p className="text-xs text-slate-500">Persentase kehadiran dalam 10 hari terakhir</p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>Tren Aktif</span>
              </span>
            </div>

            <div className="h-64 mt-4">
              {attendanceTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="PersentaseHadir" name="Kehadiran (%)" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data kehadiran.</div>
              )}
            </div>
          </div>

          {/* Teacher Compliance Bar Chart */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Tingkat Kepatuhan Guru</h4>
                <p className="text-xs text-slate-500">Persentase pengisian jurnal harian oleh pendidik</p>
              </div>
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                <UserCheck className="h-3 w-3" />
                <span>Top 8 Guru</span>
              </span>
            </div>

            <div className="h-64 mt-4">
              {teacherComplianceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={teacherComplianceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                      contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Bar dataKey="Kepatuhan" name="Kepatuhan (%)" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {
                        teacherComplianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.Kepatuhan >= 80 ? '#10B981' : entry.Kepatuhan >= 50 ? '#F59E0B' : '#EF4444'} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">Belum ada data jurnal guru.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Peringatan Ketidakhadiran Beruntun (Siswa Butuh Perhatian) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 animate-bounce shrink-0" />
              <span>Deteksi Siswa dengan Absensi Alfa Beruntun</span>
            </h4>
            <p className="text-xs text-slate-500">Siswa yang tercatat tidak hadir tanpa keterangan (Alfa) selama 2 hari atau lebih secara berturut-turut.</p>
          </div>
          <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md font-bold self-start sm:self-center">
            {studentsWithConsecutiveAbsences.length} Siswa Terdeteksi
          </span>
        </div>

        {studentsWithConsecutiveAbsences.length > 0 ? (
          <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {studentsWithConsecutiveAbsences.slice(0, 5).map(({ student, class: classInfo, consecutiveDays, dates }) => (
              <div key={student.id} className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-white">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs shrink-0">
                    {consecutiveDays}H
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{student.nama_siswa}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">
                      NISN: {student.nisn} • Kelas: {classInfo?.nama_kelas || 'Tanpa Kelas'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-rose-600">{consecutiveDays} Hari Berturut-turut</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Tanggal: {dates.join(', ')}</p>
                  </div>
                  <span className="sm:hidden text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                    {consecutiveDays} Hari
                  </span>
                  <button
                    onClick={() => handleNav('laporan')}
                    className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Buka Laporan
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50/50 rounded-2xl p-6 text-center text-xs text-slate-500 font-semibold border border-dashed border-slate-200">
            Tidak ada siswa dengan ketidakhadiran beruntun saat ini. Tingkat kedisiplinan kelas luar biasa! 👍
          </div>
        )}
      </div>

      {/* Dynamic Progress Dashboard Sections */}
      {userRole === 'admin' ? (
        /* ADMIN VIEW: Progres Guru */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600 animate-pulse" />
                <span>Progres Rekapitulasi & Kinerja Guru</span>
              </h4>
              <p className="text-xs text-slate-500">Statistik real-time pengisian Jurnal Mengajar dan Presensi Siswa oleh pendidik SMPN 58 Palembang.</p>
            </div>
            <button 
              onClick={() => handleNav('progres-guru')}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
            >
              <span>Detail Progres Guru</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <th className="p-3.5 pl-4 w-12">No</th>
                  <th className="p-3.5">Nama Guru</th>
                  <th className="p-3.5">Peran Tugas</th>
                  <th className="p-3.5 text-center">Jurnal Mengajar</th>
                  <th className="p-3.5 text-center">Presensi Siswa</th>
                  <th className="p-3.5 whitespace-nowrap">Aktivitas Terakhir</th>
                  <th className="p-3.5 pr-4 text-center">Keaktifan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {teacherStatsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      Tidak ada data pendidik yang tersedia.
                    </td>
                  </tr>
                ) : (
                  teacherStatsList.map((stat, idx) => {
                    const hasActivity = stat.journalsCount > 0 || stat.attendanceSessionsCount > 0;
                    return (
                      <tr key={stat.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3.5 pl-4 text-slate-400">{idx + 1}</td>
                        <td className="p-3.5 font-semibold text-slate-900">{stat.nama}</td>
                        <td className="p-3.5">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                            stat.role === 'admin'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : stat.role === 'walikelas'
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-blue-50 text-blue-700 border-blue-100'
                          }`}>
                            {stat.role === 'admin' ? 'Admin' : stat.role === 'walikelas' ? 'Wali Kelas' : 'Guru Mapel'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center font-bold text-slate-800">{stat.journalsCount} kali</td>
                        <td className="p-3.5 text-center font-bold text-slate-800">{stat.attendanceSessionsCount} sesi</td>
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{stat.lastActive}</td>
                        <td className="p-3.5 pr-4 text-center">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            hasActivity
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${hasActivity ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                            {hasActivity ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TEACHER/WALI KELAS VIEW: Ringkasan Aktivitas & Progres Saya */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <span>Aktivitas & Progres Mengajar Anda</span>
            </h4>
            <p className="text-xs text-slate-500">Tinjauan performa pengisian mandiri Agenda Harian, Jurnal Mengajar, dan Presensi Siswa Anda.</p>
          </div>

          {/* Teacher personal stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50/80 p-4 border border-slate-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">Jurnal Diisi</span>
                <span className="text-xl font-extrabold text-slate-800">{myJournalsList.length} <span className="text-xs font-semibold text-slate-400">kali</span></span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 border border-slate-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">Presensi Kelas</span>
                <span className="text-xl font-extrabold text-slate-800">{mySessionsCount} <span className="text-xs font-semibold text-slate-400">sesi</span></span>
              </div>
            </div>

            <div className="bg-slate-50/80 p-4 border border-slate-100 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-lg shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-bold block uppercase tracking-wider">Rata-rata Kehadiran</span>
                <span className="text-xl font-extrabold text-slate-800">{myPresenceRate}%</span>
              </div>
            </div>
          </div>

          {/* Recent Teacher Journals Block */}
          <div>
            <h5 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">Jurnal Mengajar Terakhir Anda</h5>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                    <th className="p-3.5 pl-4 w-28">Tanggal</th>
                    <th className="p-3.5 w-24">Kelas</th>
                    <th className="p-3.5">Mata Pelajaran</th>
                    <th className="p-3.5">Materi Pembelajaran</th>
                    <th className="p-3.5 pr-4">Hambatan / Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myRecentJournals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                        Belum ada riwayat pengisian jurnal mengajar. Silakan isi agenda harian Anda di menu Jurnal Mengajar.
                      </td>
                    </tr>
                  ) : (
                    myRecentJournals.map(journal => {
                      const cls = classes.find(c => c.id === journal.class_id);
                      return (
                        <tr key={journal.id} className="hover:bg-slate-50/30 transition-colors">
                          <td className="p-3.5 pl-4 font-semibold text-slate-900 whitespace-nowrap">{journal.tanggal}</td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-[10px]">
                              {cls ? cls.nama_kelas : 'Umum'}
                            </span>
                          </td>
                          <td className="p-3.5 font-medium">{journal.mapel}</td>
                          <td className="p-3.5 line-clamp-1 max-w-[200px]">{journal.materi}</td>
                          <td className="p-3.5 pr-4 text-slate-500 italic max-w-[250px] truncate">{journal.hambatan_solusi || journal.keterangan || '-'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
