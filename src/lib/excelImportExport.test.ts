import { describe, expect, it, beforeEach } from "vitest";
import * as XLSX from "xlsx-js-style";
import { parseMSharpExcel } from "./excelImportExport";

function makeFinishedWorkbook(): ArrayBuffer {
  const header = ['Description', 'Status', 'ETD', 'Unit', 'Linked Simulators', 'T&R Codes', 'CI', 'CREW', 'Notes'];
  const rows: (string | null)[][] = [
    header,
    ['AH-1Z FTD 2F197-1', 'Scheduled', '0530', 'HMLAT-303,', '', '', '', 'KUNKLE 1F1', ''],
    ['', 'Scheduled', '0700', 'HMLAT-303,', '', '', '1', 'ANDREWS 1E7', ''],
    ['', 'Scheduled', '0830', 'HMLA-369,', '', '', '', 'CURRIER 1A6', ''],
    ['', 'Scheduled', '1000', 'HMLAT-303,', '', '', '3', 'WILKINS 1A1', ''],
    ['', 'Reserved', '1130', 'HMLAT-303,', '', '', '', 'LESAUX,', ''],
    ['', 'Scheduled', '1300', 'HMLAT-303,', '', '', '', 'KOBUSSEN 1E1', ''],
    ['', 'Scheduled', '1430', 'VMM-364,', '', '', '', 'DEVINE 1A7', ''],
    ['', 'Scheduled', '1600', 'HMLAT-303,', '', '', '', 'MOUDY 1E1', ''],
    ['', 'Scheduled', '1730', 'HMLA-169,', '', '', '', 'KOENIG 1B7', ''],
    ['', 'Scheduled', '1900', 'HMLAT-303,', '', '', '', 'HENDRON 1E9', ''],
    ['', 'Reserved', '2030', 'HMLAT-303,', '', '', '', 'LESAUX,', ''],
    ['', 'Scheduled', '2200', 'HMLAT-303,', '', '', '', 'LESAUX 1E9', ''],
    header,
    ['UH-1Y FTD 2F196B-2', 'UnOPEN,', '0530', 'CLOSED,', '', '', '', 'CLOSED,', ''],
    ['', 'Scheduled', '0700', 'HMLAT-303,', '', '', '1', 'BOWMAN 1E1', ''],
    ['', 'Scheduled', '0830', 'HMLA-369,', '', '', '', 'DOLAN 1A6', ''],
    ['', 'Scheduled', '1000', 'HMLAT-303,', '', '', '3', 'BRZOZOWSKI 2L3', ''],
    ['', 'Scheduled', '1130', 'VMM-364,', '', '', '', 'ALANO-GRAY 2L3', ''],
    ['', 'Scheduled', '1300', 'VMM-364,', '', '', '', 'ALANO-GRAY 2L4', ''],
    ['', 'Reserved', '1430', 'HMLAT-303,', '', '', '', 'REILLY,', ''],
    ['', 'Scheduled', '1600', 'HMLA-169,', '', '', '', 'KELLEY 1A1', ''],
    ['', 'Reserved', '1730', 'HMLA-369,', '', '', '', 'GRAHAM,', ''],
    ['', 'OPEN,', '1900', 'OPEN,', '', '', '', 'OPEN,', ''],
    ['', 'OPEN,', '2030', 'OPEN,', '', '', '', 'OPEN,', ''],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'SimulatorSchedule');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

describe('parseMSharpExcel finished reports', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('imports Y-FTD and Z-FTD rows around repeated headers', () => {
    const result = parseMSharpExcel(makeFinishedWorkbook());

    expect(result.skipped).toEqual([]);
    expect(result.rowErrors).toEqual([]);
    expect(result.simData['ah1z-ftd']).toHaveLength(12);
    expect(result.simData['ah1z-ftd'].map(e => e.time)).toEqual([
      '0530', '0700', '0830', '1000', '1130', '1300', '1430', '1600', '1730', '1900', '2030', '2200',
    ]);
    expect(result.simData['uh1y-ftd']).toHaveLength(11);
    expect(result.simData['uh1y-ftd'].map(e => e.time)).toEqual([
      '0530', '0700', '0830', '1000', '1130', '1300', '1430', '1600', '1730', '1900', '2030',
    ]);
    expect(result.simData['uh1y-ftd'][0]).toMatchObject({ unit: 'CLOSED', crew: 'CLOSED' });
    expect(result.simData['uh1y-ftd'][9]).toMatchObject({ unit: 'OPEN', crew: 'OPEN' });
  });
});