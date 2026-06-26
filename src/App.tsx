/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { GuruService, testSupabaseConnection, supabase } from './services/supabase';
import { TeacherProfile } from './types';

// Importing modular pages/components
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import KelolaGuru from './components/KelolaGuru';
import KelolaSiswa from './components/KelolaSiswa';
import KelolaKelas from './components/KelolaKelas';
import AbsensiHarian from './components/AbsensiHarian';
import JurnalMengajar from './components/JurnalMengajar';
import LaporanAbsensi from './components/LaporanAbsensi';
import Profile from './components/Profile';
import ProgresGuru from './components/ProgresGuru';
import { KalenderAkademik } from './components/KalenderAkademik';
import { PengumumanMading } from './components/PengumumanMading';
import { CatatanKonseling } from './components/CatatanKonseling';
import { JadwalPelajaran } from './components/JadwalPelajaran';

import SegeraHadir from './components/SegeraHadir';
import PenilaianSiswa from './components/PenilaianSiswa';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; profile: TeacherProfile } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Connection states
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSupabaseReachable, setIsSupabaseReachable] = useState(false);
  const [storageMode, setStorageMode] = useState<'supabase' | 'local'>('supabase');

  // Check connection and load cached session on startup
  useEffect(() => {
    // Initialize Theme
    const savedTheme = localStorage.getItem('gurupro_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-theme');
    }

    const checkConnection = async () => {
      setIsConnecting(true);
      const isReachable = await testSupabaseConnection();
      setIsSupabaseReachable(isReachable);
      setIsConnecting(false);
      
      const initialMode = isReachable ? 'supabase' : 'local';
      GuruService.setStorageMode(initialMode);
      setStorageMode(initialMode);
    };

    checkConnection();

    // Check cached session
    try {
      const cached = localStorage.getItem('gurupro_active_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        setCurrentUser(parsed);
        
        // Refresh profile in background to capture role changes instantly
        GuruService.getTeacherById(parsed.id).then((updatedProfile) => {
          if (updatedProfile) {
            const updatedUser = {
              ...parsed,
              profile: updatedProfile
            };
            setCurrentUser(updatedUser);
            localStorage.setItem('gurupro_active_session', JSON.stringify(updatedUser));
          }
        }).catch((err) => {
          console.error('Error refreshing profile in background:', err);
        });
      }
    } catch (e) {
      console.error('Error reading cached session:', e);
    }
  }, []);

  // Setup Realtime Subscriptions
  useEffect(() => {
    if (storageMode !== 'supabase') return;

    const announcementsChannel = supabase
      .channel('public:announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
      })
      .subscribe();

    const calendarsChannel = supabase
      .channel('public:academic_calendars')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'academic_calendars' }, () => {
        queryClient.invalidateQueries({ queryKey: ['holidays'] });
      })
      .subscribe();

    const counselingChannel = supabase
      .channel('public:counseling_records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'counseling_records' }, () => {
        queryClient.invalidateQueries({ queryKey: ['counseling'] });
      })
      .subscribe();

    const globalScheduleChannel = supabase
      .channel('public:global_schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'global_schedules' }, () => {
        queryClient.invalidateQueries({ queryKey: ['global_schedule'] });
      })
      .subscribe();

    const journalsChannel = supabase
      .channel('public:teaching_journals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teaching_journals' }, () => {
        queryClient.invalidateQueries({ queryKey: ['journals'] });
        queryClient.invalidateQueries({ queryKey: ['agenda'] });
      })
      .subscribe();

    const attendancesChannel = supabase
      .channel('public:daily_attendances')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_attendances' }, () => {
        queryClient.invalidateQueries({ queryKey: ['attendances'] });
      })
      .subscribe();

    const schedulesChannel = supabase
      .channel('public:class_schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_schedules' }, () => {
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
      })
      .subscribe();

    const teachersChannel = supabase
      .channel('public:teachers_profile')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers_profile' }, () => {
        queryClient.invalidateQueries({ queryKey: ['teachers'] });
      })
      .subscribe();

    const studentsChannel = supabase
      .channel('public:students')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
      })
      .subscribe();

    const classesChannel = supabase
      .channel('public:classes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, () => {
        queryClient.invalidateQueries({ queryKey: ['classes'] });
      })
      .subscribe();

    const gradesChannel = supabase
      .channel('public:student_grades')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_grades' }, () => {
        queryClient.invalidateQueries({ queryKey: ['grades'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(announcementsChannel);
      supabase.removeChannel(calendarsChannel);
      supabase.removeChannel(counselingChannel);
      supabase.removeChannel(globalScheduleChannel);
      supabase.removeChannel(journalsChannel);
      supabase.removeChannel(attendancesChannel);
      supabase.removeChannel(schedulesChannel);
      supabase.removeChannel(teachersChannel);
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(classesChannel);
      supabase.removeChannel(gradesChannel);
    };
  }, [storageMode, queryClient]);

  const handleRefreshConnection = async () => {
    setIsConnecting(true);
    const isReachable = await testSupabaseConnection();
    setIsSupabaseReachable(isReachable);
    const newMode = isReachable ? 'supabase' : 'local';
    GuruService.setStorageMode(newMode);
    setStorageMode(newMode);
    setIsConnecting(false);
  };

  const handleLoginSuccess = (user: { id: string; email: string; profile: TeacherProfile }) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('gurupro_active_session', JSON.stringify(user));
    } catch (e) {
      console.error('Error caching session:', e);
    }
    // Setup first active tab based on role
    if (user.profile.role === 'guru') {
      setActiveTab('jurnal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gurupro_active_session');
    } catch (e) {
      console.error('Error removing session:', e);
    }
  };

  const handleProfileUpdate = (updatedProfile: TeacherProfile) => {
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        profile: updatedProfile
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('gurupro_active_session', JSON.stringify(updatedUser));
      } catch (e) {
        console.error('Error saving updated session:', e);
      }
    }
  };

  // Render current active tab content
  const renderTabContent = () => {
    if (!currentUser) return null;
    const role = currentUser.profile.role;

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview setActiveTab={setActiveTab} userRole={role} currentUser={currentUser} />;
      
      case 'kelola-guru':
        if (role !== 'admin') return <div className="p-8 text-slate-500 font-semibold">Akses Terbatas.</div>;
        return <KelolaGuru />;
      
      case 'kelola-siswa':
        if (role === 'guru') return <div className="p-8 text-slate-500 font-semibold">Akses Terbatas.</div>;
        return <KelolaSiswa currentUser={currentUser} />;
      
      case 'kelola-kelas':
        if (role !== 'admin') return <div className="p-8 text-slate-500 font-semibold">Akses Terbatas.</div>;
        return <KelolaKelas />;
      
      case 'absensi-walikelas':
        if (role !== 'walikelas') return <div className="p-8 text-slate-500 font-semibold">Akses Terbatas. Hanya untuk Wali Kelas.</div>;
        return <AbsensiHarian currentUser={currentUser} mode="walikelas" />;

      case 'absensi-mapel':
        return <AbsensiHarian currentUser={currentUser} mode="mapel" />;
      
      case 'progres-guru':
        if (role !== 'admin') return <div className="p-8 text-slate-500 font-semibold">Akses Terbatas.</div>;
        return <ProgresGuru />;
      
      case 'agenda-harian':
        return <JurnalMengajar currentUser={currentUser} type="agenda_harian" />;

      case 'jurnal':
        return <JurnalMengajar currentUser={currentUser} type="jurnal_mengajar" />;

      case 'agenda-mgmp':
        return <JurnalMengajar currentUser={currentUser} type="agenda_mgmp" />;

      case 'jurnal-mgmp':
        return <JurnalMengajar currentUser={currentUser} type="jurnal_mgmp" />;
      
      case 'laporan':
        return <LaporanAbsensi currentUser={currentUser} />;
      
      case 'profile':
        return <Profile currentUser={currentUser} onProfileUpdate={handleProfileUpdate} />;
      
      // Tahap Pengembangan (5 Rekomendasi Fitur Tambahan)
      case 'pengumuman':
        return <PengumumanMading currentUser={currentUser} />;
      
      case 'jadwal-pelajaran':
        return <JadwalPelajaran currentUser={currentUser} />;
        
      case 'penilaian':
        return <PenilaianSiswa currentUser={currentUser} />;
        
      case 'kalender-akademik':
        return <KalenderAkademik currentUser={currentUser} />;
        
      case 'catatan-konseling':
        return <CatatanKonseling currentUser={currentUser} />;
      
      default:
        return <DashboardOverview setActiveTab={setActiveTab} userRole={role} />;
    }
  };

  const handleToggleStorageMode = () => {
    const newMode = storageMode === 'supabase' ? 'local' : 'supabase';
    GuruService.setStorageMode(newMode);
    setStorageMode(newMode);
  };

  // 1. Not Logged In -> Show Login Page
  if (!currentUser) {
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess} 
        storageMode={storageMode}
        onToggleStorageMode={handleToggleStorageMode}
      />
    );
  }

  // 2. Logged In -> Show Core Dashboard Workspace
  return (
    <div id="gurupro-workspace" className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      {/* Sidebar Navigation - Hidden during standard browser print */}
      <div className="no-print">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setIsSidebarOpen(false); // Auto close sidebar on choice
          }} 
          currentUser={currentUser} 
          onLogout={handleLogout}
          storageMode={storageMode}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-64 print:pl-0 w-full min-w-0">
        {/* Header Bar - Hidden during standard browser print */}
        <div className="no-print">
          <Header 
            activeTab={activeTab} 
            currentUser={currentUser}
            storageMode={storageMode}
            onToggleStorageMode={handleToggleStorageMode}
            isConnecting={isConnecting}
            isSupabaseReachable={isSupabaseReachable}
            onRefreshConnection={handleRefreshConnection}
            onMenuClick={() => setIsSidebarOpen(true)}
            onNavigateTab={setActiveTab}
            onLogout={handleLogout}
          />
        </div>

        {/* Dynamic Screen Content container */}
        <main className="flex-1 p-4 sm:p-8 print:p-0 w-full">
          <ErrorBoundary key={activeTab}>
            {renderTabContent()}
          </ErrorBoundary>
        </main>

        {/* Beautiful Footer */}
        <footer className="mt-auto py-6 border-t border-slate-200 text-center text-xs text-slate-400/80 no-print bg-white/50 backdrop-blur-xs">
          <p className="font-bold text-slate-500">Powered By Aris</p>
          <p className="text-slate-400/70 mt-1 font-medium">© 2026 A. Bermansyah. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
