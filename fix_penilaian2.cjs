const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

// 1. Give print-area to riwayat
code = code.replace(
  /<div className="hidden print:block print:w-full print:p-8 bg-white" id="print-riwayat-nilai">/g,
  `<div className="hidden print:block print-area print:p-8 bg-white" id="print-riwayat-nilai">`
);

// 2. Guard rekap with activeSubTab and give it print-area
code = code.replace(
  /      \{\/\* Hidden Print Content \*\/\}\n      \{isWaliKelas && myClass && \(\n        <div className="hidden print:block print:p-8 bg-white" id="print-rekap-nilai">/g,
  `      {/* Hidden Print Content */}
      {activeSubTab === 'rekap' && isWaliKelas && myClass && (
        <div className="hidden print:block print-area print:p-8 bg-white" id="print-rekap-nilai">`
);

fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
