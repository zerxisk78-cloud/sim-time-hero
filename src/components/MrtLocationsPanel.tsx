import { MRT_SIM_IDS, type MrtLocationSettings } from "@/lib/types";
import { getDisplayName } from "@/lib/store";

interface MrtLocationsPanelProps {
  locations: MrtLocationSettings;
  className?: string;
  compact?: boolean;
}

export function MrtLocationsPanel({ locations, className = "", compact = false }: MrtLocationsPanelProps) {
  return (
    <div className={`bg-sidebar-background text-sidebar-foreground rounded-lg ${compact ? "p-2" : "p-4"} ${className}`.trim()}>
      <h3 className={`${compact ? "text-xs mb-1" : "text-lg mb-2"} font-bold underline text-center`}>
        MRT Locations
      </h3>
      <div className="space-y-1">
        {MRT_SIM_IDS.map((id) => (
          <div key={id} className="flex items-center justify-between gap-3 border-b border-sidebar-border/50 pb-1 last:border-b-0 last:pb-0">
            <span className={`${compact ? "text-xs" : "text-sm"} font-medium`}>
              {getDisplayName(id)}
            </span>
            <span className={`${compact ? "text-xs" : "text-sm"} font-semibold text-sidebar-primary`}>
              {locations[id] || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
