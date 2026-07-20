import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GuruService } from '../services/supabase';
import { TeacherProfile, ClassSchedule } from '../types';
import { Calendar, Plus, Trash2, Edit2, Clock, MapPin, Save, X, Upload, Image as ImageIcon, FileText, Maximize2 } from 'lucide-react';
import { useNotification } from './NotificationToast';
import { ConfirmModal } from './ConfirmModal';
import { SearchableSelect } from './SearchableSelect';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker using unpkg CDN to avoid Vite/Rollup build issues on Vercel
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Props {
  currentUser: {
    profile: TeacherProfile;
  };
}

export const JadwalPelajaran: React.FC<Props> = ({ currentUser }) => {
  const isAdmin = currentUser.profile.role === 'admin';
  const toast = useNotification();
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteGlobal, setConfirmDeleteGlobal] = useState(false);
  const [confirmDeleteGlobal2, setConfirmDeleteGlobal2] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>('Senin');
  const [filterTeacher, setFilterTeacher] = useState<string>(isAdmin ? 'all' : currentUser.profile.id);

  const [formData, setFormData] = useState({
    hari: 'Senin',
    jam_mulai: '07:00',
    jam_selesai: '08:30',
    class_id: '',
    mapel: '',
    teacher_id: isAdmin ? '' : currentUser.profile.id
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => GuruService.getSchedules()
  });

  const { data: globalSchedule, isLoading: loadingGlobalSchedule } = useQuery({
    queryKey: ['global_schedule'],
    queryFn: () => GuruService.getGlobalSchedule()
  });

  const { data: globalSchedule2, isLoading: loadingGlobalSchedule2 } = useQuery({
    queryKey: ['global_schedule_2'],
    queryFn: () => GuruService.getGlobalSchedule2()
  });

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBlobUrl2, setPdfBlobUrl2] = useState<string | null>(null);

  const [pdfWidth, setPdfWidth] = useState(800);
  const [modalPdfWidth, setModalPdfWidth] = useState(800);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [numPages2, setNumPages2] = useState<number | null>(null);
  const [numPagesModal, setNumPagesModal] = useState<number | null>(null);
  const pdfContainerRef = React.useRef<HTMLDivElement>(null);
  const modalPdfContainerRef = React.useRef<HTMLDivElement>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }
  function onDocumentLoadSuccess2({ numPages }: { numPages: number }) {
    setNumPages2(numPages);
  }
  function onDocumentLoadSuccessModal({ numPages }: { numPages: number }) {
    setNumPagesModal(numPages);
  }

  React.useEffect(() => {
    if (globalSchedule?.type === 'application/pdf' && globalSchedule.url) {
      if (globalSchedule.url.startsWith('data:application/pdf;base64,')) {
        try {
          const base64Data = globalSchedule.url.split(',')[1];
          const byteString = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([intArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          
          return () => URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Failed to create blob from base64 PDF", e);
          setPdfBlobUrl(globalSchedule.url);
        }
      } else {
        setPdfBlobUrl(globalSchedule.url);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [globalSchedule]);

  React.useEffect(() => {
    if (globalSchedule2?.type === 'application/pdf' && globalSchedule2.url) {
      if (globalSchedule2.url.startsWith('data:application/pdf;base64,')) {
        try {
          const base64Data = globalSchedule2.url.split(',')[1];
          const byteString = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([intArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl2(url);
          
          return () => URL.revokeObjectURL(url);
        } catch (e) {
          console.warn("Failed to create blob from base64 PDF 2", e);
          setPdfBlobUrl2(globalSchedule2.url);
        }
      } else {
        setPdfBlobUrl2(globalSchedule2.url);
      }
    } else {
      setPdfBlobUrl2(null);
    }
  }, [globalSchedule2]);

  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: () => GuruService.getClasses()
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: () => GuruService.getTeachers()
  });

  const saveGlobalScheduleMutation = useMutation({
    mutationFn: async (schedule: any) => {
      await GuruService.setGlobalSchedule(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule'] });
      toast.success('Gambar jadwal global berhasil disimpan');
    }
  });

  const saveGlobalSchedule2Mutation = useMutation({
    mutationFn: async (schedule: any) => {
      await GuruService.setGlobalSchedule2(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule2'] });
      toast.success('Gambar jadwal global 2 berhasil disimpan');
    }
  });

  const deleteGlobalScheduleMutation = useMutation({
    mutationFn: async () => {
      await GuruService.setGlobalSchedule(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule'] });
      setConfirmDeleteGlobal(false);
      setPdfBlobUrl(null);
      toast.success('Jadwal global berhasil dihapus');
    }
  });

  const deleteGlobalSchedule2Mutation = useMutation({
    mutationFn: async () => {
      await GuruService.setGlobalSchedule2(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule2'] });
      setConfirmDeleteGlobal2(false);
      setPdfBlobUrl2(null);
      toast.success('Jadwal global 2 berhasil dihapus');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (schedule: any) => {
      await GuruService.saveSchedule(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Jadwal berhasil disimpan');
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await GuruService.deleteSchedule(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Jadwal berhasil dihapus');
    }
  });

  const resetForm = () => {
    setFormData({
      hari: selectedDay,
      jam_mulai: '07:00',
      jam_selesai: '08:30',
      class_id: '',
      mapel: '',
      teacher_id: isAdmin ? '' : currentUser.profile.id
    });
    setEditingId(null);
  };

  const handleEdit = (s: ClassSchedule) => {
    setFormData({
      hari: s.hari,
      jam_mulai: s.jam_mulai,
      jam_selesai: s.jam_selesai,
      class_id: s.class_id,
      mapel: s.mapel,
      teacher_id: s.teacher_id
    });
    setEditingId(s.id);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.class_id || !formData.mapel || !formData.teacher_id) {
      toast.error('Lengkapi semua form jadwal');
      return;
    }
    
    saveMutation.mutate({
      id: editingId || 'sch_' + Date.now(),
      ...formData
    });
  };

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecond = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Format tidak didukung. Harap unggah file gambar atau PDF.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const payload = {
          url: dataUrl,
          name: file.name,
          type: file.type,
          updated_at: new Date().toISOString()
        };
        if (isSecond) {
          saveGlobalSchedule2Mutation.mutate(payload);
        } else {
          saveGlobalScheduleMutation.mutate(payload);
        }
    };
    reader.readAsDataURL(file);
  };

  // Filter schedules
  const visibleSchedules = schedules.filter(s => {
    if (s.hari !== selectedDay) return false;
    if (filterTeacher !== 'all' && s.teacher_id !== filterTeacher) return false;
    return true;
  });

  // Sort by start time
  visibleSchedules.sort((a, b) => (a.jam_mulai || '').localeCompare(b.jam_mulai || ''));

  if (loadingSchedules) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500 mr-3"></div>
        <span>Memuat jadwal...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            Jadwal Pelajaran
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Kelola dan pantau jadwal mengajar mingguan untuk menghindari bentrok kelas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div>
              <input
                type="file"
                id="upload-jadwal"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, false)}
              />
              <label
                htmlFor="upload-jadwal"
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer text-sm"
              >
                {saveGlobalScheduleMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Upload Jadwal Utama</span>
                <span className="sm:hidden">Upload 1</span>
              </label>
            </div>
          )}
          {isAdmin && (
            <div>
              <input
                type="file"
                id="upload-jadwal-2"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, true)}
              />
              <label
                htmlFor="upload-jadwal-2"
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer text-sm"
              >
                {saveGlobalSchedule2Mutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Upload Jadwal Tambahan</span>
                <span className="sm:hidden">Upload 2</span>
              </label>
            </div>
          )}
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tambah Jadwal Manual</span>
            <span className="sm:hidden">Manual</span>
          </button>
        </div>
      </div>

      {globalSchedule && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-1 overflow-hidden">
          <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                {globalSchedule.type === 'application/pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Jadwal Pelajaran (Global)</h3>
                <p className="text-xs text-slate-500">
                  Diperbarui {(() => {
                    if (!globalSchedule.updated_at) return '-';
                    const d = new Date(globalSchedule.updated_at);
                    return isNaN(d.getTime()) ? globalSchedule.updated_at : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {globalSchedule.type === 'application/pdf' && (
                <button
                  onClick={() => setActivePdfUrl(pdfBlobUrl || globalSchedule.url)}
                  className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-sm font-medium"
                  title="Perbesar PDF"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setConfirmDeleteGlobal(true);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Gambar Jadwal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="p-4 flex flex-col items-center bg-slate-100 rounded-b-xl overflow-auto max-h-[800px]">
            {globalSchedule.type === 'application/pdf' ? (
              <div ref={pdfContainerRef} className="w-full flex flex-col items-center bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-4 overflow-x-hidden overflow-y-auto">
                <Document 
                  file={pdfBlobUrl || globalSchedule.url} 
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="p-8 text-slate-500 animate-pulse text-sm">Memuat pratinjau jadwal...</div>}
                  error={<div className="p-8 text-red-500 text-sm">Gagal memuat jadwal. Silakan unduh file.</div>}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  {Array.from(new Array(numPages || 0), (el, index) => (
                    <Page 
                      key={`page_${index + 1}`}
                      pageNumber={index + 1} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      width={pdfWidth}
                      className="shadow-sm border border-slate-100"
                    />
                  ))}
                </Document>
                <div className="mt-6 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <a href={pdfBlobUrl || globalSchedule.url} download="jadwal_global.pdf" className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Unduh Dokumen Asli (PDF)
                  </a>
                </div>
              </div>
            ) : (
              <img src={globalSchedule.url} alt="Jadwal Pelajaran Global" className="max-w-full h-auto object-contain rounded-lg border border-slate-200 shadow-sm" />
            )}
          </div>
        </div>
      )}

            {globalSchedule2 && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-1 overflow-hidden">
          <div className="bg-indigo-50/50 p-4 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                {globalSchedule2.type === 'application/pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Jadwal Pelajaran Tambahan (Global 2)</h3>
                <p className="text-xs text-slate-500">
                  Diperbarui {(() => {
                    if (!globalSchedule2.updated_at) return '-';
                    const d = new Date(globalSchedule2.updated_at);
                    return isNaN(d.getTime()) ? globalSchedule2.updated_at : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                  })()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {globalSchedule2.type === 'application/pdf' && (
                <button
                  onClick={() => setActivePdfUrl(pdfBlobUrl2 || globalSchedule2.url)}
                  className="p-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer flex items-center gap-2 text-sm font-medium"
                  title="Perbesar PDF"
                >
                  <Maximize2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Perbesar</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setConfirmDeleteGlobal2(true);
                  }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Hapus Gambar Jadwal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="p-4 flex flex-col items-center bg-slate-100 rounded-b-xl overflow-auto max-h-[800px]">
            {globalSchedule2.type === 'application/pdf' ? (
              <div ref={pdfContainerRef} className="w-full flex flex-col items-center bg-white rounded-lg shadow-sm border border-slate-200 p-2 sm:p-4 overflow-x-hidden overflow-y-auto">
                <Document 
                  file={pdfBlobUrl2 || globalSchedule2.url} 
                  onLoadSuccess={onDocumentLoadSuccess2}
                  loading={<div className="p-8 text-slate-500 animate-pulse text-sm">Memuat pratinjau jadwal 2...</div>}
                  error={<div className="p-8 text-red-500 text-sm">Gagal memuat jadwal 2. Silakan unduh file.</div>}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  {Array.from(new Array(numPages2 || 0), (el, index) => (
                    <Page 
                      key={`page2_${index + 1}`}
                      pageNumber={index + 1} 
                      renderTextLayer={false} 
                      renderAnnotationLayer={false} 
                      width={pdfWidth}
                      className="shadow-sm border border-slate-100"
                    />
                  ))}
                </Document>
                <div className="mt-6 text-sm text-slate-500 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                  <a href={pdfBlobUrl2 || globalSchedule2.url} download="jadwal_global_2.pdf" className="text-indigo-600 font-medium hover:text-indigo-700 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Unduh Dokumen Asli (PDF)
                  </a>
                </div>
              </div>
            ) : (
              <img src={globalSchedule2.url} alt="Jadwal Pelajaran Global 2" className="max-w-full h-auto object-contain rounded-lg border border-slate-200 shadow-sm" />
            )}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="flex gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-hide">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
                  selectedDay === day 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
          
          {isAdmin && (
            <div className="w-full sm:w-48 shrink-0">
              <SearchableSelect
                options={[
                  { value: 'all', label: 'Semua Guru' },
                  ...teachers.map(t => ({ value: t.id, label: t.nama_lengkap, searchStr: t.nip }))
                ]}
                value={filterTeacher}
                onChange={(val) => setFilterTeacher(val)}
                placeholder="Semua Guru"
              />
            </div>
          )}
        </div>

        <div className="p-6">
          {visibleSchedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-slate-500">Belum ada jadwal mengajar pada hari {selectedDay}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleSchedules.map(s => {
                const cls = classes.find(c => c.id === s.class_id);
                const teacher = teachers.find(t => t.id === s.teacher_id);
                
                return (
                  <div key={s.id} className="relative group bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {s.jam_mulai} - {s.jam_selesai}
                      </div>
                      
                      {/* Action Buttons: Visible on Hover */}
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                        <button
                          onClick={() => handleEdit(s)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDeleteId(s.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 text-lg mb-1">{s.mapel}</h3>
                    <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">Kelas {cls?.nama_kelas || '-'}</span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">G</div>
                          {teacher?.nama_lengkap || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-zoomIn flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                {editingId ? 'Edit Jadwal' : 'Tambah Jadwal Baru'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="schedule-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hari</label>
                  <select
                    required
                    value={formData.hari}
                    onChange={e => setFormData({ ...formData, hari: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  >
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas *</label>
                  <SearchableSelect
                    options={[
                      { value: '', label: 'Pilih Kelas' },
                      ...classes.map(c => ({ value: c.id, label: c.nama_kelas, searchStr: c.nama_kelas }))
                    ]}
                    value={formData.class_id}
                    onChange={(val) => setFormData({ ...formData, class_id: val })}
                    placeholder="Pilih Kelas"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai *</label>
                  <input 
                    type="time"
                    required
                    value={formData.jam_mulai}
                    onChange={e => setFormData({ ...formData, jam_mulai: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai *</label>
                  <input 
                    type="time"
                    required
                    value={formData.jam_selesai}
                    onChange={e => setFormData({ ...formData, jam_selesai: e.target.value })}
                    className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran *</label>
                <input 
                  type="text"
                  required
                  placeholder="Misal: Matematika"
                  value={formData.mapel}
                  onChange={e => setFormData({ ...formData, mapel: e.target.value })}
                  className="w-full border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                />
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guru Pengajar *</label>
                  <SearchableSelect
                    options={teachers.map(t => ({ value: t.id, label: t.nama_lengkap, searchStr: t.nip }))}
                    value={formData.teacher_id}
                    onChange={(val) => setFormData({ ...formData, teacher_id: val })}
                    placeholder="Pilih Guru"
                    required
                  />
                </div>
              )}
            </form>
            
            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer text-sm"
              >
                Batal
              </button>
              <button
                type="submit"
                form="schedule-form"
                disabled={saveMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer text-sm"
              >
                {saveMutation.isPending ? 'Menyimpan...' : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Hapus Jadwal"
        message="Apakah Anda yakin ingin menghapus jadwal ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={() => {
          if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <ConfirmModal
        isOpen={confirmDeleteGlobal}
        title="Hapus Gambar Jadwal Global"
        message="Apakah Anda yakin ingin menghapus gambar jadwal pelajaran global ini?"
        onConfirm={() => {
          deleteGlobalScheduleMutation.mutate();
        }}
        onCancel={() => setConfirmDeleteGlobal(false)}
      />

      {/* PDF Modal */}
      <ConfirmModal
        isOpen={confirmDeleteGlobal2}
        title="Hapus Gambar Jadwal Global 2"
        message="Apakah Anda yakin ingin menghapus gambar jadwal pelajaran global 2 ini?"
        onConfirm={() => {
          deleteGlobalSchedule2Mutation.mutate();
        }}
        onCancel={() => setConfirmDeleteGlobal2(false)}
      />
      {activePdfUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Pratinjau PDF
              </h3>
              <button
                onClick={() => setActivePdfUrl(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-slate-100 flex flex-col items-center" ref={modalPdfContainerRef}>
              <Document 
                file={activePdfUrl} 
                onLoadSuccess={onDocumentLoadSuccessModal}
                loading={<div className="p-8 text-slate-500 animate-pulse">Memuat pratinjau PDF...</div>}
                error={<div className="p-8 text-red-500">Gagal memuat jadwal.</div>}
                className="flex flex-col items-center gap-4 w-full"
              >
                {Array.from(new Array(numPagesModal || 0), (el, index) => (
                  <Page 
                    key={`modal_page_${index + 1}`}
                    pageNumber={index + 1} 
                    renderTextLayer={false} 
                    renderAnnotationLayer={false} 
                    width={modalPdfWidth}
                    className="shadow-sm border border-slate-200"
                  />
                ))}
              </Document>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
