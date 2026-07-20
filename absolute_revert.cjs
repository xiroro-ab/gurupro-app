const fs = require('fs');

function revertPaper(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf-8');

  // Strip all print:* modifiers from the paper container
  code = code.replace(
    /className="bg-white w-full max-w-\[210mm\] min-h-\[297mm\] p-8 sm:p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between[^"]*"/g,
    'className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between"'
  );

  code = code.replace(
    /className="bg-white w-full max-w-\[210mm\] min-h-\[297mm\] p-8 sm:p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left[^"]*"/g,
    'className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left"'
  );
  
  // also revert any other remnants
  code = code.replace(
    /className="bg-white w-\[210mm\] min-h-\[297mm\] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between print:[^"]*"/g,
    'className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between"'
  );

  fs.writeFileSync(path, code);
}

revertPaper('src/components/JurnalMengajar.tsx');
revertPaper('src/components/LaporanAbsensi.tsx');
revertPaper('src/components/ProgresGuru.tsx');
