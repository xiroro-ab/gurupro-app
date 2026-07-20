const fs = require('fs');

function fixFile(path) {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf-8');

  // Replace print:p-0 with print:p-8 for safe printing margins
  // Ensure we keep print:block print:min-h-0 so flex doesn't stretch and cut off bottom
  
  code = code.replace(
    /className="bg-white w-\[210mm\] min-h-\[297mm\] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between print:block print:w-full print:min-h-0 print:shadow-none print:border-none print:m-0 print:p-0"/g,
    `className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col justify-between print:block print:w-full print:min-h-0 print:shadow-none print:border-none print:m-0 print:p-6"`
  );

  code = code.replace(
    /className="bg-white w-\[210mm\] min-h-\[297mm\] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left print:block print:w-full print:min-h-0 print:shadow-none print:border-none print:m-0 print:p-0"/g,
    `className="bg-white w-[210mm] min-h-[297mm] p-12 shadow-md border border-slate-300 rounded-sm text-black relative flex flex-col items-stretch text-left print:block print:w-full print:min-h-0 print:shadow-none print:border-none print:m-0 print:p-6"`
  );

  fs.writeFileSync(path, code);
}

fixFile('src/components/JurnalMengajar.tsx');
fixFile('src/components/LaporanAbsensi.tsx');
fixFile('src/components/ProgresGuru.tsx');
fixFile('src/components/PenilaianSiswa.tsx');
