import { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, SIMULATORS, TRAINER_STATUS_IDS, VisibilitySettings } from './types';

const STORAGE_PREFIX = 'matss_';

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
}

// Simulator schedules
export function getSimEntries(simId: string): SimSlot[] {
  const sim = SIMULATORS.find(s => s.id === simId);
  if (!sim) return [];
  const entries = getItem<SimSlot[]>(`sim_${simId}`, []);
  if (entries.length === 0) {
    return sim.timeSlots.map(time => ({ time, unit: '', crew: '', csi: '' }));
  }
  return entries;
}

export function saveSimEntries(simId: string, entries: SimSlot[]): string {
  setItem(`sim_${simId}`, entries);
  const timestamp = new Date().toLocaleString();
  setItem(`sim_${simId}_saved`, timestamp);
  return timestamp;
}

export function getSimLastSaved(simId: string): string {
  return getItem<string>(`sim_${simId}_saved`, '');
}

// Trainer Status
export function getTrainerStatuses(): TrainerStatus[] {
  return getItem<TrainerStatus[]>('trainer_statuses', 
    TRAINER_STATUS_IDS.map(t => ({ id: t.id, name: t.name, isUp: true, note: '' }))
  );
}

export function saveTrainerStatuses(statuses: TrainerStatus[]): void {
  setItem('trainer_statuses', statuses);
}

// Classrooms
export function getClassrooms(): ClassroomEntry[] {
  return getItem<ClassroomEntry[]>('classrooms', []);
}

export function saveClassroom(entry: Omit<ClassroomEntry, 'id'>): void {
  const classrooms = getClassrooms();
  classrooms.push({ ...entry, id: crypto.randomUUID() });
  setItem('classrooms', classrooms);
}

export function updateClassroom(id: string, entry: Partial<ClassroomEntry>): void {
  const classrooms = getClassrooms().map(c => c.id === id ? { ...c, ...entry } : c);
  setItem('classrooms', classrooms);
}

export function deleteClassroom(id: string): void {
  setItem('classrooms', getClassrooms().filter(c => c.id !== id));
}

// NECC Reservations
export function getNECCEntries(): NECCEntry[] {
  return getItem<NECCEntry[]>('necc', []);
}

export function saveNECCEntry(entry: Omit<NECCEntry, 'id'>): void {
  const entries = getNECCEntries();
  entries.push({ ...entry, id: crypto.randomUUID() });
  setItem('necc', entries);
}

export function updateNECCEntry(id: string, entry: Partial<NECCEntry>): void {
  setItem('necc', getNECCEntries().map(e => e.id === id ? { ...e, ...entry } : e));
}

export function deleteNECCEntry(id: string): void {
  setItem('necc', getNECCEntries().filter(e => e.id !== id));
}

// Linked Events
export function getLinkedEvents(): LinkedEvent[] {
  return getItem<LinkedEvent[]>('linked', []);
}

export function saveLinkedEvent(entry: Omit<LinkedEvent, 'id'>): void {
  const events = getLinkedEvents();
  events.push({ ...entry, id: crypto.randomUUID() });
  setItem('linked', events);
}

export function updateLinkedEvent(id: string, entry: Partial<LinkedEvent>): void {
  setItem('linked', getLinkedEvents().map(e => e.id === id ? { ...e, ...entry } : e));
}

export function deleteLinkedEvent(id: string): void {
  setItem('linked', getLinkedEvents().filter(e => e.id !== id));
}

// Directory
export interface DirectoryContact {
  title: string;
  name?: string;
  callsign?: string;
  office?: string;
  room?: string;
}

export interface DirectorySection {
  heading: string;
  contacts: DirectoryContact[];
}

export interface DirectoryData {
  info: { line1: string; line2: string; phone: string };
  sections: DirectorySection[];
}

const DEFAULT_DIRECTORY: DirectoryData = {
  info: { line1: "MCAS Camp Pendleton Bldg 2394", line2: "Camp Pendleton", phone: "760-725-0778" },
  sections: [
    {
      heading: "1st Floor",
      contacts: [
        { title: "OIC - (AH-1Z FLSE)", name: 'Maj B. Hough', callsign: '"Monk"', office: "(760) 725-8048", room: "108" },
        { title: "MV-22 FLSE", name: 'Maj B. Holloway', callsign: '"Cherry Boi"', office: "(760) 763-5107", room: "110" },
        { title: "UH-1Y FLSE", name: 'Maj A. Snell', callsign: '"Tipper"', office: "(760) 763-5107", room: "110" },
        { title: "Crew Chief Training", name: "SSgt. W. Kyllo", office: "(760) 763-5107", room: "110" },
        { title: "COMS COR", name: "Rob McChesney", office: "(760) 725-8047", room: "107" },
      ],
    },
    {
      heading: "2nd Floor",
      contacts: [
        { title: "MATSS Operations", office: "(760) 725-8278", room: "225" },
        { title: "NiteLab Admin", office: "(760) 763-8339", room: "224" },
        { title: "NiteLab", room: "215" },
        { title: "Electronic Classroom", room: "227" },
        { title: "CSI Office", room: "206" },
        { title: "Student Check-In", room: "220" },
      ],
    },
    {
      heading: "Building 23194",
      contacts: [
        { title: "H1 CICC Office", name: "Jared Tape", office: "(760) 725-0036" },
      ],
    },
  ],
};

export function getDirectory(): DirectoryData {
  return getItem<DirectoryData>('directory', DEFAULT_DIRECTORY);
}

export function saveDirectory(data: DirectoryData): void {
  setItem('directory', data);
}

// Visibility Settings
const DEFAULT_VISIBILITY: VisibilitySettings = {
  simulators: Object.fromEntries(SIMULATORS.map(s => [s.id, true])),
  classrooms: true,
  necc: true,
  linkedEvents: true,
  trainerStatus: true,
};

export function getVisibility(): VisibilitySettings {
  return getItem<VisibilitySettings>('visibility', DEFAULT_VISIBILITY);
}

export function saveVisibility(settings: VisibilitySettings): void {
  setItem('visibility', settings);
}
