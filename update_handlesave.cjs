const fs = require('fs');
let code = fs.readFileSync('src/components/AbsensiHarian.tsx', 'utf-8');

code = code.replace(/const recordsToSave: Omit<DailyAttendance, 'id'>\[\] = classStudents\.map\(student => \{[\s\S]*?\}\);/g,
`const recordsToSave: Omit<DailyAttendance, 'id'>[] = classStudents.map(student => {
      const state = attendanceState[student.id] || { status: 'hadir', keterangan: '' };
      
      let finalKeterangan = (state.keterangan || '').trim();
      if (isKegiatanMode && namaKegiatan.trim()) {
        finalKeterangan = finalKeterangan ? \`\${namaKegiatan.trim()} - \${finalKeterangan}\` : namaKegiatan.trim();
      }
      finalKeterangan = prefix + " " + finalKeterangan;
      
      return {
        student_id: student.id,
        status: state.status,
        keterangan: finalKeterangan.trim(),
        tanggal: selectedDate,
        recorded_by: profile.id
      };
    });`);

fs.writeFileSync('src/components/AbsensiHarian.tsx', code);
