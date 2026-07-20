const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

const inputsHTML = `              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Nama Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNama} onChange={e => setKepalaSekolahNama(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">NIP Kepala Sekolah (Cetak):</label>
                  <input type="text" value={kepalaSekolahNip} onChange={e => setKepalaSekolahNip(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
                </div>
              </div>
`;

// Find line 494 which is `// Group by class_id...`
const targetPattern = /\/\/ Group by class_id, mapel, tipe_nilai, semester/;
if (code.match(targetPattern)) {
    code = code.replace(targetPattern, inputsHTML + '              // Group by class_id, mapel, tipe_nilai, semester');
    fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
    console.log('Added inputs to main Riwayat View');
} else {
    console.log('Pattern not found');
}
