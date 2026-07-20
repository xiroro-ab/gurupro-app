const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Change riwayat_input wrapper to NOT have print:hidden on the outer div
code = code.replace(
  /\{activeSubTab === 'riwayat_input' && \(\n        <div className="print:hidden bg-white rounded-3xl border border-slate-200\/80 shadow-xs overflow-hidden">/g,
  `{activeSubTab === 'riwayat_input' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none print:bg-transparent print:overflow-visible">
          <div className="print:hidden">`
);

// 2. Close the print:hidden div right before the hidden print content, and then add it
code = code.replace(
  /                <\/div>\n\n                \{\/\* Hidden Print Content for Riwayat \*\/\}\n                <div className="hidden" id="print-riwayat-nilai">/g,
  `                </div>
          </div>
                {/* Hidden Print Content for Riwayat */}
                <div className="hidden print:block print:w-full print:p-8 bg-white" id="print-riwayat-nilai">`
);

fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
