import { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, SIMULATORS, TRAINER_STATUS_IDS, MRT_SIM_IDS, VisibilitySettings } from './types';
import { apiSet, apiDelete, apiGet } from './api';

const STORAGE_PREFIX = 'matss_';

function createEntryId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Async version that reads from server first
async function getItemAsync<T>(key: string, defaultValue: T): Promise<T> {
  return apiGet<T>(key, defaultValue);
}

function setItem<T>(key: string, value: T): void {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  // Also persist to server (fire-and-forget)
  apiSet(key, value);
}

function removeItem(key: string): void {
  localStorage.removeItem(STORAGE_PREFIX + key);
  apiDelete(key);
}

function getDefaultCsiValue(simId: string): string {
  return MRT_SIM_IDS.includes(simId) ? 'UH' : 'CSI';
}

// Simulator schedules
export function getSimEntries(simId: string): SimSlot[] {
  const sim = SIMULATORS.find(s => s.id === simId);
  const entries = getItem<SimSlot[]>(`sim_${simId}`, []);
  const defaultCsi = getDefaultCsiValue(simId);
  if (entries.length === 0 && sim) {
    return sim.timeSlots.map(time => ({ time, unit: '', crew: '', csi: defaultCsi }));
  }
  if (entries.length === 0) {
    return [{ time: '', unit: '', crew: '', csi: defaultCsi }];
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

// Trainer Status — always merge saved data with current TRAINER_STATUS_IDS
// so newly added trainers (like MRTs) appear even if old data was saved without them
function mergeTrainerStatuses(saved: TrainerStatus[]): TrainerStatus[] {
  const map = new Map(saved.map(s => [s.id, s]));
  return TRAINER_STATUS_IDS.map(t => map.get(t.id) ?? { id: t.id, name: t.name, isUp: true, note: '' });
}

export function getTrainerStatuses(): TrainerStatus[] {
  const saved = getItem<TrainerStatus[]>('trainer_statuses', []);
  return mergeTrainerStatuses(saved);
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
  classrooms.push({ ...entry, id: createEntryId() });
  setItem('classrooms', classrooms);
}

export function updateClassroom(id: string, entry: Partial<ClassroomEntry>): void {
  const classrooms = getClassrooms().map(c => c.id === id ? { ...c, ...entry } : c);
  setItem('classrooms', classrooms);
}

export function deleteClassroom(id: string): void {
  setItem('classrooms', getClassrooms().filter(c => c.id !== id));
}

export function saveClassroomsOrder(classrooms: ClassroomEntry[]): void {
  setItem('classrooms', classrooms);
}

// NECC Reservations
export function getNECCEntries(): NECCEntry[] {
  return getItem<NECCEntry[]>('necc', []);
}

export function saveNECCEntry(entry: Omit<NECCEntry, 'id'>): void {
  const entries = getNECCEntries();
  entries.push({ ...entry, id: createEntryId() });
  setItem('necc', entries);
}

export function updateNECCEntry(id: string, entry: Partial<NECCEntry>): void {
  setItem('necc', getNECCEntries().map(e => e.id === id ? { ...e, ...entry } : e));
}

export function deleteNECCEntry(id: string): void {
  setItem('necc', getNECCEntries().filter(e => e.id !== id));
}

export function saveNECCOrder(entries: NECCEntry[]): void {
  setItem('necc', entries);
}

// Linked Events
export function getLinkedEvents(): LinkedEvent[] {
  return getItem<LinkedEvent[]>('linked', []);
}

export function saveLinkedEvent(entry: Omit<LinkedEvent, 'id'>): void {
  const events = getLinkedEvents();
  events.push({ ...entry, id: createEntryId() });
  setItem('linked', events);
}

export function updateLinkedEvent(id: string, entry: Partial<LinkedEvent>): void {
  setItem('linked', getLinkedEvents().map(e => e.id === id ? { ...e, ...entry } : e));
}

export function deleteLinkedEvent(id: string): void {
  setItem('linked', getLinkedEvents().filter(e => e.id !== id));
}

export function saveLinkedEventsOrder(events: LinkedEvent[]): void {
  setItem('linked', events);
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

// MRT Locations
const DEFAULT_MRT_LOCATIONS: Record<string, string> = Object.fromEntries(
  MRT_SIM_IDS.map(id => [id, ''])
);

export function getMrtLocations(): Record<string, string> {
  const saved = getItem<Record<string, string>>('mrt_locations', DEFAULT_MRT_LOCATIONS);
  return MRT_SIM_IDS.reduce<Record<string, string>>((acc, id) => {
    acc[id] = saved[id] ?? '';
    return acc;
  }, { ...DEFAULT_MRT_LOCATIONS });
}

export function saveMrtLocations(locations: Record<string, string>): void {
  const normalized = MRT_SIM_IDS.reduce<Record<string, string>>((acc, id) => {
    acc[id] = locations[id] ?? '';
    return acc;
  }, {});
  setItem('mrt_locations', normalized);
}

// Extra (custom) simulators/trainers
export interface ExtraSim {
  id: string;
  name: string;
}

export function getExtraSims(): ExtraSim[] {
  return getItem<ExtraSim[]>('extra_sims', []);
}

export function saveExtraSims(sims: ExtraSim[]): void {
  setItem('extra_sims', sims);
}

export function removeSimData(simId: string): void {
  removeItem(`sim_${simId}`);
  removeItem(`sim_${simId}_saved`);
}

// Name Overrides
export function getNameOverrides(): Record<string, string> {
  return getItem<Record<string, string>>('name_overrides', {});
}

export function saveNameOverride(id: string, name: string): void {
  const overrides = getNameOverrides();
  overrides[id] = name;
  setItem('name_overrides', overrides);
}

export function getDisplayName(id: string): string {
  const overrides = getNameOverrides();
  if (overrides[id]) return overrides[id];
  const sim = SIMULATORS.find(s => s.id === id);
  if (sim) return sim.name;
  const trainer = TRAINER_STATUS_IDS.find(t => t.id === id);
  if (trainer) return trainer.name;
  const extra = getExtraSims().find(s => s.id === id);
  if (extra) return extra.name;
  return id;
}

// ---- Async loaders (server-first) for Guard/Schedule pages ----
export async function loadAllData(): Promise<{
  simData: Record<string, SimSlot[]>;
  statuses: TrainerStatus[];
  classrooms: ClassroomEntry[];
  neccEntries: NECCEntry[];
  linkedEvents: LinkedEvent[];
  visibility: VisibilitySettings;
  extraSims: ExtraSim[];
  mrtLocations: Record<string, string>;
}> {
  const extraSims = await getItemAsync<ExtraSim[]>('extra_sims', []);
  const allSimIds = [...SIMULATORS.map(s => s.id), ...extraSims.map(s => s.id)];

  const [rawStatuses, classrooms, neccEntries, linkedEvents, visibility, mrtLocations, ...simResults] = await Promise.all([
    getItemAsync<TrainerStatus[]>('trainer_statuses', []),
    getItemAsync<ClassroomEntry[]>('classrooms', []),
    getItemAsync<NECCEntry[]>('necc', []),
    getItemAsync<LinkedEvent[]>('linked', []),
    getItemAsync<VisibilitySettings>('visibility', {
      simulators: Object.fromEntries(SIMULATORS.map(s => [s.id, true])),
      classrooms: true, necc: true, linkedEvents: true, trainerStatus: true,
    }),
    getItemAsync<Record<string, string>>('mrt_locations', DEFAULT_MRT_LOCATIONS),
    ...allSimIds.map(id => getItemAsync<SimSlot[]>(`sim_${id}`, [])),
  ]);

  const simData: Record<string, SimSlot[]> = {};
  allSimIds.forEach((id, i) => {
    const entries = simResults[i] as SimSlot[];
    if (entries.length === 0) {
      const sim = SIMULATORS.find(s => s.id === id);
      simData[id] = sim ? sim.timeSlots.map(time => ({ time, unit: '', crew: '', csi: getDefaultCsiValue(id) })) : [];
    } else {
      simData[id] = entries;
    }
  });

  const statuses = mergeTrainerStatuses(rawStatuses as TrainerStatus[]);
  return { simData, statuses, classrooms, neccEntries, linkedEvents, visibility, extraSims, mrtLocations };
}
