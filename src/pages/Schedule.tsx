import { useState, useEffect, useCallback } from "react";
import { SIMULATORS } from "@/lib/types";
import { getDisplayName, loadAllData } from "@/lib/store";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { TrainerStatusPanel } from "@/components/TrainerStatusPanel";
import { MrtLocationsPanel } from "@/components/MrtLocationsPanel";
import { SimScheduleTable } from "@/components/SimScheduleTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, VisibilitySettings, MrtLocationSettings } from "@/lib/types";
import matssPatc from "@/assets/matss-patch.png";
import usmcFlag from "@/assets/usmc-flag.png";
import { FlyingAircraft } from "@/components/FlyingAircraft";

// Groups of simulator IDs to rotate through every 10 seconds
const SIM_GROUPS = [
  ['ah1z-ftd', 'ah1z-ffs'],
  ['uh1y-ftd', 'uh1y-ffs'],
  ['mcat', 'mv22-13', 'mv22-14'],
  ['ah1z-cpt', 'uh1y-cpt', 'mv22-ptt'],
  ['mrt-1', 'mrt-2', 'mrt-3', 'mrt-4'],
];

function group_has_visible(group: string[], visibility: VisibilitySettings): boolean {
  return group.some(id => visibility.simulators[id] !== false);
}

export default function SchedulePage() {
  const [simData, setSimData] = useState<Record<string, SimSlot[]>>({});
  const [statuses, setStatuses] = useState<TrainerStatus[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomEntry[]>([]);
  const [neccEntries, setNeccEntries] = useState<NECCEntry[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const pendletonTime = currentTime.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit', hour12: false });
  const pendletonDate = currentTime.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
  const pendletonHour = Number(currentTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', hour12: false }));
  const pendletonMinute = Number(currentTime.toLocaleString('en-US', { timeZone: 'America/Los_Angeles', minute: 'numeric' }));
  const [activeGroup, setActiveGroup] = useState(0);
  const [visibility, setVisibility] = useState<VisibilitySettings>({ simulators: {}, classrooms: true, necc: true, linkedEvents: true, trainerStatus: true, animation: true });
  const [extraSims, setExtraSims] = useState<{ id: string; name: string }[]>([]);
  const [mrtLocations, setMrtLocations] = useState<MrtLocationSettings>({});

  const sortByDate = <T extends { dateTime: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => {
      const da = new Date(a.dateTime).getTime();
      const db = new Date(b.dateTime).getTime();
      if (isNaN(da) && isNaN(db)) return 0;
      if (isNaN(da)) return 1;
      if (isNaN(db)) return -1;
      return da - db;
    });

  const loadData = useCallback(async () => {
    const data = await loadAllData();
    setSimData(data.simData);
    setStatuses(data.statuses);
    setClassrooms(data.classrooms);
    setNeccEntries(sortByDate(data.neccEntries));
    setLinkedEvents(sortByDate(data.linkedEvents));
    setVisibility(data.visibility);
    setExtraSims(data.extraSims);
    setMrtLocations(data.mrtLocations);
    setCurrentTime(new Date());
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Build list of non-empty group indices
  const nonEmptyGroups = SIM_GROUPS.map((group, i) => i).filter(i =>
    group_has_visible(SIM_GROUPS[i], visibility)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setActiveGroup(prev => {
        if (nonEmptyGroups.length === 0) return prev;
        const currentIdx = nonEmptyGroups.indexOf(prev);
        const nextIdx = (currentIdx + 1) % nonEmptyGroups.length;
        return nonEmptyGroups[nextIdx];
      });
    }, 10000);
    return () => clearInterval(interval);
  }, [nonEmptyGroups]);

  const visibleSimIds = SIM_GROUPS[activeGroup].filter(id => visibility.simulators[id] !== false);
  const visibleSims = SIMULATORS.filter(s => visibleSimIds.includes(s.id));
  // Custom trainers always visible (not in rotation groups) when toggled on
  const visibleExtraSims = extraSims.filter(s => visibility.simulators[s.id] !== false);

  // Groups 0 and 1 (AH-1Z FTD/FFS, UH-1Y FTD/FFS) go fullscreen
  const isFullscreen = activeGroup === 0 || activeGroup === 1;

  return (
    <div className="flex h-screen overflow-hidden relative">
      <div
        className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
        style={{ backgroundColor: '#8B0000', backgroundImage: `url(${usmcFlag})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      {visibility.animation !== false && <FlyingAircraft />}

      {/* Fullscreen overlay for FTD/FFS groups */}
      {isFullscreen && (
        <div className="absolute inset-0 z-30 flex flex-col bg-background/95 backdrop-blur-sm p-4">
          <div className="text-center mb-2 flex-shrink-0">
            <div className="flex items-center justify-center gap-2">
              <img src={matssPatc} alt="MATSS Official Patch" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-base font-bold leading-tight">Marine Aviation Training System Site</h1>
                <p className="text-xs text-muted-foreground">MCAS Pendleton</p>
              <p className="text-sm font-bold font-mono">{pendletonTime}</p>
            </div>
            <img src={matssPatc} alt="MATSS Official Patch" className="h-16 w-16 object-contain" />
          </div>
          <p className="text-xs">Current Simulator Schedule</p>
          <div className="flex justify-center gap-1.5 mt-1">
            {SIM_GROUPS.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors border ${i === activeGroup ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_6px_rgba(250,204,21,0.7)]' : 'bg-zinc-500 border-zinc-400'}`}
              />
            ))}
          </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-2 flex-1 min-h-0">
            {visibleSims.map(sim => (
              <SimScheduleTable key={sim.id} simId={sim.id} name={getDisplayName(sim.id)} entries={simData[sim.id] || []} mrtLocation={mrtLocations[sim.id]} currentHour={pendletonHour} currentMinute={pendletonMinute} larger />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1 text-center flex-shrink-0">*NB = No brief</p>
        </div>
      )}

      <DirectorySidebar className="w-52 min-h-screen flex-shrink-0 rounded-none" />
      
      <div className="flex-1 p-1 flex flex-col overflow-hidden">
        <div className="text-center mb-1 flex-shrink-0">
          <div className="flex items-center justify-center gap-2">
            <img src={matssPatc} alt="MATSS Official Patch" className="h-16 w-16 object-contain" />
            <div>
              <h1 className="text-base font-bold leading-tight">Marine Aviation Training System Site</h1>
              <p className="text-xs text-muted-foreground">MCAS Pendleton</p>
              <p className="text-sm font-bold font-mono">{pendletonTime}</p>
            </div>
            <img src={matssPatc} alt="MATSS Official Patch" className="h-16 w-16 object-contain" />
          </div>
          <p className="text-xs">Current Simulator Schedule</p>
        </div>

        <div className="flex justify-center gap-1.5 mb-1 flex-shrink-0">
          {SIM_GROUPS.map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors border ${i === activeGroup ? 'bg-yellow-400 border-yellow-300 shadow-[0_0_6px_rgba(250,204,21,0.7)]' : 'bg-zinc-500 border-zinc-400'}`}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-0.5 flex-1 min-h-0">
          {visibleSims.map(sim => {
            const larger = ['ah1z-ftd', 'ah1z-ffs', 'uh1y-ftd', 'uh1y-ffs', 'mrt-1', 'mrt-2', 'mrt-3', 'mrt-4'].includes(sim.id);
            return <SimScheduleTable key={sim.id} simId={sim.id} name={getDisplayName(sim.id)} entries={simData[sim.id] || []} mrtLocation={mrtLocations[sim.id]} currentHour={pendletonHour} currentMinute={pendletonMinute} larger={larger} />;
          })}
          {visibleExtraSims.map(sim => (
            <SimScheduleTable key={sim.id} simId={sim.id} name={getDisplayName(sim.id) || sim.name} entries={simData[sim.id] || []} mrtLocation={mrtLocations[sim.id]} currentHour={pendletonHour} currentMinute={pendletonMinute} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1 text-center flex-shrink-0">*NB = No brief</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 flex-shrink-0">
          {visibility.classrooms && classrooms.length > 0 && (
            <div className="bg-sidebar-background text-sidebar-foreground p-3 rounded-lg">
              <h3 className="text-sm font-bold underline mb-1 text-center">Classes</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Unit</TableHead>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Date/Time</TableHead>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classrooms.slice(0, 5).map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{c.className}</TableCell>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{c.dateTime}</TableCell>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{c.location}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {visibility.necc && neccEntries.length > 0 && (
            <div className="bg-sidebar-background text-sidebar-foreground p-3 rounded-lg">
              <h3 className="text-sm font-bold underline mb-1 text-center">NECC Reservations</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Unit</TableHead>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Date/Time</TableHead>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {neccEntries.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{e.unit}</TableCell>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{e.dateTime}</TableCell>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{e.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {visibility.linkedEvents && linkedEvents.length > 0 && (
            <div className="bg-sidebar-background text-sidebar-foreground p-3 rounded-lg">
              <h3 className="text-sm font-bold underline mb-1 text-center">Linked Events</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Date/Time</TableHead>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">Unit</TableHead>
                    <TableHead className="text-xs py-1 text-sidebar-foreground">System</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedEvents.slice(0, 5).map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{e.dateTime}</TableCell>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{e.unit}</TableCell>
                      <TableCell className="text-xs py-1 text-sidebar-foreground">{e.system}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <div className="w-48 flex-shrink-0 p-1.5 space-y-1.5">
        <MrtLocationsPanel locations={mrtLocations} compact />
        {visibility.trainerStatus && <TrainerStatusPanel statuses={statuses} simData={simData} />}
      </div>

      <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground/60 font-mono">v1.0.1</div>
    </div>
  );
}
