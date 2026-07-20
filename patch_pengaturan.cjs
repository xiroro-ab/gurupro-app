const fs = require('fs');
let code = fs.readFileSync('src/components/PengaturanSistem.tsx', 'utf8');

code = code.replace(
  /import \{ Calendar, Trash2, AlertTriangle, Save, Loader2, Database \} from 'lucide-react';/,
  "import { Calendar, Trash2, AlertTriangle, Save, Loader2, Database, FileText as FilePdf } from 'lucide-react';\nimport { downloadPdfLaporan } from '../utils/pdfExport';"
);

const stateAndEffect = `  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  
  useEffect(() => {
    loadTahunAjaran();
    loadTeachers();
  }, []);
  
  const loadTeachers = async () => {
    try {
      const data = await GuruService.getTeachers();
      setTeachers(data);
    } catch (e) {
      console.error(e);
    }
  };
`;

code = code.replace(
  /useEffect\(\(\) => \{\n    loadTahunAjaran\(\);\n  \}, \[\]\);/,
  stateAndEffect
);

const newBox = `
        {/* Unduh Laporan PDF */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl">
              <FilePdf className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Laporan PDF Data Transaksi</h3>
              <p className="text-xs text-slate-500">Unduh data absensi, jurnal, nilai, dll dalam PDF</p>
            </div>
          </div>
          
          <div className="flex flex-col flex-1 space-y-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Guru (Atau Semua)</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 font-semibold text-slate-800"
              >
                <option value="">Semua Guru (Global)</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.nama_lengkap}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={async () => {
                try {
                  await downloadPdfLaporan(selectedTeacherId || undefined);
                  notification.success('Berhasil mengunduh laporan PDF');
                } catch(e) {
                  notification.error('Gagal mengunduh laporan PDF');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-sm"
            >
              <FilePdf className="w-5 h-5" />
              Download Laporan PDF
            </button>
          </div>
        </div>
`;

code = code.replace(
  /<\/div>\n\n      <ConfirmModal/,
  newBox + '\n      </div>\n\n      <ConfirmModal'
);

code = code.replace(
  /md:grid-cols-2 gap-6/,
  'md:grid-cols-2 lg:grid-cols-3 gap-6'
);

fs.writeFileSync('src/components/PengaturanSistem.tsx', code);
