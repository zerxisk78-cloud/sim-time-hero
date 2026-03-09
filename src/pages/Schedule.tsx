import { useState, useEffect } from "react";
import { SIMULATORS } from "@/lib/types";
import { getSimEntries, getTrainerStatuses, getClassrooms, getNECCEntries, getLinkedEvents, getVisibility, getDisplayName } from "@/lib/store";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { TrainerStatusPanel } from "@/components/TrainerStatusPanel";
import { SimScheduleTable } from "@/components/SimScheduleTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, VisibilitySettings } from "@/lib/types";
import egaImage from "@/assets/usmc-ega.png";

// Groups of simulator IDs to rotate through every 10 seconds
const SIM_GROUPS = [
  ['ah1z-ftd', 'ah1z-ffs'],
  ['uh1y-ftd', 'uh1y-ffs'],
  ['mcat', 'mv22-13', 'mv22-14'],
  ['ah1z-cpt', 'uh1y-cpt', 'mv22-ptt'],
];

export default function SchedulePage() {
  const [simData, setSimData] = useState<Record<string, SimSlot[]>>({});
  const [statuses, setStatuses] = useState<TrainerStatus[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomEntry[]>([]);
  const [neccEntries, setNeccEntries] = useState<NECCEntry[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeGroup, setActiveGroup] = useState(0);
  const [visibility, setVisibility] = useState<VisibilitySettings>(getVisibility());

  const sortByDate = <T extends { dateTime: string }>(items: T[]): T[] =>
    [...items].sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const loadData = () => {
    const data: Record<string, SimSlot[]> = {};
    SIMULATORS.forEach(sim => { data[sim.id] = getSimEntries(sim.id); });
    setSimData(data);
    setStatuses(getTrainerStatuses());
    setClassrooms(sortByDate(getClassrooms()));
    setNeccEntries(sortByDate(getNECCEntries()));
    setLinkedEvents(sortByDate(getLinkedEvents()));
    setCurrentTime(new Date());
    setVisibility(getVisibility());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveGroup(prev => (prev + 1) % SIM_GROUPS.length);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const visibleSimIds = SIM_GROUPS[activeGroup].filter(id => visibility.simulators[id] !== false);
  const visibleSims = SIMULATORS.filter(s => visibleSimIds.includes(s.id));

  return (
    <div className="flex min-h-screen">
      <DirectorySidebar className="w-48 min-h-screen flex-shrink-0 rounded-none" />
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-6">
            <img src={egaImage} alt="USMC Eagle Globe and Anchor" className="h-24 w-24 object-contain" />
            <div>
              <h1 className="text-2xl font-bold">Marine Aviation Training System Site</h1>
              <p className="text-lg text-muted-foreground">MCAS Pendleton</p>
            </div>
            <img src={egaImage} alt="USMC Eagle Globe and Anchor" className="h-24 w-24 object-contain" />
          </div>
          <p className="text-lg mt-2">Current Simulator Schedule</p>
          <p className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-4">
          {SIM_GROUPS.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${i === activeGroup ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto space-y-2">
          {visibleSims.map(sim => (
            <SimScheduleTable key={sim.id} name={getDisplayName(sim.id)} entries={simData[sim.id] || []} />
          ))}
          <p className="text-xs text-muted-foreground mt-4">*NB = No brief</p>
        </div>
      </div>

      <div className="w-72 flex-shrink-0 p-2 space-y-2 overflow-auto">
        {visibility.trainerStatus && <TrainerStatusPanel statuses={statuses} />}

        {visibility.classrooms && classrooms.length > 0 && (
          <div className="bg-sidebar-background text-sidebar-foreground p-2 rounded-lg">
            <h3 className="text-sm font-bold underline mb-1 text-center">Classes</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-sidebar-foreground">Unit</TableHead>
                  <TableHead className="text-xs text-sidebar-foreground">Date/Time</TableHead>
                  <TableHead className="text-xs text-sidebar-foreground">Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classrooms.map(c => (
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
          <div className="bg-sidebar-background text-sidebar-foreground p-2 rounded-lg">
            <h3 className="text-sm font-bold underline mb-1 text-center">NECC Reservations</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-sidebar-foreground">Unit</TableHead>
                  <TableHead className="text-xs text-sidebar-foreground">Date/Time</TableHead>
                  <TableHead className="text-xs text-sidebar-foreground">Notes</TableHead>
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
          <div className="bg-sidebar-background text-sidebar-foreground p-2 rounded-lg">
            <h3 className="text-sm font-bold underline mb-1 text-center">Linked Events</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs text-sidebar-foreground">Date/Time</TableHead>
                  <TableHead className="text-xs text-sidebar-foreground">Unit</TableHead>
                  <TableHead className="text-xs text-sidebar-foreground">System</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linkedEvents.map(e => (
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
  );
}
