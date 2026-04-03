import { SimSlot, MRT_SIM_IDS } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

const FTD_FFS_IDS = ['ah1z-ftd', 'ah1z-ffs', 'uh1y-ftd', 'uh1y-ffs'];

interface SimScheduleTableProps {
  simId?: string;
  name: string;
  entries: SimSlot[];
  mrtLocation?: string;
  currentHour?: number;
  currentMinute?: number;
  larger?: boolean;
}

function parseSlotMinutes(time: string): number | null {
  const match = time.match(/^(\d{1,2})(\d{2})$/);
  if (!match) return null;
  return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
}

function isOpenSlot(entry: SimSlot): boolean {
  const u = (entry.unit || '').toUpperCase().trim();
  const c = (entry.crew || '').toUpperCase().trim();
  return (u === 'OPEN' || c === 'OPEN') || (!u && !c && !entry.csi);
}

export function SimScheduleTable({ simId, name, entries, mrtLocation, currentHour, currentMinute, larger }: SimScheduleTableProps) {
  const hasData = entries.some(e => e.unit || e.crew || e.csi);
  if (!hasData) return null;

  const isMrt = simId ? MRT_SIM_IDS.includes(simId) : name.startsWith('MRT');
  const isFtdFfs = simId ? FTD_FFS_IDS.includes(simId) : false;

  return (
    <div className="mb-1">
      <Table className={`font-sans ${larger ? "text-[13px]" : "text-[11px]"}`}>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--header-bg))]">
            <TableHead className={`text-[hsl(var(--header-foreground))] font-bold w-[80px] py-0.5 whitespace-nowrap ${larger ? 'text-base px-1.5' : 'text-[11px]'}`}>{name}</TableHead>
            <TableHead className={`text-[hsl(var(--header-foreground))] font-bold py-0.5 ${larger ? 'text-base px-1.5' : 'text-[11px]'}`}>Unit</TableHead>
            <TableHead className={`text-[hsl(var(--header-foreground))] font-bold py-0.5 ${larger ? 'text-base px-1.5' : 'text-[11px]'}`}>Crew</TableHead>
            <TableHead className={`text-[hsl(var(--header-foreground))] font-bold py-0.5 whitespace-nowrap ${larger ? 'text-base px-1.5' : 'text-[11px]'}`}>{isMrt ? 'Type' : 'CSI/DO'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.filter(e => e.unit || e.crew || e.csi).map((entry, i, filtered) => {
            const open = isFtdFfs && isOpenSlot(entry);
            const role = isMrt
              ? (entry.csi === 'AH' ? 'AH' : 'UH')
              : (entry.csi === 'DO' || entry.csi === 'Device Operator' ? 'DO' : 'CSI');
            const badgeClass = role === (isMrt ? 'AH' : 'CSI')
              ? 'bg-amber-500/80 text-black font-extrabold'
              : 'bg-sky-600/80 text-white font-extrabold';
            const slotMin = parseSlotMinutes(entry.time);
            const nextEntry = filtered[i + 1];
            const nextMin = nextEntry ? parseSlotMinutes(nextEntry.time) : (slotMin != null ? slotMin + 120 : null);
            const currentMin = currentHour != null && currentMinute != null ? currentHour * 60 + currentMinute : null;
            const isCurrent = slotMin != null && nextMin != null && currentMin != null && currentMin >= slotMin && currentMin < nextMin;

            const rowBg = isCurrent
              ? 'bg-yellow-400/40 ring-2 ring-yellow-400 ring-inset font-bold'
              : i % 2 === 0
                ? 'bg-muted/50'
                : 'bg-muted/10';

            return (
              <TableRow key={i} className={`${rowBg} border-b border-border/40`}>
                <TableCell className={`font-mono text-white font-semibold ${larger ? 'text-base py-0.5 px-1.5' : 'text-[11px] py-0'}`}>{entry.time}</TableCell>
                <TableCell className={`text-white font-semibold ${larger ? 'text-base py-0.5 px-1.5' : 'text-[11px] py-0'}`}>
                  {open ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold">
                      <ArrowRight className={larger ? "w-4 h-4" : "w-3 h-3"} />
                      OPEN
                    </span>
                  ) : entry.unit}
                </TableCell>
                <TableCell className={`text-white font-semibold ${larger ? 'text-base py-0.5 px-1.5' : 'text-[11px] py-0'}`}>
                  {open ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-400 font-bold">
                      <ArrowRight className={larger ? "w-4 h-4" : "w-3 h-3"} />
                      OPEN
                    </span>
                  ) : entry.crew}
                </TableCell>
                <TableCell className={`${larger ? 'text-base py-0.5 px-1.5' : 'text-[11px] py-0'}`}>
                  <span className={`inline-flex min-w-[3rem] items-center justify-center rounded px-1.5 py-0 font-bold ${larger ? 'text-sm' : 'text-[10px]'} ${badgeClass}`}>
                    {role}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {isMrt && mrtLocation && (
        <div className="text-[10px] text-muted-foreground font-medium px-2 py-0.5 bg-muted/20 border-t border-border">
          📍 Location: <span className="font-semibold text-foreground">{mrtLocation}</span>
        </div>
      )}
    </div>
  );
}
