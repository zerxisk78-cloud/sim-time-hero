import { SimSlot, MRT_SIM_IDS } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SimScheduleTableProps {
  simId?: string;
  name: string;
  entries: SimSlot[];
  mrtLocation?: string;
  currentHour?: number;
  fullWidth?: boolean;
}

function parseSlotHour(time: string): number | null {
  const match = time.match(/^(\d{1,2})\d{2}$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}

export function SimScheduleTable({ simId, name, entries, mrtLocation, currentHour }: SimScheduleTableProps) {
  const hasData = entries.some(e => e.unit || e.crew || e.csi);
  if (!hasData) return null;

  const isMrt = simId ? MRT_SIM_IDS.includes(simId) : name.startsWith('MRT');

  return (
    <div className="mb-1">
      <Table className="text-[11px]">
        <TableHeader>
          <TableRow className="bg-[hsl(var(--header-bg))]">
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold w-[80px] py-0.5 text-[11px] whitespace-nowrap">{name}</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-0.5 text-[11px]">Unit</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-0.5 text-[11px]">Crew</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-0.5 text-[11px] whitespace-nowrap">{isMrt ? 'Type' : 'CSI/DO'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.filter(e => e.unit || e.crew || e.csi).map((entry, i) => {
            const role = isMrt
              ? (entry.csi === 'AH' ? 'AH' : 'UH')
              : (entry.csi === 'Device Operator' ? 'Device Operator' : 'CSI');
            const badgeClass = role === (isMrt ? 'AH' : 'Device Operator')
              ? 'bg-amber-500/80 text-black font-extrabold'
              : 'bg-sky-600/80 text-white font-extrabold';
            const slotHour = parseSlotHour(entry.time);
            const isCurrent = currentHour != null && slotHour != null && slotHour === currentHour;

            return (
              <TableRow key={i} className={`${isCurrent ? 'bg-yellow-400/40 ring-2 ring-yellow-400 ring-inset font-bold' : i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                <TableCell className="font-mono text-[11px] py-0">{entry.time}</TableCell>
                <TableCell className="text-[11px] py-0">{entry.unit}</TableCell>
                <TableCell className="text-[11px] py-0">{entry.crew}</TableCell>
                <TableCell className="text-[11px] py-0">
                  <span className={`inline-flex min-w-[3rem] items-center justify-center rounded px-1.5 py-0 text-[10px] font-bold ${badgeClass}`}>
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
