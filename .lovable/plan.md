## Question: Did the Z-FTD's extended hours (0530 / 2200) block the M-SHARP upload?

**Short answer: No.** The extended hours are not, and were not, blocking the import.

### How the importer actually handles time slots

Looking at `src/lib/excelImportExport.ts` and `src/pages/Admin.tsx`:

1. `parseMSharpExcel` reads **every** row inside a recognized simulator block and pushes it into `simData[simId]` — it never checks the row's time against `SIMULATORS[...].timeSlots`. Whatever times are in the Excel file get saved.
2. `saveSimEntries(simId, entries)` in Admin writes the parsed rows straight to the store.
3. `SIMULATORS[...].timeSlots` is only used for two things:
   - Seeding an empty sim with blank rows when nothing has ever been saved (`store.ts` lines 48 and 326).
   - Building the "missing times" list in the post-import status report (`Admin.tsx` line 650).

So an unusual time like `0530` or `2200` in the file cannot cause the row to be dropped — it just gets saved as-is.

### What was actually happening before today's fix

Before we updated `types.ts`, `ah1z-ftd`'s declared slots were `0600, 0700, … 2030` (no `0530`, no `2200`).

- The 0530 and 2200 rows **were being imported**, but
- The status report compared imported times to the declared list and reported `0600` as "missing" and treated the sim as "has issues" — which read like an upload failure.
- The Admin editor also seeds empty rows from that declared list on a fresh load, so a brand-new install would show a `0600` row that never got filled.

After today's change (`ah1z-ftd` → `0530, 0700, … 2030, 2200`, plus `ah1z-ffs` / `uh1y-ftd` starting at `0530`), the declared list matches the M-SHARP output, so the import report will show Z-FTD as fully populated with no false warnings.

### Recommended verification (no new code needed)

1. Re-run the M-SHARP import on `071326.xlsx` from the Admin page.
2. Open the status report and confirm Z-FTD shows: `Total slots: 12`, `Missing times: (none)`, `Empty times: (none)`.
3. Open the Z-FTD editor and confirm all 12 rows (0530 through 2200) are populated.

If any Z-FTD row is still missing after this, the cause would be something else (e.g. an unrecognized `Description` string in that specific export, or a row-level parse error) — and both of those are already surfaced in the per-row error list added earlier. In that case, capture the status-report screenshot so I can trace the specific row.

### Files reviewed (no edits proposed)

- `src/lib/excelImportExport.ts` — parser
- `src/pages/Admin.tsx` — import handler and status report
- `src/lib/types.ts` — declared time slots (already fixed)
- `src/lib/store.ts` — seeding of empty rows
