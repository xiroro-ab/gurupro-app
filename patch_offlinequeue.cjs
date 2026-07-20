const fs = require('fs');
let code = fs.readFileSync('src/services/supabase.ts', 'utf-8');

code = code.replace(/const \{ studentIds, date, isWK \} = item\.data;\s*if \(date && studentIds && studentIds\.length > 0\) \{[\s\S]*?if \(!fetchErr && existing && existing\.length > 0\) \{[\s\S]*?const idsToDelete = existing\s*\.filter\(x => \{[\s\S]*?const itemIsWK = x\.keterangan && x\.keterangan\.startsWith\('\[WK\]'\);\s*return isWK \? itemIsWK : !itemIsWK;\s*\}\)\s*\.map\(x => x\.id\);/,
`const { studentIds, date, mode, isWK } = item.data;
            const delMode = mode || (isWK ? 'walikelas' : 'mapel');
            if (date && studentIds && studentIds.length > 0) {
              const { data: existing, error: fetchErr } = await supabase
                .from('daily_attendances')
                .select('id, keterangan')
                .eq('tanggal', date)
                .in('student_id', studentIds);
              if (!fetchErr && existing && existing.length > 0) {
                const idsToDelete = existing
                  .filter(x => {
                    const itemIsWK = x.keterangan && x.keterangan.startsWith('[WK]');
                    const itemIsKeg = x.keterangan && x.keterangan.startsWith('[KEG]');
                    if (delMode === 'walikelas') return itemIsWK;
                    if (delMode === 'kegiatan') return itemIsKeg;
                    return !itemIsWK && !itemIsKeg;
                  })
                  .map(x => x.id);`);

code = code.replace(/const modeStr = attendances\[0\]\?\.keterangan\?\.startsWith\('\[WK\]'\) \? 'walikelas' \s*: attendances\[0\]\?\.keterangan\?\.startsWith\('\[KEG\]'\) \? 'kegiatan'\s*: 'mapel';\s*if \(date\) \{[\s\S]*?if \(!fetchErr && existing && existing\.length > 0\) \{[\s\S]*?const idsToDelete = existing\s*\.filter\(x => \{[\s\S]*?const itemIsWK = x\.keterangan && x\.keterangan\.startsWith\('\[WK\]'\);\s*return isWK \? itemIsWK : !itemIsWK;\s*\}\)\s*\.map\(x => x\.id\);/,
`const modeStr = attendances[0]?.keterangan?.startsWith('[WK]') ? 'walikelas' 
                  : attendances[0]?.keterangan?.startsWith('[KEG]') ? 'kegiatan'
                  : 'mapel';
            if (date) {
              const { data: existing, error: fetchErr } = await supabase
                .from('daily_attendances')
                .select('id, keterangan')
                .eq('tanggal', date)
                .in('student_id', studentIds);
              if (!fetchErr && existing && existing.length > 0) {
                const idsToDelete = existing
                  .filter(x => {
                    const itemIsWK = x.keterangan && x.keterangan.startsWith('[WK]');
                    const itemIsKeg = x.keterangan && x.keterangan.startsWith('[KEG]');
                    if (modeStr === 'walikelas') return itemIsWK;
                    if (modeStr === 'kegiatan') return itemIsKeg;
                    return !itemIsWK && !itemIsKeg;
                  })
                  .map(x => x.id);`);

fs.writeFileSync('src/services/supabase.ts', code);
