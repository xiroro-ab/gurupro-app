const fs = require('fs');
let code = fs.readFileSync('src/components/JadwalPelajaran.tsx', 'utf-8');

code = code.replace(/<span className="hidden sm:inline">Upload Gambar Jadwal<\/span>\n\s*<span className="sm:hidden">Upload<\/span>\n\s*<\/label>\n\s*<\/div>\n\s*\)}/g,
`<span className="hidden sm:inline">Upload Jadwal Utama</span>
                <span className="sm:hidden">Upload 1</span>
              </label>
            </div>
          )}
          {isAdmin && (
            <div>
              <input
                type="file"
                id="upload-jadwal-2"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileUpload(e, true)}
              />
              <label
                htmlFor="upload-jadwal-2"
                className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer text-sm"
              >
                {saveGlobalSchedule2Mutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Upload Jadwal Tambahan</span>
                <span className="sm:hidden">Upload 2</span>
              </label>
            </div>
          )}`);

fs.writeFileSync('src/components/JadwalPelajaran.tsx', code);
