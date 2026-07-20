const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Remove the wrapping `<div className="print:hidden">` for riwayat_input
// It starts at line 442 usually, let's find it.
const pattern1 = /<div className="bg-white rounded-3xl border border-slate-200\/80 shadow-xs overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible">\s*<div className="print:hidden">/;
const replacement1 = `<div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible">`;
code = code.replace(pattern1, replacement1);

// 2. Add print:hidden to the header (line 443)
const pattern2 = /<div className="p-5 border-b border-slate-100 bg-slate-50\/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">/;
const replacement2 = `<div className="print:hidden p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">`;
code = code.replace(pattern2, replacement2);

// 3. Add print:hidden to "Belum ada riwayat" message
const pattern3 = /<div className="text-center py-12 text-slate-400 italic font-medium">\s*Belum ada riwayat input nilai\.\s*<\/div>/;
const replacement3 = `<div className="print:hidden text-center py-12 text-slate-400 italic font-medium">\n                    Belum ada riwayat input nilai.\n                  </div>`;
code = code.replace(pattern3, replacement3);

// 4. Add print:hidden to the table wrapper
const pattern4 = /<div className="overflow-x-auto border border-slate-200 rounded-xl">/;
const replacement4 = `<div className="print:hidden overflow-x-auto border border-slate-200 rounded-xl">`;
code = code.replace(pattern4, replacement4);

// 5. Remove the closing </div> for the removed <div className="print:hidden">
// It is located right before {activeSubTab === 'rekap' && isWaliKelas && myClass && (
const pattern5 = /<\/div>\s*<\/div>\s*<\/div>\s*\{activeSubTab === 'rekap'/;
const replacement5 = `</div>\n        </div>\n      )}\n\n      {activeSubTab === 'rekap'`;
code = code.replace(pattern5, replacement5);


fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
console.log('Success print:hidden fix');
