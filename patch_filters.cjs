const fs = require('fs');
let code = fs.readFileSync('src/services/supabase.ts', 'utf8');

// For getAttendances (LocalDB)
code = code.replace(
  /getAttendances: \(\) => \{\s*try \{\s*const data = localStorage\.getItem\('gurupro_attendances'\);/,
  `getAttendances: () => {
      try {
        const data = localStorage.getItem('gurupro_attendances');
        const range = getAcademicYearRange();`
);
code = code.replace(
  /return data \? JSON\.parse\(data\) : \[\];/,
  `const parsed = data ? JSON.parse(data) : [];
        return parsed.filter((item: any) => item.tanggal >= range.start && item.tanggal <= range.end);`
);

// For getJournals (LocalDB)
code = code.replace(
  /getJournals: \(\) => \{\s*try \{\s*const data = localStorage\.getItem\('gurupro_journals'\);/,
  `getJournals: () => {
      try {
        const data = localStorage.getItem('gurupro_journals');
        const range = getAcademicYearRange();`
);
code = code.replace(
  /return data \? \(JSON\.parse\(data\) as any\[\]\)\.map\(parseLegacyJournal\) : \[\];/,
  `const parsed = data ? (JSON.parse(data) as any[]).map(parseLegacyJournal) : [];
        return parsed.filter((item: any) => item.tanggal >= range.start && item.tanggal <= range.end);`
);

// For getGrades (LocalDB)
code = code.replace(
  /getGrades: \(\) => \{\s*try \{\s*const data = localStorage\.getItem\('gurupro_grades'\);/,
  `getGrades: () => {
      try {
        const data = localStorage.getItem('gurupro_grades');
        const range = getAcademicYearRange();`
);
code = code.replace(
  /return data \? JSON\.parse\(data\) : \[\];/,
  `const parsed = data ? JSON.parse(data) : [];
        return parsed.filter((item: any) => {
          if (!item.created_at) return true;
          const dt = item.created_at.split('T')[0];
          return dt >= range.start && dt <= range.end;
        });`
);

// For getCounselingRecords (LocalDB)
code = code.replace(
  /getCounselingRecords: \(\) => \{\s*try \{\s*const data = localStorage\.getItem\('gurupro_counseling_records'\);/,
  `getCounselingRecords: () => {
      try {
        const data = localStorage.getItem('gurupro_counseling_records');
        const range = getAcademicYearRange();`
);
code = code.replace(
  /return data \? JSON\.parse\(data\) : \[\];/,
  `const parsed = data ? JSON.parse(data) : [];
        return parsed.filter((item: any) => item.tanggal >= range.start && item.tanggal <= range.end);`
);

// GuruService.getAttendances
code = code.replace(
  /let query = supabase\.from\('daily_attendances'\)\.select\('\*'\);/,
  `const range = getAcademicYearRange();
        let query = supabase.from('daily_attendances').select('*')
          .gte('tanggal', range.start)
          .lte('tanggal', range.end);`
);

// GuruService.getJournals
code = code.replace(
  /const \{ data, error \} = await supabase\.from\('teaching_journals'\)\.select\('\*'\)\.order\('tanggal', \{ ascending: false \}\);/,
  `const range = getAcademicYearRange();
        const { data, error } = await supabase.from('teaching_journals').select('*')
          .gte('tanggal', range.start)
          .lte('tanggal', range.end)
          .order('tanggal', { ascending: false });`
);

// GuruService.getGrades
code = code.replace(
  /let query = supabase\.from\('student_grades'\)\.select\('\*'\);/,
  `const range = getAcademicYearRange();
        let query = supabase.from('student_grades').select('*')
          .gte('created_at', range.start + 'T00:00:00Z')
          .lte('created_at', range.end + 'T23:59:59Z');`
);

// GuruService.getCounselingRecords
code = code.replace(
  /const \{ data, error \} = await supabase\.from\('counseling_records'\)\.select\('\*'\)\.order\('tanggal', \{ ascending: false \}\);/,
  `const range = getAcademicYearRange();
        const { data, error } = await supabase.from('counseling_records').select('*')
          .gte('tanggal', range.start)
          .lte('tanggal', range.end)
          .order('tanggal', { ascending: false });`
);

fs.writeFileSync('src/services/supabase.ts', code);
