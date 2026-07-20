const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Add Cetak button to the Detail Modal
code = code.replace(
  /<button \n                onClick=\{\(\) => setSelectedRiwayat\(null\)\}\n                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"\n              >\n                <X className="w-5 h-5" \/>\n              <\/button>/,
  `<div className="flex items-center gap-3">
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
              </div>`
);

// 2. Add #print-detail-riwayat after the modal
code = code.replace(
  /                  <\/tbody>\n                <\/table>\n              <\/div>\n            <\/div>\n          <\/div>\n        <\/div>\n      \)\}/,
  `                  </tbody>
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
          <div className="border-b-[3px] border-black pb-4 mb-6 text-center">
            <h1 className="text-xl font-bold uppercase tracking-wider">Kementerian Pendidikan dan Kebudayaan</h1>
            <h2 className="text-2xl font-black uppercase tracking-widest mt-1">SMP NEGERI 58 PALEMBANG</h2>
            <p className="text-sm mt-2">Jl. Contoh Alamat Sekolah No. 123, Kota Palembang, Sumatera Selatan</p>
            <p className="text-sm">Email: smpn58@contoh.com | Website: www.smpn58.sch.id</p>
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
                
                return clsStudents.map((student, idx) => {
                  const grade = detailGrades.find(g => g.student_id === student.id);
                  if (!grade) return null;
                  
                  return (
                    <tr key={student.id}>
                      <td className="border border-black py-2 px-3 text-center">{idx + 1}</td>
                      <td className="border border-black py-2 px-3">{student.nama_siswa}</td>
                      <td className="border border-black py-2 px-3 text-center font-bold">{grade.nilai}</td>
                      <td className="border border-black py-2 px-3">{grade.keterangan || '-'}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>

          <div className="mt-12 flex justify-end" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="text-center">
              <p className="text-sm">Palembang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="text-sm font-bold mt-1">Guru Mata Pelajaran</p>
              <div className="h-20"></div>
              <p className="text-sm font-bold underline">{profile.nama_lengkap}</p>
              <p className="text-sm font-mono">NIP. {profile.nip || '-'}</p>
            </div>
          </div>
        </div>
      )}`
);

fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
