const fs = require('fs');
let code = fs.readFileSync('src/components/JadwalPelajaran.tsx', 'utf-8');

code = code.replace(/React\.useEffect\(\(\) => \{[\s\S]*?\}, \[globalSchedule\]\);/,
`React.useEffect(() => {
    if (globalSchedule?.type === 'application/pdf' && globalSchedule.url) {
      if (globalSchedule.url.startsWith('data:application/pdf;base64,')) {
        try {
          const base64Data = globalSchedule.url.split(',')[1];
          const byteString = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([intArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          
          return () => URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Failed to create blob from base64 PDF", e);
          setPdfBlobUrl(globalSchedule.url);
        }
      } else {
        setPdfBlobUrl(globalSchedule.url);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [globalSchedule]);

  React.useEffect(() => {
    if (globalSchedule2?.type === 'application/pdf' && globalSchedule2.url) {
      if (globalSchedule2.url.startsWith('data:application/pdf;base64,')) {
        try {
          const base64Data = globalSchedule2.url.split(',')[1];
          const byteString = atob(base64Data);
          const arrayBuffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(arrayBuffer);
          for (let i = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([intArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl2(url);
          
          return () => URL.revokeObjectURL(url);
        } catch (e) {
          console.error("Failed to create blob from base64 PDF 2", e);
          setPdfBlobUrl2(globalSchedule2.url);
        }
      } else {
        setPdfBlobUrl2(globalSchedule2.url);
      }
    } else {
      setPdfBlobUrl2(null);
    }
  }, [globalSchedule2]);`);

fs.writeFileSync('src/components/JadwalPelajaran.tsx', code);
