const fs = require('fs');
let code = fs.readFileSync('src/components/JadwalPelajaran.tsx', 'utf-8');

code = code.replace(/const \[pdfBlobUrl, setPdfBlobUrl\] = useState<string \| null>\(null\);/,
`const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfBlobUrl2, setPdfBlobUrl2] = useState<string | null>(null);`);

code = code.replace(/const \[confirmDeleteGlobal, setConfirmDeleteGlobal\] = useState\(false\);/,
`const [confirmDeleteGlobal, setConfirmDeleteGlobal] = useState(false);
  const [confirmDeleteGlobal2, setConfirmDeleteGlobal2] = useState(false);`);

code = code.replace(/const handleFileUpload = \(e: React.ChangeEvent<HTMLInputElement>\) => \{/,
`const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isSecond = false) => {`);

code = code.replace(/saveGlobalScheduleMutation\.mutate\(\{[\s\S]*?\}\);/,
`const payload = {
          url: dataUrl,
          name: file.name,
          type: file.type,
          updated_at: new Date().toISOString()
        };
        if (isSecond) {
          saveGlobalSchedule2Mutation.mutate(payload);
        } else {
          saveGlobalScheduleMutation.mutate(payload);
        }`);

code = code.replace(/onChange=\{handleFileUpload\}/g,
`onChange={(e) => handleFileUpload(e, false)}`);

fs.writeFileSync('src/components/JadwalPelajaran.tsx', code);
