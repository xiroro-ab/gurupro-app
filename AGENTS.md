# Context: Fix PDF schedule preview, auto-local date, admin vs local academic year, data isolation between academic years
# Checkpoint (2026-07-12): Implemented Global Academic Year (Tahun Ajaran) via Admin Pengaturan Sistem, removed local override from profile, added Data Clean feature.
# Added academic year dynamic filter for all transactional data fetches. Added "Download Arsip Data" functionality for global and personal scopes.
# Checkpoint 2 (2026-07-12): Refined "Download Arsip Data" into two types: JSON backup for database restore (Admin only), and elegant PDF reports with tables using jspdf-autotable for readability (Guru Profile & Admin Filter).

# Checkpoint 3 (2026-07-16): About Creator Modal implementation.
# If requested to build "Modal Tentang Pembuat" (About Creator Modal) in future:
# 1. Use pure React/Tailwind.
# 2. Rope Physics: Use canvas with Verlet Integration. Rope segments with `x, y, oldx, oldy` and constraint solving. Card attached to the end of the rope. Drag interactions via `pointermove`/`pointerup`.
# 3. External Images: Always use `crossOrigin="anonymous"` and `referrerPolicy="no-referrer"` on `<img />` tags for external domains (e.g. raw.githubusercontent.com) to prevent rendering or CORS errors.
# 4. Fit: Use `object-cover object-top` for portrait profile images inside the ID card to prevent stretching and maintain proportions without background bars.
# 5. Intersection Observer: For scrolling active sections, use `rootMargin: '-40% 0px -40% 0px'` so the active menu syncs properly with visibility.

# Checkpoint 4 (2026-07-20): Multiple Absensi Kegiatan
# - Fixed a bug where deleting/updating one extra-curricular "kegiatan" attendance (e.g., Koku) wiped out another one (e.g., Pramuka) on the same date.
# - Added `kegName/kegiatanName` parameter inside `deleteAttendances`, `saveAttendances`, and offline queue synchronization in `supabase.ts`.
# - Standardized `[KEG] Nama - Keterangan` parsing and matching using `.toLowerCase()` to prevent case-sensitive mismatches.
# - Updated `AbsensiHarian.tsx` data fetching dependency arrays and state-sync to factor in the currently active `namaKegiatan`.

# Checkpoint 5 (2026-07-20): Fix PDF viewer for schedules
# - Fixed a bug in `JadwalPelajaran.tsx` where clicking "Perbesar" on the second global schedule still showed the first one.
# - Replaced boolean `showPdfModal` with `activePdfUrl` state to explicitly track which PDF URL to render in the modal.

# Checkpoint 6 (2026-07-20): Fix PDF viewer Invalid page request
# - Fixed a bug in `JadwalPelajaran.tsx` where rendering multiple PDFs shared a single `numPages` state. 
# - Created `numPages2` and `numPagesModal` with distinct `onLoadSuccess` handlers to isolate PDF rendering states.

# Checkpoint 7 (2026-07-20): Fix print preview layout and toast overlays
# - Hid the global notification toast container during print (`print:hidden`) to prevent "Info Cetak" toast from obscuring printed tables.
# - Updated print preview modals across features (Jurnal, Absensi, Progres) to act as the primary print view when opened, removing `no-print` and styling them with print media queries.
# - Ensured fallback `print-area` containers are hidden when the preview modal is active to prevent duplicate prints.

# Checkpoint 8 (2026-07-20): Fix print document margin and cutoff
# - Adjusted print styles on paper document containers (`JurnalMengajar`, `LaporanAbsensi`, `ProgresGuru`).
# - Switched `flex flex-col justify-between` to `print:block` to prevent browsers from stretching the document to a strict 297mm height, which pushed signatures into unprintable margins and caused them to be cut off.
# - Added `print:p-6` (or `print:p-8`) to maintain a safe inner margin during printing instead of `print:p-0`.

# Checkpoint 8 (2026-07-20): Fix print document margin and cutoff
# - Adjusted print styles on paper document containers (`JurnalMengajar`, `LaporanAbsensi`, `ProgresGuru`).
# - Switched `flex flex-col justify-between` to `print:block` to prevent browsers from stretching the document to a strict 297mm height, which pushed signatures into unprintable margins and caused them to be cut off.
# - Added `print:p-6` (or `print:p-8`) to maintain a safe inner margin during printing instead of `print:p-0`.

# Checkpoint 9 (2026-07-20): Fix print cut-off issues caused by Checkpoint 7/8
# - Reverted the Print Preview Modal being the print target back to `no-print`. The `fixed` overlay clipped multi-page scrolling during print.
# - Restored the original `.print-area` approach for all printable documents which uses absolute positioning allowing normal document flow and multi-page printing.
# - Reverted the `print:block print:w-full` modifiers from paper emulation sheets. The browser automatically scales A4 `w-[210mm] min-h-[297mm]` containers correctly.
# - Reverted the `@page { size: A4 }` css rule to let the browser handle margins natively.
# - Added `tableLayout: 'fixed', wordBreak: 'break-word'` to all `w-full` print tables to prevent wide text columns from causing horizontal overflow in Admin pages.
# - Added `print:break-inside-avoid` to signature containers to prevent them from splitting horizontally across pages at the bottom.

# Checkpoint 10 (2026-07-20): Fix print layout issues for Jurnal, Agenda, and Absensi (Cutoffs and Signatures)
# - Fixed table width cutoffs on right/left edges by setting table column widths as percentages (e.g. `width: '5%'`) and ensuring `tableLayout: 'fixed', wordBreak: 'break-word'` is present.
# - Fixed signature blocks being cut off at the bottom of pages by replacing `print:break-inside-avoid` with inline styles: `style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}`.
# - Fixed print margins and general layout flow in `src/index.css` by forcing `html, body, #root, #gurupro-workspace, main` to `height: auto !important; min-height: auto !important; overflow: visible !important; display: block !important;` during `@media print`, which allows browsers to natively print multiple pages smoothly without iframe/container height restrictions.
# - Removed the "Absensi Siswa" column dynamically from the `agenda_harian` view in the admin print `ProgresGuru.tsx`, as Agenda Harian no longer tracks attendance.
