const fs = require('fs');

function revertModal(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf-8');

  // 1. Revert modal wrapper
  code = code.replace(
    /className="fixed inset-0 z-50 overflow-y-auto bg-slate-900\/75 backdrop-blur-xs flex items-start justify-center p-4 md:p-6 print:[^"]+"/g,
    'className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-start justify-center p-4 md:p-6 no-print"'
  );

  // 2. Revert modal container
  code = code.replace(
    /className="bg-slate-100 print:bg-white rounded-2xl print:rounded-none w-full max-w-\[220mm\] print:max-w-none shadow-2xl print:shadow-none overflow-hidden print:overflow-visible flex flex-col my-8 print:my-0"/g,
    'className="bg-slate-100 rounded-2xl w-full max-w-[220mm] shadow-2xl overflow-hidden flex flex-col my-8"'
  );

  // 3. Revert control header
  code = code.replace(
    /className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 print:hidden"/g,
    'className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4"'
  );

  // 4. Revert iframe warning
  code = code.replace(
    /className="bg-amber-50 border-b border-amber-200\/60 px-6 py-3 text-xs text-amber-800 font-medium print:hidden"/g,
    'className="bg-amber-50 border-b border-amber-200/60 px-6 py-3 text-xs text-amber-800 font-medium"'
  );

  // 5. Revert customizer
  code = code.replace(
    /className="bg-white border-b border-slate-200 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs print:hidden"/g,
    'className="bg-white border-b border-slate-200 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs no-print"'
  );
  
  // 6. Revert print-area conditional logic I introduced
  code = code.replace(
    /className=\{\`hidden \$\{\!showPrintPreview \? 'print:block print-area' : 'print:hidden'\}\`\}/g,
    'className="hidden print:block print-area"'
  );

  fs.writeFileSync(path, code);
}

revertModal('src/components/JurnalMengajar.tsx');
revertModal('src/components/LaporanAbsensi.tsx');
revertModal('src/components/ProgresGuru.tsx');
revertModal('src/components/PenilaianSiswa.tsx');
