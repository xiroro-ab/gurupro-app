const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/case 'absensi-mapel':\s*return <AbsensiHarian currentUser=\{currentUser\} mode="mapel" \/>;/,
`case 'absensi-mapel':
        return <AbsensiHarian currentUser={currentUser} mode="mapel" />;
      case 'absensi-kegiatan':
        return <AbsensiHarian currentUser={currentUser} mode="kegiatan" />;`);

fs.writeFileSync('src/App.tsx', code);
