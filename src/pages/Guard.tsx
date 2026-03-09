import { useState, useEffect } from "react";
import { SIMULATORS } from "@/lib/types";
import { getSimEntries, getTrainerStatuses, getClassrooms, getNECCEntries, getLinkedEvents, getVisibility, getDisplayName } from "@/lib/store";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { TrainerStatusPanel } from "@/components/TrainerStatusPanel";
import { SimScheduleTable } from "@/components/SimScheduleTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, VisibilitySettings } from "@/lib/types";

export default function GuardPage() {
  const [simData, setSimData] = useState<Record<string, SimSlot[]>>({});
  const [statuses, setStatuses] = useState<TrainerStatus[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomEntry[]>([]);
  const [neccEntries, setNeccEntries] = useState<NECCEntry[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visibility, setVisibility] = useState<VisibilitySettings>(getVisibility());

  const loadData = () => {
    const data: Record<string, SimSlot[]> = {};
    SIMULATORS.forEach(sim => { data[sim.id] = getSimEntries(sim.id); });
    setSimData(data);
    setStatuses(getTrainerStatuses());
    setClassrooms(getClassrooms());
    setNeccEntries(getNECCEntries());
    setLinkedEvents(getLinkedEvents());
    setCurrentTime(new Date());
    setVisibility(getVisibility());
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 40000);
    return () => clearInterval(interval);
  }, []);

  const visibleSims = SIMULATORS.filter(s => visibility.simulators[s.id] !== false);

  return (
    <div className="flex min-h-screen">
      <DirectorySidebar className="w-64 min-h-screen flex-shrink-0 rounded-none" />
      
      <div className="flex-1 p-4 overflow-auto bg-card">
        <div className="mb-4">
          <p className="text-lg font-semibold">
            Current Simulator Schedule{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {visibleSims.map(sim => (
            <SimScheduleTable key={sim.id} name={getDisplayName(sim.id)} entries={simData[sim.id] || []} />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">*NB = No brief</p>
      </div>

      <div className="w-72 flex-shrink-0 p-4 space-y-4">
        {visibility.trainerStatus && <TrainerStatusPanel statuses={statuses} />}

        {visibility.classrooms && classrooms.length > 0 && (
          <div className="bg-sidebar-background text-sidebar-foreground p-4 rounded-lg">
            <h3 className="text-lg font-bold underline mb-2 text-center">Classes</h3>
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
          <div className="bg-sidebar-background text-sidebar-foreground p-4 rounded-lg">
            <h3 className="text-lg font-bold underline mb-2 text-center">NECC Reservations</h3>
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
          <div className="bg-sidebar-background text-sidebar-foreground p-4 rounded-lg">
            <h3 className="text-lg font-bold underline mb-2 text-center">Linked Events</h3>
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
