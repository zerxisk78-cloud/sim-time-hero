import * as XLSX from 'xlsx';
import { SIMULATORS, MRT_SIM_IDS } from './types';
import type { SimSlot } from './types';
import { getSimEntries, getDisplayName } from './store';

// ---- Description → simId mapping ----
const DESC_TO_SIM: Record<string, string> = {
  'AH-1Z CPT': 'ah1z-cpt',
  'AH-1Z FFS': 'ah1z-ffs',
  'AH-1Z FTD': 'ah1z-ftd',
  'UH-1Y CPT': 'uh1y-cpt',
  'UH-1Y FFS': 'uh1y-ffs',
  'UH-1Y FTD': 'uh1y-ftd',
  'MV-22B CFTD 2F200-13': 'mv22-13',
  'MV-22B CFTD 2F200-14': 'mv22-14',
  'MV-22 PTT': 'mv22-ptt',
  'MCAT': 'mcat',
  'MRT 2F300-1Z': 'mrt-1',
  'MRT 2F300-2Y': 'mrt-2',
  'MRT 2F300-3Z': 'mrt-3',
  'MRT 2F300-4Y': 'mrt-4',
};

function descriptionToSimId(desc: string): string | null {
  const d = desc.trim();
  // Try specific long matches first (MV-22 13 vs 14)
  for (const [key, simId] of Object.entries(DESC_TO_SIM)) {
    if (d.includes(key)) return simId;
  }
  return null;
}

function extractLastName(crewStr: string): string {
  // "HENDRON, PAUL J 1stLt" → "HENDRON"
  const comma = crewStr.indexOf(',');
  if (comma > 0) return crewStr.substring(0, comma).trim();
  return crewStr.trim();
}

function getDefaultCsi(simId: string): string {
  if (MRT_SIM_IDS.includes(simId)) {
    // Determine AH vs UH from sim id
    return simId === 'mrt-1' || simId === 'mrt-3' ? 'AH' : 'UH';
  }
  return 'CSI';
}

// ---- IMPORT ----
export interface ImportResult {
  simData: Record<string, SimSlot[]>;
  skipped: string[];
  date: string;
}

export function parseMSharpExcel(data: ArrayBuffer): ImportResult {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Find the header row (contains "ETD" and "Description")
  let headerIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i];
    if (row && row.some(c => String(c).trim() === 'ETD') && row.some(c => String(c).trim() === 'Description')) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) throw new Error('Could not find header row with ETD/Description columns');

  const headers = rows[headerIdx].map(c => String(c ?? '').trim());
  const colDesc = headers.indexOf('Description');
  const colStatus = headers.indexOf('Status');
  const colETD = headers.indexOf('ETD');
  const colUnit = headers.indexOf('Unit');
  const colAirCrew = headers.indexOf('Air Crew');

  // Try to extract date from the title row
  let date = '';
  for (let i = 0; i < headerIdx; i++) {
    const row = rows[i];
    if (row) {
      for (const cell of row) {
        const s = String(cell ?? '');
        const m = s.match(/(\w+day),?\s+(\d{1,2}\s+\w+\s+\d{4})/);
        if (m) { date = m[2]; break; }
        // Also try "Generated on MM/DD/YYYY"
        const m2 = s.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (m2) { date = m2[1]; break; }
      }
      if (date) break;
    }
  }

  const simData: Record<string, { time: string; unit: string; crew: string; status: string }[]> = {};
  const skipped: string[] = [];
  let currentSimId: string | null = null;
  let currentDesc = '';

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const desc = row[colDesc] != null ? String(row[colDesc]).trim() : '';
    const etd = row[colETD] != null ? String(row[colETD]).trim() : '';
    const status = row[colStatus] != null ? String(row[colStatus]).trim() : '';
    const unit = row[colUnit] != null ? String(row[colUnit]).trim() : '';
    const airCrew = row[colAirCrew] != null ? String(row[colAirCrew]).trim() : '';

    // New sim block?
    if (desc && desc !== currentDesc) {
      currentDesc = desc;
      const mapped = descriptionToSimId(desc);
      if (mapped) {
        currentSimId = mapped;
        if (!simData[currentSimId]) simData[currentSimId] = [];
      } else {
        currentSimId = null;
        if (!skipped.includes(desc)) skipped.push(desc);
      }
    }

    if (!currentSimId) continue;

    // Only process rows that have an ETD (time slot rows)
    if (!etd) continue;

    // Collect crew names for this time slot
    const crewNames: string[] = [];
    if (airCrew) crewNames.push(extractLastName(airCrew));

    // Look ahead for continuation rows (no ETD = extra crew for same slot)
    let j = i + 1;
    while (j < rows.length) {
      const nextRow = rows[j];
      if (!nextRow) { j++; continue; }
      const nextDesc = nextRow[colDesc] != null ? String(nextRow[colDesc]).trim() : '';
      const nextEtd = nextRow[colETD] != null ? String(nextRow[colETD]).trim() : '';
      if (nextDesc || nextEtd) break; // new block or new time slot
      const nextCrew = nextRow[colAirCrew] != null ? String(nextRow[colAirCrew]).trim() : '';
      if (nextCrew) {
        const name = extractLastName(nextCrew);
        if (name && !crewNames.includes(name)) crewNames.push(name);
      }
      j++;
    }

    // Determine unit/crew based on M-SHARP status
    const statusLower = status.toLowerCase();
    let cleanUnit = unit;
    let cleanCrew = crewNames.join('/');

    if (statusLower === 'available') {
      // Available = OPEN
      cleanUnit = 'OPEN';
      cleanCrew = 'OPEN';
    } else if (statusLower === 'maintenance - device' || statusLower === 'unavailable') {
      // Maintenance/Unavailable = CLOSED
      cleanUnit = 'CLOSED';
      cleanCrew = 'CLOSED';
    } else {
      // Scheduled/Reserved - clean up unit
      if (unit.toUpperCase().includes('MATSS')) {
        cleanUnit = '';
      }
      // Remove trailing parenthetical like "(-)"
      cleanUnit = cleanUnit.replace(/\s*\(.*?\)\s*$/, '').trim();
      // Leave crew/unit blank if not populated (for manual entry)
    }

    simData[currentSimId].push({
      time: etd,
      unit: cleanUnit,
      crew: cleanCrew,
      status,
    });
  }

  // Convert to SimSlot format
  const result: Record<string, SimSlot[]> = {};
  for (const [simId, slots] of Object.entries(simData)) {
    const csi = getDefaultCsi(simId);
    result[simId] = slots.map(s => ({
      time: s.time,
      unit: s.unit,
      crew: s.crew,
      csi,
    }));
  }

  return { simData: result, skipped, date };
}

// ---- EXPORT ----
// simId → clean description name for export
const SIM_TO_DESC: Record<string, string> = {
  'ah1z-cpt': 'AH-1Z CPT 2C83-1',
  'ah1z-ffs': 'AH-1Z FFS 2F215-1',
  'ah1z-ftd': 'AH-1Z FTD 2F197-1',
  'uh1y-cpt': 'UH-1Y CPT 2C84-1',
  'uh1y-ffs': 'UH-1Y FFS 2F206-1',
  'uh1y-ftd': 'UH-1Y FTD 2F196B-2',
  'mv22-13': 'MV-22B CFTD 2F200-13',
  'mv22-14': 'MV-22B CFTD 2F200-14',
  'mv22-ptt': 'MV-22 PTT',
  'mcat': 'UH-1Y MCAT 2H166B-1',
  'mrt-1': 'AH-1Z MRT 2F300-1Z',
  'mrt-2': 'UH-1Y MRT 2F300-2Y',
  'mrt-3': 'AH-1Z MRT 2F300-3Z',
  'mrt-4': 'UH-1Y MRT 2F300-4Y',
};

export function exportSimScheduleExcel(): Blob {
  const wb = XLSX.utils.book_new();
  const allRows: (string | null)[][] = [];
  let hasAnyLinkedSims = false;

  const simIds = SIMULATORS.map(s => s.id);

  for (const simId of simIds) {
    const entries = getSimEntries(simId);
    const desc = SIM_TO_DESC[simId] || getDisplayName(simId);

    // Header row for this sim block
    allRows.push(['Description', 'Status', 'ETD', 'Unit', 'Linked Simulators', 'T&R Codes', 'CI', 'CREW', 'Notes']);

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      const unitUpper = (e.unit || '').toUpperCase();
      const crewUpper = (e.crew || '').toUpperCase();
      const isClosed = unitUpper === 'CLOSED' || crewUpper === 'CLOSED';
      const isOpen = (!e.unit && !e.crew) || unitUpper === 'OPEN' || crewUpper === 'OPEN';

      let status: string;
      let unitVal: string;
      let crewVal: string;
      let ci: string | null = null;

      if (isClosed) {
        status = 'UnOPEN,';
        unitVal = 'CLOSED,';
        crewVal = 'CLOSED,';
      } else if (isOpen) {
        status = 'OPEN,';
        unitVal = 'OPEN,';
        crewVal = 'OPEN,';
      } else {
        status = 'Scheduled';
        unitVal = e.unit ? e.unit + ',' : '';
        crewVal = e.crew ? e.crew + ',' : '';
        ci = e.csi || null;
      }

      allRows.push([
        i === 0 ? desc : null,
        status,
        e.time,
        unitVal,
        null, // Linked Simulators
        null, // T&R Codes
        ci,
        crewVal,
        null, // Notes
      ]);
    }
  }

  // Check if Linked Simulators column is all empty
  const linkedSimsCol = 4;
  hasAnyLinkedSims = allRows.some(row =>
    row[0] !== 'Description' && row[linkedSimsCol] != null && String(row[linkedSimsCol]).trim() !== ''
  );

  // Remove Linked Simulators column if all empty
  const finalRows = hasAnyLinkedSims
    ? allRows
    : allRows.map(row => [...row.slice(0, linkedSimsCol), ...row.slice(linkedSimsCol + 1)]);

  const ws = XLSX.utils.aoa_to_sheet(finalRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 24 }, // Description
    { wch: 12 }, // Status
    { wch: 6 },  // ETD
    { wch: 16 }, // Unit
    ...(hasAnyLinkedSims ? [{ wch: 16 }] : []),
    { wch: 10 }, // T&R Codes
    { wch: 6 },  // CI
    { wch: 16 }, // CREW
    { wch: 16 }, // Notes
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
