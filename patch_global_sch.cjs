const fs = require('fs');
let code = fs.readFileSync('src/services/supabase.ts', 'utf-8');

if (!code.includes('GLOBAL_SCHEDULE_2')) {
  code = code.replace(/GLOBAL_SCHEDULE: 'global_schedule',/, `GLOBAL_SCHEDULE: 'global_schedule',\n  GLOBAL_SCHEDULE_2: 'global_schedule_2',`);
  
  code = code.replace(/static getGlobalSchedule\(\): any \{[\s\S]*?\n  \}/, 
  `static getGlobalSchedule(): any {
    try {
      const data = localStorage.getItem(DB_KEYS.GLOBAL_SCHEDULE);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  static getGlobalSchedule2(): any {
    try {
      const data = localStorage.getItem(DB_KEYS.GLOBAL_SCHEDULE_2);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }`);

  code = code.replace(/static setGlobalSchedule\(schedule: any\) \{[\s\S]*?\n  \}/, 
  `static setGlobalSchedule(schedule: any) {
    if (!schedule) {
      localStorage.removeItem(DB_KEYS.GLOBAL_SCHEDULE);
    } else {
      localStorage.setItem(DB_KEYS.GLOBAL_SCHEDULE, JSON.stringify(schedule));
    }
  }

  static setGlobalSchedule2(schedule: any) {
    if (!schedule) {
      localStorage.removeItem(DB_KEYS.GLOBAL_SCHEDULE_2);
    } else {
      localStorage.setItem(DB_KEYS.GLOBAL_SCHEDULE_2, JSON.stringify(schedule));
    }
  }`);
  
  code = code.replace(/async getGlobalSchedule\(\): Promise<any> \{[\s\S]*?\n  \}/, 
  `async getGlobalSchedule(): Promise<any> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('global_schedules').select('*').eq('id', 'global_sch_1').single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      } catch (err) {
        console.error('Supabase error fetching global schedule:', err);
        return LocalDB.getGlobalSchedule();
      }
    }
    return LocalDB.getGlobalSchedule();
  }

  async getGlobalSchedule2(): Promise<any> {
    if (activeStorageMode === 'supabase') {
      try {
        const { data, error } = await supabase.from('global_schedules').select('*').eq('id', 'global_sch_2').single();
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      } catch (err) {
        console.error('Supabase error fetching global schedule 2:', err);
        return LocalDB.getGlobalSchedule2();
      }
    }
    return LocalDB.getGlobalSchedule2();
  }`);
  
  code = code.replace(/async setGlobalSchedule\(schedule: any\): Promise<void> \{[\s\S]*?\n  \}/, 
  `async setGlobalSchedule(schedule: any): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        if (!schedule) {
          const { error } = await supabase.from('global_schedules').delete().eq('id', 'global_sch_1');
          if (error) throw error;
        } else {
          const payload = { id: 'global_sch_1', ...schedule };
          const { error } = await supabase.from('global_schedules').upsert([payload]);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase error saving global schedule:', err);
        OfflineQueue.add('schedule', schedule ? 'save' : 'delete', { id: 'global_sch_1', ...schedule }, 'Update Jadwal Global');
      }
    }
    LocalDB.setGlobalSchedule(schedule);
  }

  async setGlobalSchedule2(schedule: any): Promise<void> {
    if (activeStorageMode === 'supabase') {
      try {
        if (!schedule) {
          const { error } = await supabase.from('global_schedules').delete().eq('id', 'global_sch_2');
          if (error) throw error;
        } else {
          const payload = { id: 'global_sch_2', ...schedule };
          const { error } = await supabase.from('global_schedules').upsert([payload]);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Supabase error saving global schedule 2:', err);
        OfflineQueue.add('schedule', schedule ? 'save' : 'delete', { id: 'global_sch_2', ...schedule }, 'Update Jadwal Global 2');
      }
    }
    LocalDB.setGlobalSchedule2(schedule);
  }`);
  
  fs.writeFileSync('src/services/supabase.ts', code);
}
