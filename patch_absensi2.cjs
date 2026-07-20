const fs = require('fs');
let code = fs.readFileSync('src/components/AbsensiHarian.tsx', 'utf-8');

code = code.replace(/deleteMutation\.mutate\(\{\s*studentIds,\s*date:\s*selectedDate,\s*isWK:\s*isWalikelasMode\s*\}\);/g,
`deleteMutation.mutate({
      studentIds,
      date: selectedDate,
      delMode: mode
    });`);
    
code = code.replace(/const prefix = isWalikelasMode \? '\[WK\]' : '\[MP\]';/g,
`const prefix = isWalikelasMode ? '[WK]' : isKegiatanMode ? '[KEG]' : '[MP]';`);

code = code.replace(/\{isWalikelasMode \? 'Catat Presensi Harian Wali Kelas' : 'Catat Presensi Guru Mapel'\}/,
`{isWalikelasMode ? 'Catat Presensi Harian Wali Kelas' : isKegiatanMode ? 'Catat Presensi Kegiatan Tambahan' : 'Catat Presensi Guru Mapel'}`);

fs.writeFileSync('src/components/AbsensiHarian.tsx', code);
