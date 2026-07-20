const fs = require('fs');
let code = fs.readFileSync('src/components/JadwalPelajaran.tsx', 'utf-8');

code = code.replace(/const \{ data: globalSchedule \} = useQuery\(\{[\s\S]*?\}\);/,
`const { data: globalSchedule } = useQuery({
    queryKey: ['globalSchedule'],
    queryFn: () => GuruService.getGlobalSchedule()
  });

  const { data: globalSchedule2 } = useQuery({
    queryKey: ['globalSchedule2'],
    queryFn: () => GuruService.getGlobalSchedule2()
  });`);

code = code.replace(/const saveGlobalScheduleMutation = useMutation\(\{[\s\S]*?\}\);/,
`const saveGlobalScheduleMutation = useMutation({
    mutationFn: async (schedule: any) => {
      await GuruService.setGlobalSchedule(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule'] });
      toast.success('Gambar jadwal global berhasil disimpan');
    }
  });

  const saveGlobalSchedule2Mutation = useMutation({
    mutationFn: async (schedule: any) => {
      await GuruService.setGlobalSchedule2(schedule);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule2'] });
      toast.success('Gambar jadwal global 2 berhasil disimpan');
    }
  });`);

code = code.replace(/const deleteGlobalScheduleMutation = useMutation\(\{[\s\S]*?\}\);/,
`const deleteGlobalScheduleMutation = useMutation({
    mutationFn: async () => {
      await GuruService.setGlobalSchedule(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule'] });
      setConfirmDeleteGlobal(false);
      setPdfBlobUrl(null);
      toast.success('Jadwal global berhasil dihapus');
    }
  });

  const deleteGlobalSchedule2Mutation = useMutation({
    mutationFn: async () => {
      await GuruService.setGlobalSchedule2(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalSchedule2'] });
      setConfirmDeleteGlobal2(false);
      setPdfBlobUrl2(null);
      toast.success('Jadwal global 2 berhasil dihapus');
    }
  });`);

fs.writeFileSync('src/components/JadwalPelajaran.tsx', code);
