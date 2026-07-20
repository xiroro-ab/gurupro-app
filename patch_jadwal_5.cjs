const fs = require('fs');
let code = fs.readFileSync('src/components/JadwalPelajaran.tsx', 'utf-8');

const replacement = `      {globalSchedule2 && (
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
                  onClick={() => setShowPdfModal(true)}
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
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<div className="p-8 text-slate-500 animate-pulse text-sm">Memuat pratinjau jadwal 2...</div>}
                  error={<div className="p-8 text-red-500 text-sm">Gagal memuat jadwal 2. Silakan unduh file.</div>}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  {Array.from(new Array(numPages || 0), (el, index) => (
                    <Page 
                      key={\`page2_\${index + 1}\`}
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
      )}`;

// We find the end of globalSchedule block
code = code.replace(/<div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">/, 
  replacement + '\n      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">');

// Add Confirm delete for global schedule 2
const confirmReplacement = `<ConfirmModal
        isOpen={confirmDeleteGlobal2}
        title="Hapus Gambar Jadwal Global 2"
        message="Apakah Anda yakin ingin menghapus gambar jadwal pelajaran global 2 ini?"
        onConfirm={() => {
          deleteGlobalSchedule2Mutation.mutate();
        }}
        onCancel={() => setConfirmDeleteGlobal2(false)}
      />`;

code = code.replace(/\{showPdfModal && globalSchedule\?\.type === 'application\/pdf' && \(/, 
  confirmReplacement + '\n      {showPdfModal && (globalSchedule?.type === \'application/pdf\' || globalSchedule2?.type === \'application/pdf\') && (');

fs.writeFileSync('src/components/JadwalPelajaran.tsx', code);
