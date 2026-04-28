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
  return 'DO';
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

// Auto-detect format and parse accordingly
export function parseMSharpExcel(data: ArrayBuffer): ImportResult {
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  // Detect format: look for "Air Crew" (raw M-SHARP) vs "CREW" (finished report)
  let headerIdx = -1;
  let isFinished = false;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map(c => String(c ?? '').trim());
    if (cells.includes('ETD') && cells.includes('Description')) {
      headerIdx = i;
      isFinished = cells.includes('CREW') && !cells.includes('Air Crew');
      break;
    }
  }

  if (headerIdx < 0) throw new Error('Could not find header row with ETD/Description columns');

  // Extract title rows and date from pre-header content
  const titleRows: string[] = [];
  let date = '';
  for (let i = 0; i < headerIdx; i++) {
    const row = rows[i];
    if (row) {
      const text = row.map(c => String(c ?? '').trim()).filter(Boolean).join(' ');
      if (text) titleRows.push(text);
      for (const cell of row) {
        const s = String(cell ?? '');
        const m = s.match(/(\w+day),?\s+(\d{1,2}\s+\w+\s+\d{4})/);
        if (m) { date = m[2]; break; }
        const m2 = s.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (m2) { date = m2[1]; break; }
      }
    }
  }

  if (isFinished) {
    return parseFinishedReport(rows, headerIdx, date, titleRows);
  } else {
    return parseRawMSharp(rows, headerIdx, date, titleRows);
  }
}

function parseFinishedReport(
  rows: (string | number | null)[][],
  headerIdx: number,
  date: string,
  titleRows: string[],
): ImportResult {
  const headers = rows[headerIdx].map(c => String(c ?? '').trim());
  const colDesc = headers.indexOf('Description');
  const colStatus = headers.indexOf('Status');
  const colETD = headers.indexOf('ETD');
  const colUnit = headers.indexOf('Unit');
  const colTR = headers.indexOf('T&R Codes');
  const colCI = headers.indexOf('CI');
  const colCrew = headers.indexOf('CREW');
  const colNotes = headers.indexOf('Notes');

  const simData: Record<string, SimSlot[]> = {};
  const skipped: string[] = [];
  let currentSimId: string | null = null;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    // Check if this is a new header row (repeated headers between sim blocks)
    const firstCell = String(row[0] ?? '').trim();
    if (firstCell === 'Description') continue; // skip repeated header rows

    const desc = colDesc >= 0 && row[colDesc] != null ? String(row[colDesc]).trim() : '';
    const etd = colETD >= 0 && row[colETD] != null ? String(row[colETD]).trim() : '';
    const status = colStatus >= 0 && row[colStatus] != null ? String(row[colStatus]).trim() : '';
    const unitRaw = colUnit >= 0 && row[colUnit] != null ? String(row[colUnit]).trim() : '';
    const crewRaw = colCrew >= 0 && row[colCrew] != null ? String(row[colCrew]).trim() : '';
    const trRaw = colTR >= 0 && row[colTR] != null ? String(row[colTR]).trim() : '';
    const ciRaw = colCI >= 0 && row[colCI] != null ? String(row[colCI]).trim() : '';
    const notesRaw = colNotes >= 0 && row[colNotes] != null ? String(row[colNotes]).trim() : '';

    // New sim block if description column has content
    if (desc) {
      const mapped = descriptionToSimId(desc);
      if (mapped) {
        currentSimId = mapped;
        if (!simData[currentSimId]) simData[currentSimId] = [];
      } else {
        currentSimId = null;
        if (!skipped.includes(desc)) skipped.push(desc);
      }
    }

    if (!currentSimId || !etd) continue;

    // Clean trailing commas from exported values
    const cleanVal = (v: string) => v.replace(/,\s*$/, '').trim();
    const unit = cleanVal(unitRaw);
    const crew = cleanVal(crewRaw);

    // Determine unit/crew
    const statusLower = status.toLowerCase().replace(/,\s*$/, '');
    let finalUnit = unit;
    let finalCrew = crew;
    let finalNotes = notesRaw;

    if (statusLower === 'open' || unit.toUpperCase() === 'OPEN') {
      finalUnit = 'OPEN';
      finalCrew = 'OPEN';
      finalNotes = '';
    } else if (statusLower === 'unopen' || statusLower === 'unopen,' || unit.toUpperCase() === 'CLOSED') {
      finalUnit = 'CLOSED';
      finalCrew = 'CLOSED';
      finalNotes = '';
    } else {
      // If notes has extra pilots, combine them back into crew
      if (finalNotes && crew) {
        // Check if notes start with a name (extra pilots from export)
        const notesParts = finalNotes.split(';').map(p => p.trim());
        const extraPilots = notesParts[0];
        // If extra pilots look like names (no spaces typical of notes), merge into crew
        if (extraPilots && !extraPilots.includes(' ')) {
          finalCrew = crew + '/' + extraPilots;
          finalNotes = notesParts.slice(1).join('; ').trim();
        }
      }
    }

    // Determine CSI from CI column or default
    let csi = '';
    if (MRT_SIM_IDS.includes(currentSimId)) {
      csi = currentSimId === 'mrt-1' || currentSimId === 'mrt-3' ? 'AH' : 'UH';
    } else if (ciRaw) {
      csi = 'CSI';
    } else {
      csi = 'DO';
    }

    simData[currentSimId].push({
      time: etd,
      unit: finalUnit,
      crew: finalCrew,
      csi,
      tr: trRaw,
      notes: finalNotes,
    });
  }

  // Preserve existing CSI/DO values from store where possible
  const result: Record<string, SimSlot[]> = {};
  for (const [simId, slots] of Object.entries(simData)) {
    const existing = getSimEntries(simId);
    const existingByTime: Record<string, string> = {};
    for (const e of existing) {
      if (e.time && e.csi) existingByTime[e.time] = e.csi;
    }
    result[simId] = slots.map((s, i) => ({
      ...s,
      csi: existingByTime[s.time] || existing[i]?.csi || s.csi,
    }));
  }

  return { simData: result, skipped, date, titleRows };
}

function parseRawMSharp(
  rows: (string | number | null)[][],
  headerIdx: number,
  date: string,
  titleRows: string[],
): ImportResult {
  const headers = rows[headerIdx].map(c => String(c ?? '').trim());
  const colDesc = headers.indexOf('Description');
  const colStatus = headers.indexOf('Status');
  const colETD = headers.indexOf('ETD');
  const colUnit = headers.indexOf('Unit');
  const colAirCrew = headers.indexOf('Air Crew');
  const colLinked = headers.indexOf('Linked Simulators');
  const colNetwork = headers.indexOf('Network Simulators');
  const colFlightNote = headers.indexOf('Flight Note');
  const colNotesSrc = headers.indexOf('Notes');

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
    const linkedSrc = colLinked >= 0 && row[colLinked] != null ? String(row[colLinked]).trim() : '';
    const networkSrc = colNetwork >= 0 && row[colNetwork] != null ? String(row[colNetwork]).trim() : '';
    const flightNoteSrc = colFlightNote >= 0 && row[colFlightNote] != null ? String(row[colFlightNote]).trim() : '';
    const notesSrc = colNotesSrc >= 0 && row[colNotesSrc] != null ? String(row[colNotesSrc]).trim() : '';

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

      // Merge source-side note/linked-sim fields into notes so export can extract them
      const extraBits: string[] = [];
      if (linkedSrc) extraBits.push(linkedSrc);
      if (networkSrc) extraBits.push(networkSrc);
      if (flightNoteSrc) extraBits.push(flightNoteSrc);
      if (notesSrc) extraBits.push(notesSrc);
      if (extraBits.length) {
        notes = [notes, ...extraBits].filter(Boolean).join(' ; ');
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

  // Convert to SimSlot format, preserving existing CSI/DO values from the store
  const result: Record<string, SimSlot[]> = {};
  for (const [simId, slots] of Object.entries(simData)) {
    const existing = getSimEntries(simId);
    const defaultCsi = getDefaultCsi(simId);
    // Build a lookup by time to preserve CSI/DO from existing store
    const existingByTime: Record<string, string> = {};
    for (const e of existing) {
      if (e.time && e.csi) existingByTime[e.time] = e.csi;
    }
    result[simId] = slots.map((s, i) => ({
      time: s.time,
      unit: s.unit,
      crew: s.crew,
      csi: existingByTime[s.time] || existing[i]?.csi || defaultCsi,
      tr: s.tr,
      notes: s.notes,
    }));
  }

  return { simData: result, skipped, date, titleRows };
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

export function exportSimScheduleExcel(scheduleDate?: string, includedSimIds?: string[], titleRows?: string[]): Blob {
  const wb = XLSX.utils.book_new();
  const allRows: (string | null)[][] = [];
  const headerRowIndices: number[] = [];
  let hasAnyLinkedSims = false;

  // Header: single-line CUI title (no generated date/time, no spacer row)
  const dateLabel = scheduleDate || new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  // Format date for title: "Monday, 27 April 2026"
  let formattedDate = dateLabel;
  const parsed = new Date(dateLabel);
  if (!isNaN(parsed.getTime())) {
    formattedDate = parsed.toLocaleDateString('en-US', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'America/Los_Angeles',
    });
  }
  allRows.push([`CUI MATSS CAMP PENDLETON Simulator Schedule For ${formattedDate}`]);

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
      let linkedVal: string | null = null;

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
        const unitClean = (e.unit || '').replace(/,\s*$/, '').trim();
        unitVal = unitClean ? unitClean + ',' : '';

        // Combine crew + notes for token extraction
        const rawCrew = e.crew || '';
        const rawNotes = e.notes || '';

        // Regex: 4-digit T&R code with optional trailing letter (e.g. 1114X, 2801, 6200X)
        const trRe = /\b(\d{4}[A-Za-z]?)\b/g;
        // Regex: 3-char alphanumeric short code like 1F1, 1A1, 1E9, 2L4 (digit-letter-digit)
        const shortCodeRe = /\b(\d[A-Za-z]\d)\b/g;
        // NOFS / Practice indicator in notes
        const nofsRe = /\b(nofs|prac|practice)\b/i;

        const trCodes: string[] = [];
        const shortCodes: string[] = [];
        const extraPilots: string[] = [];

        // Split crew by '/' to get pilot list
        const crewPilots = rawCrew.split('/').map(p => p.trim()).filter(Boolean);
        const firstPilotRaw = crewPilots[0] || '';
        const restPilots = crewPilots.slice(1);

        // Extract codes from first pilot field
        let firstPilotName = firstPilotRaw;
        firstPilotName = firstPilotName.replace(trRe, (m) => { trCodes.push(m); return ''; });
        firstPilotName = firstPilotName.replace(shortCodeRe, (m) => { shortCodes.push(m); return ''; });
        firstPilotName = firstPilotName.replace(/\s{2,}/g, ' ').replace(/[,\s]+$/, '').trim();

        // Also scan unit for T&R codes (sometimes stored there)
        unitClean.replace(trRe, (m) => { trCodes.push(m); return m; });

        // Process remaining crew pilots and notes for codes + extra names
        const processChunk = (chunk: string) => {
          let s = chunk;
          s = s.replace(trRe, (m) => { trCodes.push(m); return ''; });
          s = s.replace(shortCodeRe, (m) => { shortCodes.push(m); return ''; });
          // Split by common separators and keep name-like tokens (letters/uppercase)
          s.split(/[;,/]+/).forEach(tok => {
            const t = tok.trim();
            if (t && /[A-Za-z]/.test(t) && !nofsRe.test(t)) extraPilots.push(t);
          });
        };
        restPilots.forEach(processChunk);
        if (rawNotes) processChunk(rawNotes);

        // Detect NOFS/Practice case
        const isNofs = nofsRe.test(rawNotes);

        if (isNofs) {
          // Use first pilot name; if absent fall back to unit's reserving pilot name
          let nofsName = firstPilotName;
          if (!nofsName) {
            // Try to pull a name-like token from unit (skip pure-digit/code tokens)
            const unitTokens = unitClean.split(/[;,/]+/).map(t => t.trim()).filter(Boolean);
            for (const tok of unitTokens) {
              const cleaned = tok.replace(trRe, '').replace(shortCodeRe, '').trim();
              if (cleaned && /[A-Za-z]{2,}/.test(cleaned) && !/MATSS/i.test(cleaned)) {
                nofsName = cleaned;
                break;
              }
            }
          }
          // Also check extra pilots as last resort
          if (!nofsName && extraPilots.length) {
            nofsName = extraPilots.shift() || '';
          }
          crewVal = nofsName ? `${nofsName}, NOFS` : 'NOFS';
          notesVal = '';
        } else {
          // Compose CREW: first pilot name + short codes after, comma terminated
          const shortPart = shortCodes.length ? '  ' + shortCodes.join(' ') : '';
          crewVal = firstPilotName ? firstPilotName + ',' + shortPart : shortPart.trim();
          if (crewVal && !crewVal.endsWith(',')) crewVal += '';

          // Compose Notes: extra pilot names, space-separated (no trailing comma)
          notesVal = extraPilots.join(' ');
        }

        // T&R column: prefer extracted code; fall back to stored e.tr
        if (trCodes.length) trVal = Array.from(new Set(trCodes)).join(' ');

        // ---- Linked Simulators detection ----
        // Scan unit, crew, and notes for simulator references and "link/linked X" tokens.
        // Abbreviate per spec and move them to the Linked Simulators column.
        const linkedSims: string[] = [];

        const normalizeSimRef = (raw: string): string | null => {
          const s = raw.toUpperCase().replace(/\s+/g, ' ').trim();
          // MV-22 variants
          if (/MV[-\s]*22B?.*?[-\s]14\b/.test(s) || /\b14\b.*MV[-\s]*22/.test(s)) return 'MV-22B-14';
          if (/MV[-\s]*22B?.*?[-\s]13\b/.test(s) || /\b13\b.*MV[-\s]*22/.test(s)) return 'MV-22B-13';
          // UH/AH FTD/FFS — ignore trailing 5-digit code; allow whitespace around dashes
          if (/AH[-\s]*1Z[-\s]*FTD/.test(s)) return 'AH-1Z-FTD';
          if (/AH[-\s]*1Z[-\s]*FFS/.test(s)) return 'AH-1Z-FFS';
          if (/UH[-\s]*1Y[-\s]*FTD/.test(s)) return 'UH-1Y-FTD';
          if (/UH[-\s]*1Y[-\s]*FFS/.test(s)) return 'UH-1Y-FFS';
          // Shorthand "UH FTD" / "AH FTD" / "UH FFS" / "AH FFS"
          if (/\bAH[-\s]*FTD\b/.test(s)) return 'AH-1Z-FTD';
          if (/\bAH[-\s]*FFS\b/.test(s)) return 'AH-1Z-FFS';
          if (/\bUH[-\s]*FTD\b/.test(s)) return 'UH-1Y-FTD';
          if (/\bUH[-\s]*FFS\b/.test(s)) return 'UH-1Y-FFS';
          // Bare "Y-FTD" / "Z-FFS" etc. (often used after "link")
          if (/\bZ[-\s]*FTD\b/.test(s)) return 'AH-1Z-FTD';
          if (/\bZ[-\s]*FFS\b/.test(s)) return 'AH-1Z-FFS';
          if (/\bY[-\s]*FTD\b/.test(s)) return 'UH-1Y-FTD';
          if (/\bY[-\s]*FFS\b/.test(s)) return 'UH-1Y-FFS';
          // Bare "Y" or "Z" after "link" — too ambiguous; skip
          return null;
        };

        const scanForLinked = (text: string): string => {
          if (!text) return text;
          let remaining = text;
          // Match "link" / "linked" optionally followed by simulator descriptor up to next sentence break
          const linkRe = /\b(linked|link)\b[^,;.\n]*/gi;
          remaining = remaining.replace(linkRe, (match) => {
            const ref = normalizeSimRef(match.replace(/\b(linked|link)\b/gi, ''));
            if (ref && !linkedSims.includes(ref)) linkedSims.push(ref);
            return ref ? '' : match; // keep text if we couldn't extract a ref
          });
          // Also pick up bare full simulator designators (without "link" prefix), allow spaces around dashes
          const bareRe = /\b(?:MV[-\s]*22B?[^,;.\n]*?[-\s](?:13|14)|AH[-\s]*1Z[-\s]*(?:FTD|FFS)(?:[-\s]*[A-Z0-9-]+)?|UH[-\s]*1Y[-\s]*(?:FTD|FFS)(?:[-\s]*[A-Z0-9-]+)?)\b/gi;
          remaining = remaining.replace(bareRe, (match) => {
            const ref = normalizeSimRef(match);
            if (ref && !linkedSims.includes(ref)) linkedSims.push(ref);
            return '';
          });
          // Cleanup leftover punctuation/whitespace
          return remaining
            .replace(/\s{2,}/g, ' ')
            .replace(/\s*\.\s*\.+/g, '.')
            .replace(/\s*[,;/]\s*[,;/]+/g, ', ')
            .replace(/\s+([.,;])/g, '$1')
            .replace(/^[\s,;/.]+|[\s,;/]+$/g, '')
            .trim();
        };

        notesVal = scanForLinked(notesVal);
        crewVal = scanForLinked(crewVal);
        // Also scan unit field — sometimes linked sim references appear there
        const cleanedUnit = scanForLinked(unitVal.replace(/,\s*$/, ''));
        unitVal = cleanedUnit ? cleanedUnit + ',' : '';
        linkedVal = linkedSims.length ? Array.from(new Set(linkedSims)).join(', ') : null;

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
        linkedVal,
        trVal,
        ci,
        crewVal,
        notesVal || null,
      ]);
    }
    // No blank spacer row between sim blocks (next header follows immediately)
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

  // Style and merge title row (single row)
  ws['!merges'] = ws['!merges'] || [];
  const titleCount = 1;
  for (let r = 0; r < titleCount; r++) {
    ws['!merges'].push({ s: { r, c: 0 }, e: { r, c: colCount - 1 } });
    const addr = XLSX.utils.encode_cell({ r, c: 0 });
    const cell = ws[addr];
    if (cell) {
      cell.s = {
        font: { bold: true, sz: 12, color: { rgb: 'FF0000' } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
      };
    }
  }
  // Make title row tall enough to display the long single-line text
  ws['!rows'] = ws['!rows'] || [];
  ws['!rows'][0] = { hpt: 22 };

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

  // CI column index in finalRows (header label is 'CI')
  const ciColIdx = hasAnyLinkedSims ? 6 : 5;

  // Apply styles per sim block
  for (let h = 0; h < headerRowIndices.length; h++) {
    const hdrRow = headerRowIndices[h];
    const nextHdrRow = h + 1 < headerRowIndices.length ? headerRowIndices[h + 1] : finalRows.length;

    // Header row: blue bg, white bold text (CI header centered)
    for (let c = 0; c < colCount; c++) {
      const addr = XLSX.utils.encode_cell({ r: hdrRow, c });
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = c === ciColIdx
        ? { ...headerStyle, alignment: { horizontal: 'center', vertical: 'center' } }
        : headerStyle;
    }

    // Data rows: alternating banded rows
    let bandIdx = 0;
    for (let r = hdrRow + 1; r < nextHdrRow; r++) {
      for (let c = 0; c < colCount; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (!ws[addr]) ws[addr] = { v: '', t: 's' };
        const base = bandIdx % 2 === 0 ? bandWhite : bandLight;
        ws[addr].s = c === ciColIdx
          ? { ...base, alignment: { horizontal: 'center', vertical: 'center', shrinkToFit: true } }
          : base;
      }
      bandIdx++;
    }
  }

  // Set column widths (CI column shrunk to fit single/double digits)
  ws['!cols'] = [
    { wch: 28 },
    { wch: 14 },
    { wch: 8 },
    { wch: 18 },
    ...(hasAnyLinkedSims ? [{ wch: 18 }] : []),
    { wch: 12 },
    { wch: 5 },
    { wch: 18 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
