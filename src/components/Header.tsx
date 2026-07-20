/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Database, ShieldAlert, CheckCircle, RefreshCw, Menu, User, LogOut, ChevronDown, CloudLightning, WifiOff, Trash2, X, Sun, Moon } from 'lucide-react';
import { TeacherProfile } from '../types';
import { GuruService } from '../services/supabase';
import { useNotification } from './NotificationToast';
import { ConfirmModal } from './ConfirmModal';

interface HeaderProps {
  activeTab: string;
  currentUser: { id: string; email: string; profile: TeacherProfile };
  storageMode: 'supabase' | 'local';
  onToggleStorageMode: () => void;
  isConnecting: boolean;
  isSupabaseReachable: boolean;
  onRefreshConnection: () => void;
  onMenuClick?: () => void;
  onNavigateTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Header({
  activeTab,
  currentUser,
  storageMode,
  onToggleStorageMode,
  isConnecting,
  isSupabaseReachable,
  onRefreshConnection,
  onMenuClick,
  onNavigateTab,
  onLogout
}: HeaderProps) {
  const toast = useNotification();
  const [offlineQueueLength, setOfflineQueueLength] = useState(0);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncErrors, setSyncErrors] = useState<string[]>([]);
  const [syncSuccessCount, setSyncSuccessCount] = useState(0);
  
  const [confirmClearQueue, setConfirmClearQueue] = useState(false);
  const [confirmDeleteQueueItemId, setConfirmDeleteQueueItemId] = useState<string | null>(null);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark-theme'));
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const toggleDarkMode = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark-theme');
      localStorage.setItem('gurupro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark-theme');
      localStorage.setItem('gurupro_theme', 'light');
    }
  };

  useEffect(() => {
    const updateQueueLen = () => {
      setOfflineQueueLength(GuruService.getOfflineQueue().length);
    };
    updateQueueLen();
    window.addEventListener('offline_queue_changed', updateQueueLen);
    
    const handleOnline = async () => {
      const currentQueue = GuruService.getOfflineQueue();
      if (currentQueue.length > 0) {
        toast.info(`Koneksi internet terdeteksi! Memulai sinkronisasi otomatis ${currentQueue.length} data...`, 'Auto-Sync');
        setIsSyncing(true);
        const res = await GuruService.syncOfflineQueue();
        setIsSyncing(false);
        if (res.success) {
          toast.success(`Sinkronisasi otomatis berhasil! ${res.syncedCount} data tersimpan ke cloud.`, 'Selesai');
        } else {
          toast.warn(`Sinkronisasi otomatis selesai dengan beberapa kendala. Silakan cek antrean.`, 'Peringatan');
        }
      }
    };
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline_queue_changed', updateQueueLen);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncErrors([]);
    setSyncSuccessCount(0);
    
    try {
      const res = await GuruService.syncOfflineQueue();
      setSyncSuccessCount(res.syncedCount);
      if (res.success) {
        toast.success(`Sinkronisasi ${res.syncedCount} data berhasil diselesaikan!`, 'Sinkronisasi Selesai');
        setTimeout(() => {
          setShowSyncModal(false);
        }, 1500);
      } else {
        setSyncErrors(res.errors);
        toast.error('Gagal menyinkronkan beberapa data. Silakan periksa detail.', 'Sinkronisasi Gagal');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Kesalahan tak terduga saat sinkronisasi');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = () => {
    GuruService.clearOfflineQueue();
    toast.info('Antrean offline berhasil dibersihkan.');
    setShowSyncModal(false);
  };
  
  // Also track profile state locally to refresh when avatar or details change
  const [avatar, setAvatar] = useState<string>(
    currentUser.profile.avatar || localStorage.getItem(`gurupro_avatar_${currentUser.id}`) || ''
  );

  useEffect(() => {
    // Listen to changes in profile/avatar
    setAvatar(currentUser.profile.avatar || localStorage.getItem(`gurupro_avatar_${currentUser.id}`) || '');
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Clean readable title generator
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Utama';
      case 'kelola-guru':
        return 'Kelola Data Pendidik (Guru)';
      case 'kelola-siswa':
        return currentUser.profile.role === 'walikelas' ? 'Siswa Kelas Saya' : 'Kelola Roster Siswa';
      case 'kelola-kelas':
        return 'Kelola Struktur Kelas';
      case 'absensi':
        return 'Input Presensi Harian';
      case 'agenda-harian':
        return 'Agenda Harian Guru';
      case 'jurnal':
        return 'Jurnal Agenda Mengajar';
      case 'agenda-mgmp':
        return 'Agenda Forum MGMP';
      case 'jurnal-mgmp':
        return 'Jurnal Kegiatan MGMP';
      case 'laporan':
        return 'Laporan Presensi & Cetak Surat';
      case 'profile':
        return 'Profil Saya & Pengaturan';
      default:
        return 'Sistem GuruPro';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-50 shadow-xs">
      {/* Tab Context Header */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onMenuClick && (
          <button 
            onClick={onMenuClick} 
            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer shrink-0"
            title="Buka Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 tracking-tight truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Database State and Profile Info */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Offline Queue Reconciliation Indicator Badge */}
        {offlineQueueLength > 0 && (
          <button
            onClick={() => {
              setSyncErrors([]);
              setSyncSuccessCount(0);
              setShowSyncModal(true);
            }}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-700 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold transition-all cursor-pointer animate-pulse shrink-0"
            title="Ada data dalam antrean offline yang belum tersinkronisasi ke cloud."
          >
            <CloudLightning className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">{offlineQueueLength} Antrean Offline</span>
            <span className="sm:hidden">{offlineQueueLength} Antrean</span>
          </button>
        )}

        {/* Supabase Status Indicator Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50 border border-slate-200/80 px-2 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs">
          <Database className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-slate-500" />
          <span className="text-slate-600 font-medium hidden md:inline">Koneksi Database:</span>
          {isConnecting ? (
            <div className="flex items-center gap-1 text-slate-400">
              <RefreshCw className="h-3 w-3 animate-spin text-slate-400" />
              <span>Memeriksa...</span>
            </div>
          ) : isSupabaseReachable ? (
            <div className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <ShieldAlert className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Lokal</span>
            </div>
          )}
          
          <button
            onClick={onRefreshConnection}
            title="Muat Ulang Koneksi"
            className="p-0.5 sm:p-1 hover:bg-slate-200 rounded-full transition-colors ml-0.5 sm:ml-1 cursor-pointer"
          >
            <RefreshCw className={`h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-500 ${isConnecting ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        {/* User Profile Dropdown Button */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 sm:gap-3 p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-200/60 rounded-xl transition-all cursor-pointer group"
          >
            {/* Avatar Display */}
            <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 bg-blue-600 flex items-center justify-center shrink-0 shadow-xs">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="text-xs font-bold text-white">
                  {getInitials(currentUser.profile.nama_lengkap || 'G')}
                </span>
              )}
            </div>

            {/* Profile Info Summary */}
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors truncate max-w-[120px]">
                {currentUser.profile.nama_lengkap || 'Pendidik'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 capitalize">
                {currentUser.profile.role === 'admin'
                  ? 'Administrator'
                  : currentUser.profile.role === 'walikelas'
                  ? 'Wali Kelas'
                  : 'Guru Mapel'}
              </span>
            </div>

            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors hidden sm:block" />
          </button>

          {/* Floating Dropdown Card */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[85vw] sm:w-72 max-w-[300px] bg-white rounded-2xl border border-slate-200/80 shadow-2xl p-4 z-[100] animate-zoomIn space-y-3 origin-top-right">
              {/* Header Profile Card */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="h-12 w-12 rounded-full overflow-hidden border border-slate-200 bg-blue-600 flex items-center justify-center shrink-0">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-lg font-bold text-white">
                      {getInitials(currentUser.profile.nama_lengkap || 'G')}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-slate-800 truncate leading-snug">
                    {currentUser.profile.nama_lengkap || 'Pendidik'}
                  </span>
                  <span className="text-xs text-slate-400 truncate">
                    {currentUser.profile.email || currentUser.email}
                  </span>
                  <span className="inline-flex mt-1 self-start px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 font-bold rounded-md text-[9px] uppercase tracking-wide">
                    {currentUser.profile.role === 'admin'
                      ? 'Administrator'
                      : currentUser.profile.role === 'walikelas'
                      ? 'Wali Kelas'
                      : 'Guru Mapel'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onNavigateTab('profile');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <User className="h-4.5 w-4.5 text-slate-400" />
                  <span>Profil Saya</span>
                </button>
                
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500" /> : <Moon className="h-4.5 w-4.5 text-slate-400" />}
                    <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                  </div>
                  <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform ${isDarkMode ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                  </div>
                </button>
                
                <div className="h-px bg-slate-100 my-1"></div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut className="h-4.5 w-4.5" />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Offline Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] animate-zoomIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <CloudLightning className="h-5 w-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Antrean Sinkronisasi Offline</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 font-semibold mt-0.5">GuruPro Offline Reconciliation Queue</p>
                </div>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Alert Warning */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex gap-3 text-amber-800 text-xs font-semibold leading-relaxed">
                <WifiOff className="h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p>Data di bawah ini diinput secara lokal karena perangkat terputus dari koneksi Supabase Cloud di kelas.</p>
                  <p className="mt-1 text-amber-700 font-normal">Begitu koneksi internet pulih, sistem akan otomatis melakukan sinkronisasi secara mandiri, atau Anda dapat menekan tombol sinkronkan sekarang.</p>
                </div>
              </div>

              {/* Queue List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Daftar Data Tertunda ({offlineQueueLength})</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-[240px] overflow-y-auto">
                  {GuruService.getOfflineQueue().map((item) => (
                    <div key={item.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors bg-white">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-bold text-slate-800 truncate">{item.description}</span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          Tipe: <span className="capitalize text-slate-500">{item.type === 'attendance' ? 'Presensi Harian' : 'Jurnal Agenda'}</span> • 
                          Diinput: {new Date(item.timestamp).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setConfirmDeleteQueueItemId(item.id);
                        }}
                        className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Abaikan Data Ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {offlineQueueLength === 0 && (
                    <div className="p-8 text-center text-slate-400 font-semibold bg-white">
                      Tidak ada data tertunda. Semua data telah sinkron!
                    </div>
                  )}
                </div>
              </div>

              {/* Sync Logs and Errors */}
              {syncErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-200/60 rounded-2xl p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                    <Database className="h-4 w-4" />
                    <span>Beberapa kendala sinkronisasi:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-rose-700 pl-1">
                    {syncErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {syncSuccessCount > 0 && syncErrors.length === 0 && (
                <div className="bg-emerald-50 border border-emerald-200/60 rounded-2xl p-4 text-xs flex items-center gap-2 text-emerald-800 font-semibold animate-pulse">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Berhasil menyinkronkan {syncSuccessCount} data secara utuh ke cloud database!</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
              <button
                onClick={() => setConfirmClearQueue(true)}
                disabled={isSyncing || offlineQueueLength === 0}
                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-transparent rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                Kosongkan Antrean
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSyncModal(false)}
                  disabled={isSyncing}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Tutup
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={isSyncing || offlineQueueLength === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/10"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Menyinkronkan...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Sinkronkan Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmClearQueue}
        title="Bersihkan Antrean Offline"
        message="Apakah Anda yakin ingin menghapus semua data dalam antrean offline ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          GuruService.clearOfflineQueue();
          toast.info('Antrean offline berhasil dibersihkan.');
          setShowSyncModal(false);
          setConfirmClearQueue(false);
        }}
        onCancel={() => setConfirmClearQueue(false)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteQueueItemId}
        title="Hapus Item Antrean"
        message="Apakah Anda yakin ingin menghapus item ini dari antrean offline?"
        onConfirm={() => {
          if (confirmDeleteQueueItemId) {
            GuruService.removeFromOfflineQueue(confirmDeleteQueueItemId);
            toast.info('Item antrean berhasil dihapus.');
            setConfirmDeleteQueueItemId(null);
          }
        }}
        onCancel={() => setConfirmDeleteQueueItemId(null)}
      />
    </header>
  );
}
