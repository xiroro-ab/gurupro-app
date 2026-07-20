const fs = require('fs');
let code = fs.readFileSync('src/components/JurnalMengajar.tsx', 'utf8');

// Hide Keterangan in form
code = code.replace(
  /<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1">\{getKeteranganLabel\(\)\}<\/label>\s*<textarea\s*rows=\{2\}\s*value=\{keterangan\}\s*onChange=\{\(e\) => setKeterangan\(e\.target\.value\)\}\s*placeholder=\{getKeteranganPlaceholder\(\)\}\s*className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"\s*\/>\s*<\/div>/,
  `{!(type === 'agenda_harian' || type === 'agenda_mgmp') && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">{getKeteranganLabel()}</label>
            <textarea
              rows={2}
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder={getKeteranganPlaceholder()}
              className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        )}`
);

// Hide Hambatan in form (it's inside {!type.includes('mgmp') && ( ... )} )
code = code.replace(
  /<div>\s*<label className="block text-xs font-bold text-slate-700 mb-1">Hambatan & Solusi Pembelajaran<\/label>\s*<textarea\s*rows=\{2\}\s*value=\{hambatanSolusi\}\s*onChange=\{\(e\) => setHambatanSolusi\(e\.target\.value\)\}\s*placeholder="Tuliskan hambatan yang ditemui saat pembelajaran dan solusi\/tindak lanjutnya\.\.\."\s*className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"\s*\/>\s*<\/div>/,
  `{type !== 'agenda_harian' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hambatan & Solusi Pembelajaran</label>
                <textarea
                  rows={2}
                  value={hambatanSolusi}
                  onChange={(e) => setHambatanSolusi(e.target.value)}
                  placeholder="Tuliskan hambatan yang ditemui saat pembelajaran dan solusi/tindak lanjutnya..."
                  className="block w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
            )}`
);

fs.writeFileSync('src/components/JurnalMengajar.tsx', code);
