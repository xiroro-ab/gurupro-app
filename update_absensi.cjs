const fs = require('fs');
let code = fs.readFileSync('src/components/AbsensiHarian.tsx', 'utf8');

// 1. Import ConfirmModal
code = code.replace(
  /import \{ useNotification \} from '\.\/NotificationToast';/,
  "import { useNotification } from './NotificationToast';\nimport { ConfirmModal } from './ConfirmModal';"
);

// 2. Add state
code = code.replace(
  /const \[selectedClassId, setSelectedClassId\] = useState\(''\);/,
  "const [selectedClassId, setSelectedClassId] = useState('');\n  const [isConfirmOpen, setIsConfirmOpen] = useState(false);"
);

// 3. Update handleDelete and add executeDelete
const deleteFunctions = `
  const handleDelete = () => {
    if (!selectedClassId || !selectedDate) {
      showNotification('Silakan pilih kelas dan tanggal terlebih dahulu.', 'error');
      return;
    }
    setIsConfirmOpen(true);
  };

  const executeDelete = () => {
    const studentIds = classStudents.map(s => s.id);
    deleteMutation.mutate({
      studentIds,
      date: selectedDate,
      isWK: isWalikelasMode
    });
  };
`;

code = code.replace(
  /const handleDelete = \(\) => \{[\s\S]*?deleteMutation\.mutate\(\{[\s\S]*?\}\);\s*\}\s*\};\s*/,
  deleteFunctions
);

// 4. Add ConfirmModal to JSX
const modalJSX = `
      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Hapus Data Presensi?"
        message="Apakah Anda yakin ingin menghapus atau membatalkan seluruh data presensi pada tanggal ini untuk kelas yang dipilih? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        cancelText="Batal"
        onConfirm={executeDelete}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
`;

code = code.replace(
  /    <\/div>\s*<\/div>\s*\);\s*\}\s*$/,
  "    </div>\n" + modalJSX + "\n}\n"
);

fs.writeFileSync('src/components/AbsensiHarian.tsx', code);
