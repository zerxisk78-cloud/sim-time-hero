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
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold py-1 text-xs whitespace-nowrap">{isMrt ? 'Type' : 'CSI/System'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.filter(e => e.unit || e.crew || e.csi).map((entry, i) => (
            <TableRow key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
              <TableCell className="font-mono text-xs py-0.5">{entry.time}</TableCell>
              <TableCell className="text-xs py-0.5">{entry.unit}</TableCell>
              <TableCell className="text-xs py-0.5">{entry.crew}</TableCell>
              <TableCell className="text-xs py-0.5">
                {isMrt ? (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    entry.csi === 'AH' 
                      ? 'bg-red-600/20 text-red-400' 
                      : 'bg-blue-600/20 text-blue-400'
                  }`}>
                    {entry.csi || 'UH'}
                  </span>
                ) : entry.csi}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
