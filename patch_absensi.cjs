const fs = require('fs');
let code = fs.readFileSync('src/components/AbsensiHarian.tsx', 'utf-8');

code = code.replace(/mode\?: 'walikelas' \| 'mapel';/, `mode?: 'walikelas' | 'mapel' | 'kegiatan';`);
code = code.replace(/mutationFn: \(\{ studentIds, date, isWK \}: \{ studentIds: string\[\], date: string, isWK: boolean \}\) =>\s*GuruService\.deleteAttendances\(studentIds, date, isWK\)/,
`mutationFn: ({ studentIds, date, delMode }: { studentIds: string[], date: string, delMode: 'walikelas' | 'mapel' | 'kegiatan' }) => 
      GuruService.deleteAttendances(studentIds, date, delMode)`);

code = code.replace(/deleteMutation\.mutate\(\{ studentIds, date: today, isWK: isWalikelasMode \}\);/g,
`deleteMutation.mutate({ studentIds, date: today, delMode: mode });`);

// The "isWalikelasMode" is still used to detect if mode === 'walikelas'.
// Let's add "isKegiatanMode = mode === 'kegiatan';"
code = code.replace(/const isWalikelasMode = mode === 'walikelas';/,
`const isWalikelasMode = mode === 'walikelas';
  const isKegiatanMode = mode === 'kegiatan';`);
  
// Also in saveAttendances
// We need to inject `[KEG]` prefix.
// The current code builds keterangan.
code = code.replace(/const newKeterangan = /g, `let newKeterangan = `);
code = code.replace(/if \(isWalikelasMode\) \{\s*newKeterangan = \`\\[WK\\] \$\{newKeterangan\}\`;\s*\}/, 
`if (isWalikelasMode) {
            newKeterangan = \`[WK] \${newKeterangan}\`;
          } else if (isKegiatanMode) {
            newKeterangan = \`[KEG] \${newKeterangan}\`;
          }`);

fs.writeFileSync('src/components/AbsensiHarian.tsx', code);
