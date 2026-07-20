/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Home, 
  Users, 
  BookOpen, 
  CheckSquare, 
  BarChart, 
  Layers, 
  LogOut, 
  Shield, 
  User, 
  Award, 
  X,
  FileText,
  TrendingUp,
  Megaphone,
  Calendar,
  Star,
  CalendarDays,
  AlertCircle,
  Search,
  Settings
} from 'lucide-react';
import { TeacherProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: { id: string; email: string; profile: TeacherProfile };
  onLogout: () => void;
  storageMode: 'supabase' | 'local';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  currentUser, 
  onLogout,
  storageMode,
  isOpen = false,
  onClose
}: SidebarProps) {
  const [profile, setProfile] = React.useState<TeacherProfile>(currentUser.profile);
  const [avatar, setAvatar] = React.useState<string>(
    currentUser.profile.avatar || localStorage.getItem(`gurupro_avatar_${currentUser.id}`) || ''
  );

  React.useEffect(() => {
    setProfile(currentUser.profile);
    setAvatar(currentUser.profile.avatar || localStorage.getItem(`gurupro_avatar_${currentUser.id}`) || '');
  }, [currentUser]);

  const role = profile.role;

  // Render navigation list based on user's role
  const getNavItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'pengaturan-sistem', label: 'Pengaturan Sistem', icon: Settings },
          { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
          { id: 'jadwal-pelajaran', label: 'Jadwal Pelajaran', icon: Calendar },
          { id: 'kelola-guru', label: 'Kelola Guru', icon: Users },
          { id: 'kelola-siswa', label: 'Kelola Siswa', icon: BookOpen },
          { id: 'kelola-kelas', label: 'Kelola Kelas', icon: Layers },
          { id: 'progres-guru', label: 'Progres Guru', icon: TrendingUp },
          { id: 'laporan', label: 'Laporan Absensi', icon: BarChart },
          { id: 'kalender-akademik', label: 'Kalender Akademik', icon: CalendarDays },
          { id: 'catatan-konseling', label: 'Catatan Kedisiplinan', icon: AlertCircle }
        ];
      case 'walikelas':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
          { id: 'jadwal-pelajaran', label: 'Jadwal Pelajaran', icon: Calendar },
          { id: 'absensi-walikelas', label: 'Absensi Wali Kelas', icon: CheckSquare },
          { id: 'absensi-mapel', label: 'Absensi Guru Mapel', icon: CheckSquare },
          { id: 'absensi-kegiatan', label: 'Absensi Kegiatan Tambahan', icon: CheckSquare },
          { id: 'agenda-harian', label: 'Agenda Harian', icon: CheckSquare },
          { id: 'jurnal', label: 'Jurnal Mengajar', icon: BookOpen },
          { id: 'agenda-mgmp', label: 'Agenda MGMP', icon: Layers },
          { id: 'jurnal-mgmp', label: 'Jurnal MGMP', icon: FileText },
          { id: 'kelola-siswa', label: 'Siswa Kelas Saya', icon: Users },
          { id: 'penilaian', label: 'Penilaian Siswa', icon: Star },
          { id: 'laporan', label: 'Laporan Absensi', icon: BarChart },
          { id: 'kalender-akademik', label: 'Kalender Akademik', icon: CalendarDays },
          { id: 'catatan-konseling', label: 'Catatan Kedisiplinan', icon: AlertCircle }
        ];
      case 'guru':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: Home },
          { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
          { id: 'jadwal-pelajaran', label: 'Jadwal Pelajaran', icon: Calendar },
          { id: 'absensi-mapel', label: 'Absensi Guru Mapel', icon: CheckSquare },
          { id: 'absensi-kegiatan', label: 'Absensi Kegiatan Tambahan', icon: CheckSquare },
          { id: 'agenda-harian', label: 'Agenda Harian', icon: CheckSquare },
          { id: 'jurnal', label: 'Jurnal Mengajar', icon: BookOpen },
          { id: 'agenda-mgmp', label: 'Agenda MGMP', icon: Layers },
          { id: 'jurnal-mgmp', label: 'Jurnal MGMP', icon: FileText },
          { id: 'penilaian', label: 'Penilaian Siswa', icon: Star },
          { id: 'laporan', label: 'Laporan Absensi', icon: BarChart },
          { id: 'kalender-akademik', label: 'Kalender Akademik', icon: CalendarDays },
          { id: 'catatan-konseling', label: 'Catatan Kedisiplinan', icon: AlertCircle }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Dimmed Overlay Backdrop for mobile menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`w-64 bg-slate-800 text-slate-100 flex flex-col h-screen fixed left-0 top-0 shadow-xl z-40 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png"
              className="h-10 w-10 object-contain rounded-lg"
              alt="Logo SMPN 58"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white leading-none">GuruPro</h1>
              <span className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-1 block">
                School System
              </span>
            </div>
          </div>

          {/* Close button for mobile */}
          {onClose && (
            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer"
              title="Tutup Menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* User Information Display */}
        <div className="p-5 border-b border-slate-700/40 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner shrink-0 overflow-hidden ${
              role === 'admin' ? 'bg-red-600' : role === 'walikelas' ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                profile.nama_lengkap ? profile.nama_lengkap.substring(0, 2).toUpperCase() : 'G'
              )}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold truncate text-white leading-tight">{profile.nama_lengkap}</h2>
              <div className="flex items-center gap-1 mt-1">
                {role === 'admin' ? (
                  <Shield className="h-3 w-3 text-red-400" />
                ) : (
                  <User className="h-3 w-3 text-blue-400" />
                )}
                <span className="text-[11px] text-slate-300 font-medium capitalize truncate">
                  {role === 'walikelas' ? 'Wali Kelas' : role === 'guru' ? 'Guru Mapel' : role}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-700/30 pt-2">
            <span>NIP: {profile.nip || '-'}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'bg-blue-700 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                <IconComponent className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={() => {
              if (onClose) onClose();
              window.dispatchEvent(new Event('open-about-creator'));
            }}
            className="w-full flex items-center justify-between gap-3 px-4 py-2 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 border border-slate-600/50 text-white rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 rounded-full bg-blue-500 items-center justify-center text-[10px] font-bold">AB</span>
              <span>Tentang Pembuat</span>
            </div>
            <Award className="h-4 w-4 text-amber-400" />
          </button>
        </div>
      </div>
    </>
  );
}
