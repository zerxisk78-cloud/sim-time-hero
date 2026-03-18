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
  { id: 'mrt-1', name: 'MRT-1', shortName: 'MRT-1', timeSlots: ['0800', '1000', '1200', '1400'] },
  { id: 'mrt-2', name: 'MRT-2', shortName: 'MRT-2', timeSlots: ['0800', '1000', '1200', '1400'] },
  { id: 'mrt-3', name: 'MRT-3', shortName: 'MRT-3', timeSlots: ['0800', '1000', '1200', '1400'] },
  { id: 'mrt-4', name: 'MRT-4', shortName: 'MRT-4', timeSlots: ['0800', '1000', '1200', '1400'] },
];

export const TRAINER_GROUPS = [
  {
    id: 'mcat-ah1z',
    name: 'MCAT / AH-1Z Trainers',
    trainers: [
      { id: 'mcat', name: 'MCAT' },
      { id: 'ah1z-ffs', name: 'AH-1Z FFS' },
      { id: 'ah1z-ftd', name: 'AH-1Z FTD' },
      { id: 'ah1z-cpt', name: 'AH-1Z CPT' },
    ],
  },
  {
    id: 'uh1y',
    name: 'UH-1Y Trainers',
    trainers: [
      { id: 'uh1y-ffs', name: 'UH-1Y FFS' },
      { id: 'uh1y-ftd', name: 'UH-1Y FTD' },
      { id: 'uh1y-cpt', name: 'UH-1Y CPT' },
    ],
  },
  {
    id: 'mv22',
    name: 'MV-22 Trainers',
    trainers: [
      { id: 'mv22-13', name: 'MV-22 13' },
      { id: 'mv22-14', name: 'MV-22 14' },
      { id: 'mv22-ptt', name: 'MV-22 PTT' },
    ],
  },
  {
    id: 'mrt',
    name: 'MRT Trainers',
    trainers: [
      { id: 'mrt-1', name: 'MRT-1' },
      { id: 'mrt-2', name: 'MRT-2' },
      { id: 'mrt-3', name: 'MRT-3' },
      { id: 'mrt-4', name: 'MRT-4' },
    ],
  },
];

export const TRAINER_STATUS_IDS = TRAINER_GROUPS.flatMap(g => g.trainers);

export const MRT_SIM_IDS = ['mrt-1', 'mrt-2', 'mrt-3', 'mrt-4'];

export interface VisibilitySettings {
  simulators: Record<string, boolean>;
  classrooms: boolean;
  necc: boolean;
  linkedEvents: boolean;
  trainerStatus: boolean;
}

export type MrtLocationSettings = Record<string, string>;
