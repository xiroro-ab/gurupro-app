/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { downloadPdfLaporan } from '../utils/pdfExport';
import { User, Mail, FileText, Award, Calendar, Camera, Save, Database, FileText as FilePdf } from 'lucide-react';
import { TeacherProfile } from '../types';
import { GuruService } from '../services/supabase';
import { useNotification } from './NotificationToast';

interface ProfileProps {
  currentUser: { id: string; email: string; profile: TeacherProfile };
  onProfileUpdate: (updatedProfile: TeacherProfile) => void;
}

export default function Profile({ currentUser, onProfileUpdate }: ProfileProps) {
  const notification = useNotification();
  const [namaLengkap, setNamaLengkap] = useState(currentUser.profile.nama_lengkap || '');
  const [nip, setNip] = useState(currentUser.profile.nip || '');
  const [email, setEmail] = useState(currentUser.profile.email || currentUser.email || '');
  const [mapel, setMapel] = useState(currentUser.profile.mapel || '');
  const [avatar, setAvatar] = useState<string>(
    currentUser.profile.avatar || localStorage.getItem(`gurupro_avatar_${currentUser.id}`) || ''
  );

  const [loading, setLoading] = useState(false);

  // Drag and drop for avatar
  const [dragActive, setDragActive] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      notification.error('Hanya file gambar yang diperbolehkan.');
      return;
    }
    if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
      notification.error('Ukuran file terlalu besar (maksimal 1 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = event.target.result as string;
        setAvatar(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!namaLengkap.trim()) {
      notification.error('Nama Lengkap wajib diisi.');
      setLoading(false);
      return;
    }

    try {
      // 1. Prepare updates
      const updates: Partial<TeacherProfile> = {
        nama_lengkap: namaLengkap,
        nip: nip
      };

      if (currentUser.profile.role !== 'admin') {
        updates.mapel = mapel || 'Umum';
      }

      // Save email if updated
      if (email && email !== currentUser.profile.email) {
        updates.email = email;
      }

      // 2. Call backend service to update profile details
      const updatedProfileFromService = await GuruService.updateTeacher(currentUser.id, updates);

      // 3. Save avatar locally to avoid schema errors and size limitations on the DB
      localStorage.setItem(`gurupro_avatar_${currentUser.id}`, avatar);

      // Combine profile with avatar and correct email
      const finalProfile: TeacherProfile = {
        ...currentUser.profile,
        ...updatedProfileFromService,
        avatar: avatar,
        email: email
      };

      // 4. Send updated profile back to parent App
      onProfileUpdate(finalProfile);
      notification.success('Profil Anda berhasil diperbarui!');
    } catch (err: any) {
      console.warn(err);
      notification.error(err.message || 'Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Generate Initials if no avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div id="user-profile-page" className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Profil Saya & Pengaturan</h2>
          <p className="text-slate-500 text-sm mt-1">Perbarui foto profil, informasi pribadi, dan pengaturan sistem Anda.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Role */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center">
            <h3 className="text-base font-bold text-slate-800 mb-4 self-start">Foto Profil</h3>
            
            {/* Avatar container */}
            <div 
              className={`relative group w-32 h-32 rounded-full mb-4 flex items-center justify-center overflow-hidden border-2 ${
                dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-slate-50'
              } transition-all`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                  {getInitials(namaLengkap || currentUser.profile.nama_lengkap || 'G')}
                </div>
              )}
              
              {/* Overlay on Hover / Drag */}
              <label className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-xs font-semibold">
                <Camera className="h-5 w-5 mb-1" />
                <span>Ubah Foto</span>
                <input 
                  type="file" 
                  onChange={handleAvatarChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </label>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Drag & drop atau klik foto untuk unggah gambar baru (Maks. 1MB)
            </p>

            <div className="w-full h-px bg-slate-100 mb-4"></div>

            {/* Role Badge Info */}
            <div className="w-full space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">Hak Akses Peran</span>
              <span className="inline-flex px-3 py-1 bg-blue-50 border border-blue-150 text-blue-700 font-bold rounded-full text-xs capitalize">
                {currentUser.profile.role === 'admin' ? 'Administrator' : currentUser.profile.role === 'walikelas' ? 'Wali Kelas' : 'Guru Mapel'}
              </span>
            </div>
            
            <div className="w-full h-px bg-slate-100 my-4"></div>
            
            <div className="w-full">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await downloadPdfLaporan(currentUser.id);
                    notification.success('Berhasil mengunduh laporan PDF Anda');
                  } catch(e) {
                    notification.error('Gagal mengunduh laporan PDF');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-sm font-bold transition-all shadow-sm"
              >
                <FilePdf className="w-4 h-4" />
                Download Laporan (PDF)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Data Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <User className="h-5 w-5 text-slate-600" />
              <span>Informasi Pribadi</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nama Lengkap */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="h-4 w-4 text-slate-400" />
                  Nama Lengkap (Beserta Gelar)
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              {/* NIP */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  NIP / No. Registrasi
                </label>
                <input
                  type="text"
                  value={nip}
                  onChange={(e) => setNip(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
                  placeholder="Masukkan NIP (Isi 10-18 digit angka)"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>Email Terdaftar</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
                  placeholder="Masukkan email guru"
                  required
                />
              </div>

              {/* Mapel yang diampu - Show only for non-admins */}
              {currentUser.profile.role !== 'admin' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Award className="h-4 w-4 text-slate-400" />
                    <span>Mata Pelajaran Utama yang Diampu</span>
                  </label>
                  <input
                    type="text"
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 font-medium"
                    placeholder="Contoh: Matematika, IPA, Umum"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
