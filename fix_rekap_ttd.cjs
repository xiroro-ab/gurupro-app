const fs = require('fs');
let code = fs.readFileSync('src/components/PenilaianSiswa.tsx', 'utf-8');

const oldTtd = /<div className="mt-12 flex justify-end" style=\{\{ pageBreakInside: 'avoid', breakInside: 'avoid' \}\}>\s*<div className="text-center">\s*<p className="text-sm">Palembang, \{new Date\(\)\.toLocaleDateString\('id-ID', \{ day: 'numeric', month: 'long', year: 'numeric' \}\)\}<\/p>\s*<p className="text-sm font-bold mt-1">Kepala Sekolah<\/p>\s*<div className="h-20"><\/div>\s*<p className="text-sm font-bold underline">\{kepalaSekolahNama\}<\/p>\s*<p className="text-sm font-mono">NIP\. \{kepalaSekolahNip\}<\/p>\s*<\/div>\s*<\/div>/;

const ttdSection = `          <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between', padding: '0 40px', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Mengetahui,</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Kepala SMP Negeri 58 Palembang</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{kepalaSekolahNama}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {kepalaSekolahNip}</p>
            </div>
            <div className="text-center">
              <p style={{ margin: 0, fontSize: '10pt' }}>Palembang, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold' }}>Wali Kelas {myClass.nama_kelas}</p>
              <div style={{ height: '70px' }}></div>
              <p style={{ margin: 0, fontSize: '10pt', fontWeight: 'bold', textDecoration: 'underline' }}>{profile.nama_lengkap}</p>
              <p style={{ margin: 0, fontSize: '9pt', color: '#555' }}>NIP. {profile.nip || '-'}</p>
            </div>
          </div>`;

code = code.replace(oldTtd, ttdSection);
fs.writeFileSync('src/components/PenilaianSiswa.tsx', code);
