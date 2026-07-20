const fs = require('fs');

function revertFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf-8');

  // Find the exact bg-white w-[210mm] string and strip the print:* classes
  // We'll use a regex that matches `bg-white w-[210mm] ...` and captures everything before `print:`, then replace.
  
  code = code.replace(
    /className="bg-white w-\[210mm\] min-h-\[297mm\] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between[^"]*"/g,
    'className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between"'
  );

  code = code.replace(
    /className="bg-white w-\[210mm\] min-h-\[297mm\] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left[^"]*"/g,
    'className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left"'
  );
  
  // also revert the scrollable wrapper
  code = code.replace(
    /className="overflow-y-auto p-8 max-h-\[70vh\] flex justify-center bg-slate-200\/50[^"]*"/g,
    'className="overflow-y-auto p-8 max-h-[70vh] flex justify-center bg-slate-200/50"'
  );

  // PenilaianSiswa doesn't have min-h-[297mm], it has:
  // <div className="hidden print:block print:p-8 bg-white" id="print-rekap-nilai">
  
  fs.writeFileSync(path, code);
}

revertFile('src/components/JurnalMengajar.tsx');
revertFile('src/components/LaporanAbsensi.tsx');
revertFile('src/components/ProgresGuru.tsx');
