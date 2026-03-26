import { useState, useEffect, useCallback } from "react";
import { SIMULATORS } from "@/lib/types";
import { getDisplayName, loadAllData } from "@/lib/store";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { TrainerStatusPanel } from "@/components/TrainerStatusPanel";
import { MrtLocationsPanel } from "@/components/MrtLocationsPanel";
import { SimScheduleTable } from "@/components/SimScheduleTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, VisibilitySettings, MrtLocationSettings } from "@/lib/types";

export default function GuardPage() {
  const [simData, setSimData] = useState<Record<string, SimSlot[]>>({});
  const [statuses, setStatuses] = useState<TrainerStatus[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomEntry[]>([]);
  const [neccEntries, setNeccEntries] = useState<NECCEntry[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [visibility, setVisibility] = useState<VisibilitySettings>({ simulators: {}, classrooms: true, necc: true, linkedEvents: true, trainerStatus: true });
  const [extraSims, setExtraSims] = useState<{ id: string; name: string }[]>([]);
  const [mrtLocations, setMrtLocations] = useState<MrtLocationSettings>({});

  const loadData = useCallback(async () => {
    const data = await loadAllData();
    setSimData(data.simData);
    setStatuses(data.statuses);
    setClassrooms(data.classrooms);
    setNeccEntries(data.neccEntries);
    setLinkedEvents(data.linkedEvents);
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

  const allSims = [...SIMULATORS, ...extraSims.map(s => ({ ...s, shortName: s.name, timeSlots: [] as string[] }))];
  const visibleSims = allSims.filter(s => visibility.simulators[s.id] !== false);

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
            <SimScheduleTable key={sim.id} simId={sim.id} name={getDisplayName(sim.id)} entries={simData[sim.id] || []} mrtLocation={mrtLocations[sim.id]} currentHour={new Date().getHours()} currentMinute={new Date().getMinutes()} />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">*NB = No brief</p>
      </div>

      <div className="w-72 flex-shrink-0 p-4 space-y-4">
        <MrtLocationsPanel locations={mrtLocations} />
        {visibility.trainerStatus && <TrainerStatusPanel statuses={statuses} simData={simData} />}

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
