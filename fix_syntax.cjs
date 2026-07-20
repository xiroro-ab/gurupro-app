const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Remove the wrongly placed inputs
const wrongInputsPattern = /\s*<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 print:hidden">[\s\S]*?<\/div>\s*\/\/ Group by class_id, mapel, tipe_nilai, semester/;
code = code.replace(wrongInputsPattern, '\n              // Group by class_id, mapel, tipe_nilai, semester');

// 2. Insert inputs right before {(() => {
const insertPattern = /<div className="p-6">\s*\{\(\(\) => \{/;
const correctInputs = `<div className="p-6">
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
            {(() => {`;

code = code.replace(insertPattern, correctInputs);

// 3. Fix the closing div mismatch at the end of riwayat_input
// Let's replace the ending block accurately
// Currently it is:
// 685                })()}
// 686              </div>
// 687            </div>
// 688              </div>
// 689          )}
//
// We want:
// 685                })()}
// 686              </div>
// 687            </div>
// 688          )}

const fixEndPattern = /\}\)\(\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
code = code.replace(fixEndPattern, `})()}\n          </div>\n        </div>\n      )}`);

fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
console.log('Fixed syntax!');
