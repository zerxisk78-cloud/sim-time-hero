export interface SimSlot {
  time: string;
  unit: string;
  crew: string;
  csi: string;
}

export interface SimSchedule {
  id: string;
  name: string;
  shortName: string;
  timeSlots: string[];
  entries: SimSlot[];
  lastSaved?: string;
}

export interface TrainerStatus {
  id: string;
  name: string;
  isUp: boolean;
  note: string;
}

export interface ClassroomEntry {
  id: string;
  className: string;
  dateTime: string;
  location: string;
}

export interface NECCEntry {
  id: string;
  unit: string;
  dateTime: string;
  notes: string;
}

export interface LinkedEvent {
  id: string;
  dateTime: string;
  unit: string;
  system: string;
}

export const SIMULATORS: { id: string; name: string; shortName: string; timeSlots: string[] }[] = [
  { id: 'mcat', name: 'MCAT', shortName: 'MCAT', timeSlots: ['0830', '1000', '1130', '1300', '1430'] },
  { id: 'ah1z-ffs', name: 'AH-1Z FFS', shortName: 'Z FFS', timeSlots: ['0600', '0700', '0830', '1000', '1130', '1300', '1430', '1600', '1730', '1900', '2030'] },
  { id: 'ah1z-ftd', name: 'AH-1Z FTD', shortName: 'Z FTD', timeSlots: ['0600', '0700', '0830', '1000', '1130', '1300', '1430', '1600', '1730', '1900', '2030'] },
  { id: 'ah1z-cpt', name: 'AH-1Z CPT', shortName: 'Z CPT', timeSlots: ['0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500'] },
  { id: 'uh1y-ffs', name: 'UH-1Y FFS', shortName: 'Y FFS', timeSlots: ['0700', '0830', '1000', '1130', '1300', '1430', '1600', '1730', '1900', '2030'] },
  { id: 'uh1y-ftd', name: 'UH-1Y FTD', shortName: 'Y FTD', timeSlots: ['0600', '0700', '0830', '1000', '1130', '1300', '1430', '1600', '1730', '1900', '2030'] },
  { id: 'uh1y-cpt', name: 'UH-1Y CPT', shortName: 'Y CPT', timeSlots: ['0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500'] },
  { id: 'mv22-13', name: 'MV-22 13', shortName: 'MV22-13', timeSlots: ['0800', '1000', '1200', '1400'] },
  { id: 'mv22-14', name: 'MV-22 14', shortName: 'MV22-14', timeSlots: ['0800', '1000', '1200', '1400'] },
  { id: 'mv22-ptt', name: 'MV-22 PTT', shortName: 'MV22 PTT', timeSlots: ['0800', '0900', '1000', '1100', '1200', '1300', '1400', '1500'] },
];

export const TRAINER_STATUS_IDS = [
  { id: 'mcat', name: 'MCAT' },
  { id: 'ah1z-ffs', name: 'AH-1Z FFS' },
  { id: 'ah1z-ftd', name: 'AH-1Z FTD' },
  { id: 'ah1z-cpt', name: 'AH-1Z CPT' },
  { id: 'uh1y-ffs', name: 'UH-1Y FFS' },
  { id: 'uh1y-ftd', name: 'UH-1Y FTD' },
  { id: 'uh1y-cpt', name: 'UH-1Y CPT' },
  { id: 'mv22-13', name: 'MV-22 13' },
  { id: 'mv22-14', name: 'MV-22 14' },
  { id: 'mv22-ptt', name: 'MV-22 PTT' },
];
