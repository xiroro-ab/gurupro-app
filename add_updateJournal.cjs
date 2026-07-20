const fs = require('fs');
let code = fs.readFileSync('src/services/supabase.ts', 'utf8');

const newMethod = `
  async updateJournal(id: string, updates: Partial<TeachingJournal>): Promise<TeachingJournal> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase
          .from('teaching_journals')
          .update(updates)
          .eq('id', id)
          .select();
        if (error) throw error;
        if (data && data[0]) return parseLegacyJournal(data[0]);
      } catch (err) {
        console.error('Supabase error updating journal:', err);
        // Fallback to local
      }
    }
    const current = LocalDB.getJournals();
    const index = current.findIndex(j => j.id === id);
    if (index !== -1) {
      current[index] = { ...current[index], ...updates };
      LocalDB.setJournals(current);
      return current[index];
    }
    throw new Error('Journal not found');
  },
`;

code = code.replace(
  /async deleteJournal\(id: string\): Promise<void> \{/,
  newMethod + "\n  async deleteJournal(id: string): Promise<void> {"
);
fs.writeFileSync('src/services/supabase.ts', code);
