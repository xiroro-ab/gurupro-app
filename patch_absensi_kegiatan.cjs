const fs = require('fs');
let code = fs.readFileSync('src/components/AbsensiHarian.tsx', 'utf-8');

code = code.replace(/const \[selectedDate, setSelectedDate\] = useState<string>\(today\);/,
`const [selectedDate, setSelectedDate] = useState<string>(today);
  const [namaKegiatan, setNamaKegiatan] = useState<string>('');`);
  
code = code.replace(/let newKeterangan = \(state\.keterangan \|\| ''\);/,
`let newKeterangan = (state.keterangan || '');
          if (isKegiatanMode && namaKegiatan) {
            newKeterangan = \`\${namaKegiatan} - \${newKeterangan}\`;
          }`);
          
code = code.replace(/\{isWalikelasMode \? 'Catat Presensi Harian Wali Kelas' : isKegiatanMode \? 'Catat Presensi Kegiatan Tambahan' : 'Catat Presensi Guru Mapel'\}/,
`{isWalikelasMode ? 'Catat Presensi Harian Wali Kelas' : isKegiatanMode ? 'Catat Presensi Kegiatan Tambahan' : 'Catat Presensi Guru Mapel'}
          {isKegiatanMode && (
            <div className="mt-2">
              <input
                type="text"
                placeholder="Nama Kegiatan (contoh: Kokurikuler Pramuka)"
                value={namaKegiatan}
                onChange={(e) => setNamaKegiatan(e.target.value)}
                className="w-full lg:w-96 px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 text-sm"
              />
            </div>
          )}`);

fs.writeFileSync('src/components/AbsensiHarian.tsx', code);
