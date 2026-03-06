import { SimSlot } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface SimScheduleTableProps {
  name: string;
  entries: SimSlot[];
}

export function SimScheduleTable({ name, entries }: SimScheduleTableProps) {
  const hasData = entries.some(e => e.unit || e.crew || e.csi);
  if (!hasData) return null;

  return (
    <div className="mb-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-[hsl(var(--header-bg))]">
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold w-[60px]">{name}</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold">Unit</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold">Crew</TableHead>
            <TableHead className="text-[hsl(var(--header-foreground))] font-bold">CSI/System</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.filter(e => e.unit || e.crew || e.csi).map((entry, i) => (
            <TableRow key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
              <TableCell className="font-mono text-xs py-1">{entry.time}</TableCell>
              <TableCell className="text-xs py-1">{entry.unit}</TableCell>
              <TableCell className="text-xs py-1">{entry.crew}</TableCell>
              <TableCell className="text-xs py-1">{entry.csi}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
