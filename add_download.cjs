const fs = require('fs');
let code = fs.readFileSync('src/services/supabase.ts', 'utf8');

const helper = `
  async downloadArsipData(teacherId?: string): Promise<void> {
    try {
      const attendances = await this.getAttendances();
      const journals = await this.getJournals();
      const grades = await this.getGrades();
      const counseling = await this.getCounselingRecords();
      
      const filteredAttendances = teacherId ? attendances.filter(a => a.recorded_by === teacherId) : attendances;
      const filteredJournals = teacherId ? journals.filter(j => j.recorded_by === teacherId) : journals;
      const filteredGrades = teacherId ? grades.filter(g => g.recorded_by === teacherId) : grades;
      const filteredCounseling = teacherId ? counseling.filter(c => c.teacher_id === teacherId) : counseling;

      const exportData = {
        tahun_ajaran: typeof window !== 'undefined' ? localStorage.getItem('gurupro_tahun_ajaran') : '',
        timestamp: new Date().toISOString(),
        teacher_id: teacherId || 'ALL',
        data: {
          absensi: filteredAttendances,
          jurnal: filteredJournals,
          nilai: filteredGrades,
          konseling: filteredCounseling
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`Arsip_Data_\${teacherId || 'Global'}_\${exportData.tahun_ajaran?.replace('/', '_')}.json\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading arsip data', err);
      throw err;
    }
  },
`;

if (!code.includes('downloadArsipData')) {
  code = code.replace(/async cleanTransactionalData\(\): Promise<void> \{/, helper + '\n  async cleanTransactionalData(): Promise<void> {');
  fs.writeFileSync('src/services/supabase.ts', code);
}
