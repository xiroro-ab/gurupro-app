const fs = require('fs');
let code = fs.readFileSync('src/services/supabase.ts', 'utf-8');

// Update deleteAttendances signature and logic
code = code.replace(/async deleteAttendances\(studentIds: string\[\], date: string, isWK: boolean\): Promise<void> \{/,
`async deleteAttendances(studentIds: string[], date: string, mode: 'walikelas' | 'mapel' | 'kegiatan' = 'mapel'): Promise<void> {`);

code = code.replace(/const typeStr = isWK \? 'Wali Kelas' : 'Guru Mapel';\s*const desc = \`Hapus Presensi \$\{typeStr\} - Tanggal \$\{date\}\`;\s*OfflineQueue.add\('attendance', 'delete', \{studentIds, date, isWK\}, desc\);/g,
`const typeStr = mode === 'walikelas' ? 'Wali Kelas' : mode === 'kegiatan' ? 'Kegiatan' : 'Guru Mapel';
        const desc = \`Hapus Presensi \$\{typeStr\} - Tanggal \$\{date\}\`;
        OfflineQueue.add('attendance', 'delete', {studentIds, date, mode}, desc);`);

code = code.replace(/const itemIsWK = item\.keterangan && item\.keterangan\.startsWith\('\[WK\]'\);\s*return isWK \? itemIsWK : !itemIsWK;/g,
`const itemIsWK = item.keterangan && item.keterangan.startsWith('[WK]');
              const itemIsKeg = item.keterangan && item.keterangan.startsWith('[KEG]');
              if (mode === 'walikelas') return itemIsWK;
              if (mode === 'kegiatan') return itemIsKeg;
              return !itemIsWK && !itemIsKeg;`);
              
code = code.replace(/const itemIsWK = a\.keterangan && a\.keterangan\.startsWith\('\[WK\]'\);\s*return isWK \? !itemIsWK : itemIsWK; \/\/ if saving WK, keep mapel. If saving mapel, keep WK./g,
`const itemIsWK = a.keterangan && a.keterangan.startsWith('[WK]');
        const itemIsKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
        const isTargetMode = mode === 'walikelas' ? itemIsWK : mode === 'kegiatan' ? itemIsKeg : (!itemIsWK && !itemIsKeg);
        return !isTargetMode;`);

// Update saveAttendances
code = code.replace(/const isWK = attendances\[0\]\?\.keterangan\?\.startsWith\('\[WK\]'\);/g,
`const modeStr = attendances[0]?.keterangan?.startsWith('[WK]') ? 'walikelas' 
                  : attendances[0]?.keterangan?.startsWith('[KEG]') ? 'kegiatan'
                  : 'mapel';`);

code = code.replace(/const typeStr = isWK \? 'Wali Kelas' : 'Guru Mapel';/g,
`const typeStr = modeStr === 'walikelas' ? 'Wali Kelas' : modeStr === 'kegiatan' ? 'Kegiatan' : 'Guru Mapel';`);

fs.writeFileSync('src/services/supabase.ts', code);
