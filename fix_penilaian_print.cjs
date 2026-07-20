const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Add State
if (!code.includes('const [kepalaSekolahNama')) {
  code = code.replace(
    /const \[activeSubTab, setActiveSubTab\] = useState\('input'\);/,
    `const [activeSubTab, setActiveSubTab] = useState('input');
  const [kepalaSekolahNama, setKepalaSekolahNama] = useState('Drs. H. M. Ali, M.Pd');
  const [kepalaSekolahNip, setKepalaSekolahNip] = useState('19700101 199512 1 001');`
  );
}

// 2. Fix "Cetak Riwayat" button (remove JS style injection)
const cetakRiwayatOld = `                      onClick={() => {
                        toast.info('Gunakan Ctrl+P untuk mencetak jika pratinjau cetak tidak muncul secara otomatis.', 'Info Cetak');
                        const style = document.createElement('style');
                        style.id = 'print-style-riwayat';
                        style.innerHTML = \`
                          @media print {
                            body * { visibility: hidden; }
                            #print-riwayat-nilai, #print-riwayat-nilai * { visibility: visible; }
                            #print-riwayat-nilai { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
                            #print-rekap-nilai { display: none !important; }
                          }
                        \`;
                        document.head.appendChild(style);
                        setTimeout(() => {
                          window.print();
                          setTimeout(() => document.head.removeChild(style), 1000);
                        }, 500);
                      }}`;
const cetakRiwayatNew = `                      onClick={() => {
                        setTimeout(() => window.print(), 500);
                      }}`;
code = code.replace(cetakRiwayatOld, cetakRiwayatNew);

// 3. Add Input Fields to Riwayat UI (before the table)
const riwayatTableOld = `<div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">`;
const riwayatInputs = `<div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 print:hidden">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">Nama Kepala Sekolah (Cetak):</label>
                      <input type="text" value={kepalaSekolahNama} onChange={e => setKepalaSekolahNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1 text-xs">NIP Kepala Sekolah (Cetak):</label>
                      <input type="text" value={kepalaSekolahNip} onChange={e => setKepalaSekolahNip(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6">`;
code = code.replace(riwayatTableOld, riwayatInputs);

// 4. Add Input Fields to Detail Modal (before the table)
const detailTableOld = `            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 border-b border-slate-100">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">`;
const detailInputs = `            <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 border-b border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Nama Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNama} onChange={e => setKepalaSekolahNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">NIP Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNip} onChange={e => setKepalaSekolahNip(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">`;
code = code.replace(detailTableOld, detailInputs);

// 5. Add Input Fields to Print Preview Modal (Rekap)
const previewTableOld = `            <div className="p-6 sm:p-8 overflow-y-auto">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">`;
const previewInputs = `            <div className="p-6 sm:p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Nama Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNama} onChange={e => setKepalaSekolahNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">NIP Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNip} onChange={e => setKepalaSekolahNip(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">`;
code = code.replace(previewTableOld, previewInputs);

// Kop Surat String
const kopSurat = `          {/* Kop Surat Header */}
          <div className="kop-surat" style={{ display: 'flex', alignItems: 'center', borderBottom: '3px solid black', paddingBottom: '10px', marginBottom: '20px' }}>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/Logo_Palembang.png" style={{ width: '80px', height: '80px' }} alt="Logo Pemkot" crossOrigin="anonymous" referrerPolicy="no-referrer" />
            <div style={{ textAlign: 'center', flexGrow: 1 }}>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>PEMERINTAH KOTA PALEMBANG</h3>
              <h3 style={{ margin: 0, fontSize: '14pt' }}>DINAS PENDIDIKAN</h3>
              <h3 style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0 }}>SMP NEGERI 58 PALEMBANG</h3>
              <p style={{ fontSize: '0.9em', margin: 0 }}>Jl. Komering II, Kel. Demang Lebar Daun, Kec. Ilir Barat I, Kota Palembang 30137</p>
            </div>
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" style={{ width: '80px', height: '80px', objectFit: 'contain' }} alt="Logo SMP 58" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          </div>`;

const ttdSection = (roleTitle) => `          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip}</p>
            </div>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>${roleTitle}</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{profile.nama_lengkap}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {profile.nip || '-'}</p>
            </div>
          </div>`;

// 6. Rewrite #print-riwayat-nilai
const oldRiwayatKop = /<div className="border-b-\[3px\] border-black pb-4 mb-6 text-center">\s*<h1 className="text-xl font-bold uppercase tracking-wider">Kementerian Pendidikan dan Kebudayaan<\/h1>\s*<h2 className="text-2xl font-black uppercase tracking-widest mt-1">SMP NEGERI 58 PALEMBANG<\/h2>\s*<p className="text-sm mt-2">Jl. Contoh Alamat Sekolah No. 123, Kota Palembang, Sumatera Selatan<\/p>\s*<p className="text-sm">Email: smpn58@contoh.com \| Website: www.smpn58.sch.id<\/p>\s*<\/div>/;
code = code.replace(oldRiwayatKop, kopSurat);

const oldRiwayatTtd = /<div className="mt-12 flex justify-end" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid' \}\}>\s*<div className="text-center">\s*<p className="text-sm">Palembang, \{new Date\(\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}<\/p>\s*<p className="text-sm font-bold mt-1">Guru Mata Pelajaran<\/p>\s*<div className="h-20"><\/div>\s*<p className="text-sm font-bold underline">\{profile\.nama_lengkap\}<\/p>\s*<p className="text-sm font-mono">NIP\. \{profile\.nip \|\| '-'\}<\/p>\s*<\/div>\s*<\/div>/;
code = code.replace(oldRiwayatTtd, ttdSection("Guru Mata Pelajaran"));

// 7. Rewrite #print-detail-riwayat
const oldDetailKop = /<div className="border-b-\[3px\] border-black pb-4 mb-6 text-center">\s*<h1 className="text-xl font-bold uppercase tracking-wider">Kementerian Pendidikan dan Kebudayaan<\/h1>\s*<h2 className="text-2xl font-black uppercase tracking-widest mt-1">SMP NEGERI 58 PALEMBANG<\/h2>\s*<p className="text-sm mt-2">Jl. Contoh Alamat Sekolah No. 123, Kota Palembang, Sumatera Selatan<\/p>\s*<p className="text-sm">Email: smpn58@contoh.com \| Website: www.smpn58.sch.id<\/p>\s*<\/div>/;
code = code.replace(oldDetailKop, kopSurat);

const oldDetailTtd = /<div className="mt-12 flex justify-end" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid' \}\}>\s*<div className="text-center">\s*<p className="text-sm">Palembang, \{new Date\(\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}<\/p>\s*<p className="text-sm font-bold mt-1">Guru Mata Pelajaran<\/p>\s*<div className="h-20"><\/div>\s*<p className="text-sm font-bold underline">\{profile\.nama_lengkap\}<\/p>\s*<p className="text-sm font-mono">NIP\. \{profile\.nip \|\| '-'\}<\/p>\s*<\/div>\s*<\/div>/;
code = code.replace(oldDetailTtd, ttdSection("Guru Mata Pelajaran"));

// 8. Rewrite #print-rekap-nilai
const oldRekapKop = /<div className="border-b-\[3px\] border-black pb-4 mb-6 text-center">\s*<h1 className="text-xl font-bold uppercase tracking-wider">Kementerian Pendidikan dan Kebudayaan<\/h1>\s*<h2 className="text-2xl font-black uppercase tracking-widest mt-1">SMP NEGERI 58 PALEMBANG<\/h2>\s*<p className="text-sm mt-2">Jl. Contoh Alamat Sekolah No. 123, Kota Palembang, Sumatera Selatan<\/p>\s*<p className="text-sm">Email: smpn58@contoh.com \| Website: www.smpn58.sch.id<\/p>\s*<\/div>/;
code = code.replace(oldRekapKop, kopSurat);

const oldRekapTtd = /<div className="mt-12 flex justify-end" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid' \}\}>\s*<div className="text-center">\s*<p className="text-sm">Palembang, \{new Date\(\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}<\/p>\s*<p className="text-sm font-bold mt-1">Wali Kelas \{myClass\.nama_kelas\}<\/p>\s*<div className="h-20"><\/div>\s*<p className="text-sm font-bold underline">\{profile\.nama_lengkap\}<\/p>\s*<p className="text-sm font-mono">NIP\. \{profile\.nip \|\| '-'\}<\/p>\s*<\/div>\s*<\/div>/;
code = code.replace(oldRekapTtd, ttdSection("Wali Kelas {myClass.nama_kelas}"));


fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
console.log('Success');
