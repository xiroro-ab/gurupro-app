import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GuruService } from '../services/supabase';

// Helper to add autoTable to jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function downloadPdfLaporan(teacherId?: string) {
  try {
    const attendances = await GuruService.getAttendances();
    const journals = await GuruService.getJournals();
    const grades = await GuruService.getGrades();
    const counseling = await GuruService.getCounselingRecords();
    const students = await GuruService.getStudents();
    const classes = await GuruService.getClasses();
    const teachers = await GuruService.getTeachers();
    
    const tahunAjaran = typeof window !== 'undefined' ? (localStorage.getItem('gurupro_tahun_ajaran') || '2025/2026') : '2025/2026';

    const filteredAttendances = teacherId ? attendances.filter(a => a.recorded_by === teacherId) : attendances;
    const filteredJournals = teacherId ? journals.filter(j => j.recorded_by === teacherId) : journals;
    const filteredGrades = teacherId ? grades.filter(g => g.recorded_by === teacherId) : grades;
    const filteredCounseling = teacherId ? counseling.filter(c => c.teacher_id === teacherId) : counseling;

    let titleName = 'Semua Guru';
    if (teacherId) {
      const t = teachers.find(t => t.id === teacherId);
      if (t) titleName = t.nama_lengkap;
    }

    const doc = new jsPDF();
    let yPos = 15;

    const addTitle = (text: string) => {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(text, 14, yPos);
      yPos += 10;
    };

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Laporan Arsip Data Guru', 14, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tahun Ajaran: ${tahunAjaran}`, 14, yPos);
    yPos += 7;
    doc.text(`Nama Guru: ${titleName}`, 14, yPos);
    yPos += 7;
    doc.text(`Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, yPos);
    yPos += 15;

    // 1. Absensi
    if (filteredAttendances.length > 0) {
      addTitle('1. Rekap Absensi');
      const tableData = filteredAttendances.map(a => {
        const student = students.find(s => s.id === a.student_id);
        const kelas = student ? classes.find(c => c.id === student.class_id) : null;
        return [
          a.tanggal,
          student ? student.nama_siswa : 'Unknown',
          kelas ? kelas.nama_kelas : '-',
          a.status.toUpperCase(),
          a.keterangan || '-'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Tanggal', 'Siswa', 'Kelas', 'Status', 'Keterangan']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // 2. Jurnal Mengajar
    if (filteredJournals.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 15; }
      addTitle('2. Jurnal Mengajar');
      const tableData = filteredJournals.map(j => {
        const kelas = classes.find(c => c.id === j.class_id);
        return [
          j.tanggal,
          kelas ? kelas.nama_kelas : 'MGMP',
          j.mapel || '-',
          j.materi || '-',
          j.keterangan || '-'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Tanggal', 'Kelas/MGMP', 'Mapel', 'Materi', 'Keterangan']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // 3. Nilai
    if (filteredGrades.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 15; }
      addTitle('3. Rekap Nilai');
      const tableData = filteredGrades.map(g => {
        const student = students.find(s => s.id === g.student_id);
        const kelas = classes.find(c => c.id === g.class_id);
        return [
          student ? student.nama_siswa : 'Unknown',
          kelas ? kelas.nama_kelas : '-',
          g.mapel || '-',
          g.tipe_nilai.toUpperCase(),
          g.nilai.toString()
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Siswa', 'Kelas', 'Mapel', 'Tipe Nilai', 'Nilai']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // 4. Catatan Konseling
    if (filteredCounseling.length > 0) {
      if (yPos > 250) { doc.addPage(); yPos = 15; }
      addTitle('4. Catatan Kedisiplinan/Konseling');
      const tableData = filteredCounseling.map(c => {
        const student = students.find(s => s.id === c.student_id);
        const kelas = student ? classes.find(cl => cl.id === student.class_id) : null;
        return [
          c.tanggal,
          student ? student.nama_siswa : 'Unknown',
          kelas ? kelas.nama_kelas : '-',
          c.jenis.toUpperCase(),
          c.deskripsi || '-',
          c.poin?.toString() || '0'
        ];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Tanggal', 'Siswa', 'Kelas', 'Jenis', 'Deskripsi', 'Poin']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 15 },
      });
    }

    doc.save(`Laporan_Guru_${titleName.replace(/ /g, '_')}_${tahunAjaran.replace('/', '_')}.pdf`);

  } catch (err) {
    console.warn('Error generating PDF:', err);
    throw err;
  }
}
