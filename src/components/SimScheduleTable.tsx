import { SimSlot, MRT_SIM_IDS } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SimScheduleTableProps {
  simId?: string;
  name: string;
  entries: SimSlot[];
}

export function SimScheduleTable({ simId, name, entries }: SimScheduleTableProps) {
  const hasData = entries.some(e => e.unit || e.crew || e.csi);
  if (!hasData) return null;

  const isMrt = simId ? MRT_SIM_IDS.includes(simId) : name.startsWith('MRT');

  return (
    <div className="mb-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--header-bg))]">
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold w-[92px] py-1 text-xs whitespace-nowrap">{name}</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-1 text-xs">Unit</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-1 text-xs">Crew</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-1 text-xs whitespace-nowrap">{isMrt ? 'Type' : 'CSI/DO'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.filter(e => e.unit || e.crew || e.csi).map((entry, i) => {
            const role = isMrt
              ? (entry.csi === 'AH' ? 'AH' : 'UH')
              : (entry.csi === 'Device Operator' ? 'Device Operator' : 'CSI');
            const badgeClass = role === (isMrt ? 'AH' : 'Device Operator')
              ? 'bg-primary/15 text-primary'
              : 'bg-accent text-accent-foreground';

            return (
              <TableRow key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                <TableCell className="font-mono text-xs py-0.5">{entry.time}</TableCell>
                <TableCell className="text-xs py-0.5">{entry.unit}</TableCell>
                <TableCell className="text-xs py-0.5">{entry.crew}</TableCell>
                <TableCell className="text-xs py-0.5">
                  <span className={`inline-flex min-w-[3.5rem] items-center justify-center rounded px-2 py-0.5 text-xs font-bold ${badgeClass}`}>
                    {role}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
