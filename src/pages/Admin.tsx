import { useState, useEffect, useCallback } from "react";
import { SIMULATORS, TRAINER_GROUPS, MRT_SIM_IDS } from "@/lib/types";
import {
  getSimEntries, saveSimEntries, getSimLastSaved,
  getTrainerStatuses, saveTrainerStatuses,
  getClassrooms, saveClassroom, updateClassroom, deleteClassroom, saveClassroomsOrder,
  getNECCEntries, saveNECCEntry, updateNECCEntry, deleteNECCEntry, saveNECCOrder,
  getLinkedEvents, saveLinkedEvent, updateLinkedEvent, deleteLinkedEvent, saveLinkedEventsOrder,
  getDirectory, type DirectoryData,
  getVisibility, saveVisibility,
  getDisplayName, saveNameOverride,
  getExtraSims, saveExtraSims, removeSimData, type ExtraSim,
  getMrtLocations, saveMrtLocations,
} from "@/lib/store";
import { getServerUrl, setServerUrl, getApiBase } from "@/lib/serverConfig";
import type { SimSlot, TrainerStatus, ClassroomEntry, NECCEntry, LinkedEvent, VisibilitySettings } from "@/lib/types";
import { DirectorySidebar } from "@/components/DirectorySidebar";
import { DirectoryEditor } from "@/components/DirectoryEditor";
import { TrainerStatusPanel } from "@/components/TrainerStatusPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Undo2, Pencil, Check, GripVertical, Plus, Server, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { resetServerCheck, syncFromServer } from "@/lib/api";


const FIELD_ORDER: (keyof SimSlot)[] = ['time', 'unit', 'crew', 'csi'];

function SimEditor({ simId, refreshKey }: { simId: string; name: string; timeSlots: string[]; refreshKey?: number }) {
  const isMrt = MRT_SIM_IDS.includes(simId);
  const [entries, setEntries] = useState<SimSlot[]>([]);
  const [lastSaved, setLastSaved] = useState("");
  const [displayName, setDisplayName] = useState(getDisplayName(simId));
  const [editingName, setEditingName] = useState(false);
  const [dirty, setDirty] = useState(false);

  const getToggleValue = (value: string) => {
    if (isMrt) return value === 'AH' ? 'AH' : 'UH';
    return value === 'Device Operator' ? 'Device Operator' : 'CSI';
  };

  const getNextToggleValue = (value: string) => {
    const currentValue = getToggleValue(value);
    if (isMrt) return currentValue === 'AH' ? 'UH' : 'AH';
    return currentValue === 'CSI' ? 'Device Operator' : 'CSI';
  };

  const getToggleClasses = (value: string) => {
    const currentValue = getToggleValue(value);
    const activeValue = isMrt ? 'AH' : 'Device Operator';

    return currentValue === activeValue
      ? 'bg-primary/15 text-primary hover:bg-primary/25'
      : 'bg-accent text-accent-foreground hover:bg-accent/80';
  };

  useEffect(() => {
    if (!dirty) {
      setEntries(getSimEntries(simId));
      setLastSaved(getSimLastSaved(simId));
      setDisplayName(getDisplayName(simId));
    }
  }, [simId, refreshKey]);

  const updateField = (index: number, field: keyof SimSlot, value: string) => {
    setDirty(true);
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const focusCell = (row: number, col: number) => {
    const el = document.querySelector<HTMLElement>(
      `[data-sim="${simId}"][data-row="${row}"][data-col="${col}"]`
    );
    if (!el) return;
    el.focus();
    if (el instanceof HTMLInputElement) el.select();
  };

  const handlePaste = (startRow: number, startCol: number, e: React.ClipboardEvent) => {
    const pasteData = e.clipboardData.getData('text');
    const rows = pasteData.split(/\r?\n/).filter(r => r.length > 0);
    if (rows.length <= 1 && !pasteData.includes('\t')) return;
    e.preventDefault();
    setDirty(true);
    setEntries(prev => {
      const updated = [...prev];
      rows.forEach((row, ri) => {
        const idx = startRow + ri;
        if (idx >= updated.length) return;
        const cols = row.split('\t');
        cols.forEach((val, ci) => {
          const colIdx = startCol + ci;
          if (colIdx < FIELD_ORDER.length) {
            updated[idx] = { ...updated[idx], [FIELD_ORDER[colIdx]]: val.trim() };
          }
        });
      });
      return updated;
    });
  };

  const handleKeyDown = (row: number, col: number, e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const next = e.shiftKey
        ? (col > 0 ? [row, col - 1] : row > 0 ? [row - 1, FIELD_ORDER.length - 1] : null)
        : (col < FIELD_ORDER.length - 1 ? [row, col + 1] : row < entries.length - 1 ? [row + 1, 0] : null);
      if (next) focusCell(next[0], next[1]);
    } else if (e.key === 'Enter' && e.currentTarget instanceof HTMLInputElement) {
      e.preventDefault();
      if (row < entries.length - 1) focusCell(row + 1, col);
    } else if (e.key === 'ArrowDown' && row < entries.length - 1) {
      e.preventDefault();
      focusCell(row + 1, col);
    } else if (e.key === 'ArrowUp' && row > 0) {
      e.preventDefault();
      focusCell(row - 1, col);
    }
  };

  const addRow = () => {
    setDirty(true);
    setEntries(prev => [...prev, { time: '', unit: '', crew: '', csi: isMrt ? 'UH' : 'CSI' }]);
  };

  const removeRow = (index: number) => {
    if (entries.length <= 1) return;
    setDirty(true);
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const ts = saveSimEntries(simId, entries);
    setLastSaved(ts);
    setDirty(false);
    toast.success(`${displayName} saved`);
  };

  const handleUndo = () => {
    setEntries(getSimEntries(simId));
    setDirty(false);
    toast.info(`${displayName} reverted to last saved`);
  };

  const handleSaveName = () => {
    saveNameOverride(simId, displayName);
    setEditingName(false);
    toast.success(`Renamed to ${displayName}`);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3 flex flex-row items-center justify-between">
        {editingName ? (
          <div className="flex items-center gap-1">
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="h-7 text-sm w-40"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
            />
            <Button onClick={handleSaveName} size="sm" variant="ghost" className="h-7 w-7 p-0">
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <CardTitle className="text-base flex items-center gap-1">
            {displayName}
            <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3 w-3" />
            </button>
          </CardTitle>
        )}
        <Button onClick={handleUndo} size="sm" variant="ghost" className="text-xs h-7 gap-1">
          <Undo2 className="h-3.5 w-3.5" /> Undo
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-border rounded overflow-hidden mx-4 mb-3">
          <div className="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_120px_44px] bg-muted">
            {['Time', 'Unit', 'Crew', isMrt ? 'Type' : 'CSI/DO'].map((h) => (
              <div key={h} className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-r border-border last:border-r-0">
                {h}
              </div>
            ))}
            <div />
          </div>
          {entries.map((entry, i) => (
            <div key={i} className="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_120px_44px] border-t border-border">
              {FIELD_ORDER.map((field, col) => (
                field === 'csi' ? (
                  <button
                    key={field}
                    type="button"
                    value={getToggleValue(entry.csi)}
                    data-sim={simId}
                    data-row={i}
                    data-col={col}
                    onClick={() => updateField(i, 'csi', getNextToggleValue(entry.csi))}
                    onKeyDown={(e) => handleKeyDown(i, col, e)}
                    className={`px-2 py-1 text-xs font-semibold border-r border-border transition-colors focus:bg-accent/30 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-ring ${getToggleClasses(entry.csi)}`}
                  >
                    {getToggleValue(entry.csi)}
                  </button>
                ) : (
                  <input
                    key={field}
                    value={entry[field]}
                    data-sim={simId}
                    data-row={i}
                    data-col={col}
                    onChange={(e) => updateField(i, field, e.target.value)}
                    onPaste={(e) => handlePaste(i, col, e)}
                    onKeyDown={(e) => handleKeyDown(i, col, e)}
                    onFocus={(e) => e.target.select()}
                    className={`bg-background px-2 py-1 text-xs border-r border-border outline-none focus:bg-accent/30 focus:ring-1 focus:ring-inset focus:ring-ring ${col === 0 ? 'font-mono' : ''}`}
                  />
                )
              ))}
              <button
                onClick={() => removeRow(i)}
                className="flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Remove row"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 px-4 pb-3">
          <Button onClick={addRow} size="sm" variant="outline" className="text-xs h-7">+ Add Row</Button>
          <Button onClick={handleSave} size="sm" className="text-xs h-7">Save {displayName}</Button>
          {lastSaved && <span className="text-xs text-muted-foreground">Last saved: {lastSaved}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function SortableRow<T extends { id: string }>({
  item,
  columns,
  editingId,
  editValues,
  setEditValues,
  saveEdit,
  startEdit,
  onDelete,
}: {
  item: T;
  columns: { key: keyof T; label: string }[];
  editingId: string | null;
  editValues: Partial<T>;
  setEditValues: React.Dispatch<React.SetStateAction<Partial<T>>>;
  saveEdit: () => void;
  startEdit: (item: T) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="py-1 w-8 cursor-grab" {...attributes} {...listeners}>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </TableCell>
      {columns.map(col => (
        <TableCell key={String(col.key)} className="text-xs py-1">
          {editingId === item.id ? (
            <Input
              value={String(editValues[col.key] ?? '')}
              onChange={e => setEditValues(prev => ({ ...prev, [col.key]: e.target.value }))}
              className="h-7 text-xs"
              onKeyDown={e => e.key === 'Enter' && saveEdit()}
            />
          ) : (
            String(item[col.key])
          )}
        </TableCell>
      ))}
      <TableCell className="py-1">
        <div className="flex gap-1">
          {editingId === item.id ? (
            <button onClick={saveEdit} className="text-primary hover:opacity-70">
              <Check className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={() => onDelete(item.id)} className="text-destructive hover:opacity-70">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function CrudTable<T extends { id: string }>({
  title,
  items,
  columns,
  onAdd,
  onDelete,
  onUpdate,
  onReorder,
  renderInputs,
}: {
  title: string;
  items: T[];
  columns: { key: keyof T; label: string }[];
  onAdd: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onReorder: (items: T[]) => void;
  renderInputs: () => React.ReactNode;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<T>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const startEdit = (item: T) => {
    setEditingId(item.id);
    const vals: Partial<T> = {};
    columns.forEach(col => { vals[col.key] = item[col.key]; });
    setEditValues(vals);
  };

  const saveEdit = () => {
    if (editingId) {
      onUpdate(editingId, editValues);
      setEditingId(null);
      toast.success(`${title} updated`);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id);
      const newIndex = items.findIndex(i => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);
      onReorder(reordered);
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-end flex-wrap">
          {renderInputs()}
          <Button onClick={onAdd} size="sm">Add</Button>
        </div>
        {items.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  {columns.map(col => (
                    <TableHead key={String(col.key)} className="text-xs">{col.label}</TableHead>
                  ))}
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  {items.map(item => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      columns={columns}
                      editingId={editingId}
                      editValues={editValues}
                      setEditValues={setEditValues}
                      saveEdit={saveEdit}
                      startEdit={startEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </SortableContext>
              </TableBody>
            </Table>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}

// Server connection settings component
function ServerSettings() {
  const [url, setUrl] = useState(getServerUrl());
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<boolean | null>(null);

  const testConnection = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${url.replace(/\/+$/, '').replace(/\/api\/data$/i, '')}/api/data/__healthcheck`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });
      const text = await res.text();
      try {
        JSON.parse(text);
        setStatus(true);
        toast.success("Connected to server!");
      } catch {
        setStatus(false);
        toast.error("Server returned HTML, not JSON — check that the Express server is running on this URL");
      }
    } catch {
      setStatus(false);
      toast.error("Cannot reach server at " + url);
    }
    setTesting(false);
  };

  const saveUrl = () => {
    setServerUrl(url);
    resetServerCheck();
    toast.success("Server URL saved — connection will re-check automatically");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Server className="h-4 w-4" /> Server Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Set the URL of your Express data server (managed by PM2).
        </p>
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs text-muted-foreground">Server URL</label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="http://your-server-ip:3001"
              className="h-8 text-xs font-mono"
            />
          </div>
          <Button onClick={saveUrl} size="sm" className="h-8 text-xs">Save</Button>
          <Button onClick={testConnection} size="sm" variant="outline" className="h-8 text-xs" disabled={testing}>
            {testing ? "Testing…" : "Test"}
          </Button>
        </div>
        {status !== null && (
          <div className={`flex items-center gap-1.5 text-xs font-medium ${status ? "text-green-400" : "text-destructive"}`}>
            {status ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {status ? "Server Connected — data syncs across all computers" : "Not Connected — data stays local only"}
          </div>
        )}
        <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-border">
          <strong>PM2 Setup:</strong> Run <code className="bg-muted px-1 rounded">pm2 start ecosystem.config.js</code> in the server folder. Express serves both the website and API. All computers on the network will share the same data.
        </div>
      </CardContent>
    </Card>
  );
}

// Extra sims now come from shared store

export default function AdminPage() {
  const [trainerStatuses, setTrainerStatuses] = useState<TrainerStatus[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomEntry[]>([]);
  const [neccEntries, setNeccEntries] = useState<NECCEntry[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<LinkedEvent[]>([]);
  const [directoryData, setDirectoryData] = useState<DirectoryData>(getDirectory());
  const [visibility, setVisibility] = useState<VisibilitySettings>(getVisibility());
  const [extraSims, setExtraSims] = useState<ExtraSim[]>(getExtraSims);
  const [mrtLocations, setMrtLocations] = useState<Record<string, string>>(getMrtLocations());

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
    setVisibility(getVisibility());
    setExtraSims(getExtraSims());
    setMrtLocations(getMrtLocations());
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

  const updateVisibility = (updater: (prev: VisibilitySettings) => VisibilitySettings) => {
    setVisibility(prev => {
      const next = updater(prev);
      saveVisibility(next);
      return next;
    });
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
            
            {/* Extra custom trainer boxes */}
            {extraSims.map(sim => (
              <div key={sim.id} className="relative">
                <SimEditor simId={sim.id} name={sim.name} timeSlots={[]} />
                <button
                  onClick={() => {
                    const updated = extraSims.filter(s => s.id !== sim.id);
                    setExtraSims(updated);
                    saveExtraSims(updated);
                    removeSimData(sim.id);
                    const newStatuses = getTrainerStatuses().filter(s => s.id !== sim.id);
                    saveTrainerStatuses(newStatuses);
                    setTrainerStatuses(newStatuses);
                    updateVisibility(prev => {
                      const sims = { ...prev.simulators };
                      delete sims[sim.id];
                      return { ...prev, simulators: sims };
                    });
                    toast.info(`Removed ${sim.name}`);
                  }}
                  className="absolute top-2 right-2 p-1 bg-destructive/80 text-destructive-foreground rounded hover:bg-destructive"
                  title="Remove trainer box"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            
            {/* Add new trainer box button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const name = prompt("Enter trainer name:");
                if (name?.trim()) {
                  const id = `custom-${Date.now()}`;
                  const updated = [...extraSims, { id, name: name.trim() }];
                  setExtraSims(updated);
                  saveExtraSims(updated);
                  // Add trainer status entry
                  const currentStatuses = getTrainerStatuses();
                  if (!currentStatuses.find(s => s.id === id)) {
                    const newStatuses = [...currentStatuses, { id, name: name.trim(), isUp: true, note: '' }];
                    saveTrainerStatuses(newStatuses);
                    setTrainerStatuses(newStatuses);
                  }
                  // Add visibility entry
                  updateVisibility(prev => ({
                    ...prev,
                    simulators: { ...prev.simulators, [id]: true },
                  }));
                  toast.success(`Added ${name.trim()}`);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Trainer Box
            </Button>
          </div>

          {/* Right column: Server Settings + Trainer groups + Visibility + CRUD tables */}
          <div className="space-y-4">
            {/* Server Connection Settings */}
            <ServerSettings />

            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-base">MRT Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Edit the default room/deployment location shown for MRT 1-4 on the display pages.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {MRT_SIM_IDS.map((id) => (
                    <div key={id} className="space-y-1">
                      <label className="text-xs text-muted-foreground">{getDisplayName(id)}</label>
                      <Input
                        value={mrtLocations[id] ?? ''}
                        onChange={(e) => setMrtLocations((prev) => ({ ...prev, [id]: e.target.value }))}
                        className="h-8 text-xs"
                        placeholder="Enter room or deployment note"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      saveMrtLocations(mrtLocations);
                      setMrtLocations(getMrtLocations());
                      toast.success('MRT locations saved');
                    }}
                  >
                    Save MRT Locations
                  </Button>
                </div>
              </CardContent>
            </Card>
            {/* Visibility Controls */}
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Visibility Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">Toggle what's visible on Guard & Schedule pages</p>
                <div className="space-y-2">
                  {SIMULATORS.map(sim => (
                    <div key={sim.id} className="flex items-center justify-between">
                      <span className="text-xs font-medium">{getDisplayName(sim.id)}</span>
                      <Switch
                        checked={visibility.simulators[sim.id] ?? true}
                        onCheckedChange={(checked) => updateVisibility(prev => ({
                          ...prev,
                          simulators: { ...prev.simulators, [sim.id]: checked },
                        }))}
                      />
                    </div>
                  ))}
                  {extraSims.map(sim => (
                    <div key={sim.id} className="flex items-center justify-between">
                      <span className="text-xs font-medium">{getDisplayName(sim.id) || sim.name}</span>
                      <Switch
                        checked={visibility.simulators[sim.id] ?? true}
                        onCheckedChange={(checked) => updateVisibility(prev => ({
                          ...prev,
                          simulators: { ...prev.simulators, [sim.id]: checked },
                        }))}
                      />
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 mt-2 space-y-2">
                    {[
                      { key: 'classrooms' as const, label: 'Classrooms' },
                      { key: 'necc' as const, label: 'NECC Reservations' },
                      { key: 'linkedEvents' as const, label: 'Linked Events' },
                      { key: 'trainerStatus' as const, label: 'Trainer Status' },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-xs font-medium">{item.label}</span>
                        <Switch
                          checked={visibility[item.key]}
                          onCheckedChange={(checked) => updateVisibility(prev => ({
                            ...prev,
                            [item.key]: checked,
                          }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trainer Status - All Groups */}
            <Card className="mb-4">
              <CardHeader className="py-3">
                <CardTitle className="text-base">Trainer Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TRAINER_GROUPS.map(group => {
                  const groupStatuses = trainerStatuses.filter(s => group.trainers.some(t => t.id === s.id));
                  const allVisible = group.trainers.every(t => visibility.simulators[t.id] !== false);
                  const toggleGroupVisibility = () => {
                    updateVisibility(prev => {
                      const next = { ...prev, simulators: { ...prev.simulators } };
                      group.trainers.forEach(t => { next.simulators[t.id] = !allVisible; });
                      return next;
                    });
                    toast.info(`${group.name} ${allVisible ? 'hidden' : 'shown'} on display pages`);
                  };
                  return (
                    <div key={group.id}>
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className="text-sm font-semibold cursor-default select-none"
                          onDoubleClick={toggleGroupVisibility}
                        >
                          {group.name}
                        </h4>
                        <span className={`h-2 w-2 rounded-full ${allVisible ? 'bg-green-500' : 'bg-red-500'} opacity-30`} />
                      </div>
                      <TrainerStatusPanel
                        statuses={groupStatuses}
                        editable
                        hideHeader
                        onToggle={handleTrainerToggle}
                        onNoteChange={handleTrainerNote}
                      />
                    </div>
                  );
                })}
                {/* Custom Trainers */}
                {extraSims.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Custom Trainers</h4>
                    <TrainerStatusPanel
                      statuses={trainerStatuses.filter(s => extraSims.some(es => es.id === s.id))}
                      editable
                      hideHeader
                      onToggle={handleTrainerToggle}
                      onNoteChange={handleTrainerNote}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

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
              onUpdate={(id, updates) => { updateClassroom(id, updates); reload(); }}
              onReorder={(items) => { saveClassroomsOrder(items); reload(); }}
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
              onUpdate={(id, updates) => { updateNECCEntry(id, updates); reload(); }}
              onReorder={(items) => { saveNECCOrder(items); reload(); }}
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
              onUpdate={(id, updates) => { updateLinkedEvent(id, updates); reload(); }}
              onReorder={(items) => { saveLinkedEventsOrder(items); reload(); }}
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

            <DirectoryEditor data={directoryData} onChange={setDirectoryData} />
          </div>
        </div>
      </div>
    </div>
  );
}
