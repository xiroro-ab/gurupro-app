const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf-8');

code = code.replace(/\{ id: 'absensi-mapel', label: 'Absensi Guru Mapel', icon: CheckSquare \},/g, 
`{ id: 'absensi-mapel', label: 'Absensi Guru Mapel', icon: CheckSquare },
          { id: 'absensi-kegiatan', label: 'Absensi Kegiatan Tambahan', icon: CheckSquare },`);

fs.writeFileSync('src/components/Sidebar.tsx', code);
