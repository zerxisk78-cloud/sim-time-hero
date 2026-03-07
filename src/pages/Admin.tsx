import { useState, useEffect, useCallback } from "react";
import { SIMULATORS } from "@/lib/types";
import {
  getSimEntries, saveSimEntries, getSimLastSaved,
  getTrainerStatuses, saveTrainerStatuses,
  getClassrooms, saveClassroom, deleteClassroom,
  getNECCEntries, saveNECCEntry, deleteNECCEntry,
  getLinkedEvents, saveLinkedEvent, deleteLinkedEvent,
  getDirectory, type DirectoryData,
} from "@/lib/store";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { DirectoryEditor } from "@/components/DirectoryEditor";
import { TrainerStatusPanel } from "@/components/TrainerStatusPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent } from "@/lib/types";

function SimEditor({ simId, name, timeSlots }: { simId: string; name: string; timeSlots: string[] }) {
  const [entries, setEntries] = useState<SimSlot[]>([]);
  const [lastSaved, setLastSaved] = useState("");

  useEffect(() => {
    setEntries(getSimEntries(simId));
    setLastSaved(getSimLastSaved(simId));
  }, [simId]);

  const updateField = (index: number, field: keyof SimSlot, value: string) => {
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const handlePaste = (startIndex: number, field: keyof SimSlot, e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData('text');
    // Split by newlines (rows from spreadsheet) and tabs (columns)
    const rows = pasteData.split(/\r?\n/).filter(r => r.length > 0);
    if (rows.length <= 1 && !pasteData.includes('\t')) return; // single value, let default handle it
    e.preventDefault();
    
    setEntries(prev => {
      const updated = [...prev];
      const fields: (keyof SimSlot)[] = field === 'unit' ? ['unit', 'crew'] : field === 'crew' ? ['crew'] : [field];
      rows.forEach((row, ri) => {
        const idx = startIndex + ri;
        if (idx >= updated.length) return;
        const cols = row.split('\t');
        fields.forEach((f, ci) => {
          if (ci < cols.length) {
            updated[idx] = { ...updated[idx], [f]: cols[ci].trim() };
          }
        });
      });
      return updated;
    });
  };

  const handleSave = () => {
    const ts = saveSimEntries(simId, entries);
    setLastSaved(ts);
    toast.success(`${name} saved`);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-xs font-semibold text-muted-foreground">Time</div>
          <div className="text-xs font-semibold text-muted-foreground">Unit</div>
          <div className="text-xs font-semibold text-muted-foreground">Crew</div>
          <div className="text-xs font-semibold text-muted-foreground">CSI/System</div>
        </div>
        {entries.map((entry, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <Input
              value={entry.time}
              onChange={(e) => updateField(i, "time", e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <Input
              value={entry.unit}
              onChange={(e) => updateField(i, "unit", e.target.value)}
              onPaste={(e) => handlePaste(i, "unit", e)}
              className="h-8 text-xs"
            />
            <Input
              value={entry.crew}
              onChange={(e) => updateField(i, "crew", e.target.value)}
              onPaste={(e) => handlePaste(i, "crew", e)}
              className="h-8 text-xs"
            />
            <Input
              value={entry.csi}
              onChange={(e) => updateField(i, "csi", e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} size="sm">Save {name}</Button>
          {lastSaved && <span className="text-xs text-muted-foreground">Last saved: {lastSaved}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function CrudTable<T extends { id: string }>({
  title,
  items,
  columns,
  onAdd,
  onDelete,
  renderInputs,
}: {
  title: string;
  items: T[];
  columns: { key: keyof T; label: string }[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  renderInputs: () => React.ReactNode;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-end flex-wrap">
          {renderInputs()}
          <Button onClick={onAdd} size="sm">Save</Button>
        </div>
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => (
                  <TableHead key={String(col.key)} className="text-xs">{col.label}</TableHead>
                ))}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  {columns.map(col => (
                    <TableCell key={String(col.key)} className="text-xs py-1">
                      {String(item[col.key])}
                    </TableCell>
                  ))}
                  <TableCell className="py-1">
                    <button onClick={() => onDelete(item.id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const [trainerStatuses, setTrainerStatuses] = useState<TrainerStatus[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomEntry[]>([]);
  const [neccEntries, setNeccEntries] = useState<NECCEntry[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [directoryData, setDirectoryData] = useState<DirectoryData>(getDirectory());

  // CRUD form state
  const [classForm, setClassForm] = useState({ className: "", dateTime: "", location: "" });
  const [neccForm, setNeccForm] = useState({ unit: "", dateTime: "", notes: "" });
  const [linkedForm, setLinkedForm] = useState({ dateTime: "", unit: "", system: "" });

  const reload = useCallback(() => {
    setTrainerStatuses(getTrainerStatuses());
    setClassrooms(getClassrooms());
    setNeccEntries(getNECCEntries());
    setLinkedEvents(getLinkedEvents());
    setDirectoryData(getDirectory());
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const handleTrainerToggle = (id: string) => {
    const updated = trainerStatuses.map(s => s.id === id ? { ...s, isUp: !s.isUp, note: !s.isUp ? '' : s.note } : s);
    setTrainerStatuses(updated);
    saveTrainerStatuses(updated);
  };

  const handleTrainerNote = (id: string, note: string) => {
    const updated = trainerStatuses.map(s => s.id === id ? { ...s, note } : s);
    setTrainerStatuses(updated);
    saveTrainerStatuses(updated);
  };

  return (
    <div className="flex min-h-screen">
      <DirectorySidebar className="w-64 min-h-screen flex-shrink-0 rounded-none" directoryData={directoryData} />
      
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-primary px-4 py-2 rounded mb-4">
          <h1 className="text-xl font-bold text-primary-foreground text-center">MATSS Schedule - Admin</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column: Simulator editors */}
          <div className="space-y-4">
            {SIMULATORS.map(sim => (
              <SimEditor key={sim.id} simId={sim.id} name={sim.name} timeSlots={sim.timeSlots} />
            ))}
          </div>

          {/* Right column: Directory + CRUD tables + Trainer Status */}
          <div className="space-y-4">
            <DirectoryEditor data={directoryData} onChange={setDirectoryData} />
            <TrainerStatusPanel
              statuses={trainerStatuses}
              editable
              onToggle={handleTrainerToggle}
              onNoteChange={handleTrainerNote}
            />

            <CrudTable
              title="Classrooms"
              items={classrooms}
              columns={[
                { key: "className", label: "Class" },
                { key: "dateTime", label: "Date/Time" },
                { key: "location", label: "Location" },
              ]}
              onAdd={() => {
                saveClassroom(classForm);
                setClassForm({ className: "", dateTime: "", location: "" });
                reload();
                toast.success("Classroom added");
              }}
              onDelete={(id) => { deleteClassroom(id); reload(); }}
              renderInputs={() => (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Class</label>
                    <Input value={classForm.className} onChange={e => setClassForm(p => ({ ...p, className: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date/Time</label>
                    <Input value={classForm.dateTime} onChange={e => setClassForm(p => ({ ...p, dateTime: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Location</label>
                    <Input value={classForm.location} onChange={e => setClassForm(p => ({ ...p, location: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                </>
              )}
            />

            <CrudTable
              title="NECC Reservations"
              items={neccEntries}
              columns={[
                { key: "unit", label: "Unit" },
                { key: "dateTime", label: "Date/Time" },
                { key: "notes", label: "Notes" },
              ]}
              onAdd={() => {
                saveNECCEntry(neccForm);
                setNeccForm({ unit: "", dateTime: "", notes: "" });
                reload();
                toast.success("NECC entry added");
              }}
              onDelete={(id) => { deleteNECCEntry(id); reload(); }}
              renderInputs={() => (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <Input value={neccForm.unit} onChange={e => setNeccForm(p => ({ ...p, unit: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date/Time</label>
                    <Input value={neccForm.dateTime} onChange={e => setNeccForm(p => ({ ...p, dateTime: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Notes</label>
                    <Input value={neccForm.notes} onChange={e => setNeccForm(p => ({ ...p, notes: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                </>
              )}
            />

            <CrudTable
              title="Linked Events"
              items={linkedEvents}
              columns={[
                { key: "dateTime", label: "Date/Time" },
                { key: "unit", label: "Unit" },
                { key: "system", label: "System" },
              ]}
              onAdd={() => {
                saveLinkedEvent(linkedForm);
                setLinkedForm({ dateTime: "", unit: "", system: "" });
                reload();
                toast.success("Linked event added");
              }}
              onDelete={(id) => { deleteLinkedEvent(id); reload(); }}
              renderInputs={() => (
                <>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date/Time</label>
                    <Input value={linkedForm.dateTime} onChange={e => setLinkedForm(p => ({ ...p, dateTime: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Unit</label>
                    <Input value={linkedForm.unit} onChange={e => setLinkedForm(p => ({ ...p, unit: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">System</label>
                    <Input value={linkedForm.system} onChange={e => setLinkedForm(p => ({ ...p, system: e.target.value }))} className="h-8 text-xs w-32" />
                  </div>
                </>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
