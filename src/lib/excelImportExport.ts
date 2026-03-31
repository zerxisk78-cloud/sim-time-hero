import * as XLSX from 'xlsx-js-style';
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
    return simId === 'mrt-1' || simId === 'mrt-3' ? 'AH' : 'UH';
  }
  return 'CSI';
}

// Sims that have CI fields (only FTDs)
const CI_SIM_IDS = ['ah1z-ftd', 'uh1y-ftd'];

// Time → CSI slot number mapping
const TIME_TO_CSI_SLOT: Record<string, number> = {
  '0530': 0, '05:30': 0,
  '0700': 1, '07:00': 1,
  '0830': 2, '08:30': 2,
  '1000': 3, '10:00': 3,
  '1130': 4, '11:30': 4,
  '1300': 5, '13:00': 5,
  '1430': 6, '14:30': 6,
  '1600': 7, '16:00': 7,
  '1730': 8, '17:30': 8,
  '1900': 9, '19:00': 9,
  '2030': 10, '20:30': 10,
  '2200': 11, '22:00': 11,
};

// Which CSI slots each FTD actually gets contracted instructor support
const FTD_ALLOWED_SLOTS: Record<string, number[]> = {
  'ah1z-ftd': [1, 3, 4, 5, 7, 9, 11],
  'uh1y-ftd': [4, 6, 8],
};

// Detect T&R codes: 4 digits optionally followed by a letter (e.g. 1111X, 2301A, 5400)
function extractTRCode(text: string): string | null {
  const match = text.match(/\b(\d{4}[A-Za-z]?)\b/);
  return match ? match[1] : null;
}

// ---- IMPORT ----
export interface ImportResult {
  simData: Record<string, SimSlot[]>;
  skipped: string[];
  date: string;
  titleRows: string[];
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

  const simData: Record<string, { time: string; unit: string; crew: string; status: string; tr: string; notes: string }[]> = {};
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
    let cleanCrew = '';
    let notes = '';
    let tr = '';

    if (statusLower === 'available') {
      cleanUnit = 'OPEN';
      cleanCrew = 'OPEN';
    } else if (statusLower === 'maintenance - device' || statusLower === 'unavailable' || statusLower === 'unopen') {
      cleanUnit = 'CLOSED';
      cleanCrew = 'CLOSED';
    } else {
      // Scheduled/Reserved - clean up unit
      if (unit.toUpperCase().includes('MATSS')) {
        cleanUnit = '';
      }
      cleanUnit = cleanUnit.replace(/\s*\(.*?\)\s*$/, '').trim();

      // Max 2 pilots in crew, rest go to notes
      if (crewNames.length <= 2) {
        cleanCrew = crewNames.join('/');
      } else {
        cleanCrew = crewNames.slice(0, 2).join('/');
        notes = crewNames.slice(2).join('/');
      }

      // Check all crew strings for T&R codes
      for (const rawCrew of [airCrew, ...crewNames]) {
        const trCode = extractTRCode(rawCrew);
        if (trCode) { tr = trCode; break; }
      }
    }

    simData[currentSimId].push({
      time: etd,
      unit: cleanUnit,
      crew: cleanCrew,
      status,
      tr,
      notes,
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
      tr: s.tr,
      notes: s.notes,
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

export function exportSimScheduleExcel(scheduleDate?: string, includedSimIds?: string[]): Blob {
  const wb = XLSX.utils.book_new();
  const allRows: (string | null)[][] = [];
  const headerRowIndices: number[] = []; // track which rows are sim-block headers for grey fill
  let hasAnyLinkedSims = false;

  // Title rows
  allRows.push(['Simulator Schedule']);
  allRows.push([scheduleDate || new Date().toLocaleDateString()]);
  allRows.push([]); // blank spacer

  const simIds = SIMULATORS.map(s => s.id).filter(id => !includedSimIds || includedSimIds.includes(id));

  for (const simId of simIds) {
    const entries = getSimEntries(simId);
    const desc = SIM_TO_DESC[simId] || getDisplayName(simId);

    // Track this header row index
    headerRowIndices.push(allRows.length);
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
      let notesVal: string = e.notes || '';
      let ci: string | null = null;
      let trVal: string | null = e.tr || null;

      if (isClosed) {
        status = 'UnOPEN,';
        unitVal = 'CLOSED,';
        crewVal = 'CLOSED,';
        notesVal = '';
      } else if (isOpen) {
        status = 'OPEN,';
        unitVal = 'OPEN,';
        crewVal = 'OPEN,';
        notesVal = '';
      } else {
        status = 'Scheduled';
        unitVal = e.unit ? e.unit + ',' : '';

        const pilots = (e.crew || '').split('/').filter(Boolean);
        crewVal = pilots.length > 0 ? pilots[0] + ',' : '';
        const extraPilots = pilots.slice(1).join('/');
        if (extraPilots) {
          notesVal = notesVal ? extraPilots + '; ' + notesVal : extraPilots;
        }

        // For FTDs, map time to CSI slot and only show if it's an allowed slot
        if (CI_SIM_IDS.includes(simId)) {
          const timeKey = (e.time || '').replace(/[^0-9:]/g, '').trim();
          const slotNum = TIME_TO_CSI_SLOT[timeKey];
          const allowed = FTD_ALLOWED_SLOTS[simId] || [];
          ci = slotNum !== undefined && allowed.includes(slotNum) ? String(slotNum) : null;
        }
      }

      allRows.push([
        i === 0 ? desc : null,
        status,
        e.time,
        unitVal,
        null,
        trVal,
        ci,
        crewVal,
        notesVal || null,
      ]);
    }
  }

  // Check if Linked Simulators column is all empty
  const linkedSimsCol = 4;
  hasAnyLinkedSims = allRows.some(row =>
    row[0] !== 'Description' && row[0] !== 'Simulator Schedule' && row[linkedSimsCol] != null && String(row[linkedSimsCol]).trim() !== ''
  );

  // Remove Linked Simulators column if all empty
  const finalRows = hasAnyLinkedSims
    ? allRows
    : allRows.map(row => [...row.slice(0, linkedSimsCol), ...row.slice(linkedSimsCol + 1)]);

  const ws = XLSX.utils.aoa_to_sheet(finalRows);
  const colCount = hasAnyLinkedSims ? 9 : 8;

  // Style title row bold + larger
  // Merge and center title row
  ws['!merges'] = ws['!merges'] || [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } });
  ws['!merges'].push({ s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } });

  const titleCell = ws['A1'];
  if (titleCell) titleCell.s = { font: { bold: true, sz: 16, color: { rgb: '1F4E79' } }, alignment: { horizontal: 'center' } };
  const dateCell = ws['A2'];
  if (dateCell) dateCell.s = { font: { bold: true, sz: 12, color: { rgb: '1F4E79' } }, alignment: { horizontal: 'center' } };

  // Blue Table Style Medium 9 colors
  const headerStyle = {
    fill: { fgColor: { rgb: '4472C4' }, patternType: 'solid' },
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
    border: {
      top: { style: 'thin', color: { rgb: '4472C4' } },
      bottom: { style: 'thin', color: { rgb: '4472C4' } },
      left: { style: 'thin', color: { rgb: '4472C4' } },
      right: { style: 'thin', color: { rgb: '4472C4' } },
    },
  };
  const bandLight = {
    fill: { fgColor: { rgb: 'D6E4F0' }, patternType: 'solid' },
    border: {
      top: { style: 'thin', color: { rgb: '95B3D7' } },
      bottom: { style: 'thin', color: { rgb: '95B3D7' } },
      left: { style: 'thin', color: { rgb: '95B3D7' } },
      right: { style: 'thin', color: { rgb: '95B3D7' } },
    },
  };
  const bandWhite = {
    fill: { fgColor: { rgb: 'FFFFFF' }, patternType: 'solid' },
    border: {
      top: { style: 'thin', color: { rgb: '95B3D7' } },
      bottom: { style: 'thin', color: { rgb: '95B3D7' } },
      left: { style: 'thin', color: { rgb: '95B3D7' } },
      right: { style: 'thin', color: { rgb: '95B3D7' } },
    },
  };

  // Apply styles per sim block
  for (let h = 0; h < headerRowIndices.length; h++) {
    const hdrRow = headerRowIndices[h];
    const nextHdrRow = h + 1 < headerRowIndices.length ? headerRowIndices[h + 1] : finalRows.length;

    // Header row: blue bg, white bold text
    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r: hdrRow, c });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = headerStyle;
    }

    // Data rows: alternating banded rows
    let bandIdx = 0;
    for (let r = hdrRow + 1; r < nextHdrRow; r++) {
      for (let c = 0; c < colCount; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        ws[addr].s = bandIdx % 2 === 0 ? bandWhite : bandLight;
      }
      bandIdx++;
    }
  }

  // Set column widths
  ws['!cols'] = [
    { wch: 24 },
    { wch: 12 },
    { wch: 6 },
    { wch: 16 },
    ...(hasAnyLinkedSims ? [{ wch: 16 }] : []),
    { wch: 10 },
    { wch: 6 },
    { wch: 16 },
    { wch: 16 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
