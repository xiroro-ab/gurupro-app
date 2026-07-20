const fs = require('fs');
let code = fs.readFileSync('src/components/LaporanAbsensi.tsx', 'utf-8');

code = code.replace(/const \[reportType, setReportType\] = useState\<'walikelas' \| 'mapel'\>\(/,
`const [reportType, setReportType] = useState<'walikelas' | 'mapel' | 'kegiatan'>(`);

// Replace filtering logic
code = code.replace(/const isWK = a\.keterangan && a\.keterangan\.startsWith\('\[WK\]'\);\s*if \(reportType === 'walikelas'\) \{\s*return isWK;\s*\} else \{\s*\/\/ reportType === 'mapel'\s*const isMapel = !isWK;\s*if \(!isMapel\) return false;/,
`const isWK = a.keterangan && a.keterangan.startsWith('[WK]');
    const isKeg = a.keterangan && a.keterangan.startsWith('[KEG]');
    const isMapel = !isWK && !isKeg;

    if (reportType === 'walikelas') {
      return isWK;
    } else if (reportType === 'kegiatan') {
      return isKeg;
    } else {
      // reportType === 'mapel'
      if (!isMapel) return false;`);
      
// Add Kegiatan to the filter UI
code = code.replace(/<button\s*onClick=\{\(\) => setReportType\('mapel'\)\}/,
`<button
              onClick={() => setReportType('kegiatan')}
              className={\`px-4 py-2 rounded-xl text-sm font-bold transition-colors \${
                reportType === 'kegiatan' ? 'bg-white text-blue-700 shadow-sm border border-blue-100' : 'text-slate-500 hover:text-slate-700'
              }\`}
            >
              Absensi Kegiatan Lain
            </button>
            <button
              onClick={() => setReportType('mapel')}`);

fs.writeFileSync('src/components/LaporanAbsensi.tsx', code);
