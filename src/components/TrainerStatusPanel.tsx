import { TrainerStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TrainerStatusPanelProps {
  statuses: TrainerStatus[];
  onToggle?: (id: string) => void;
  onNoteChange?: (id: string, note: string) => void;
  editable?: boolean;
}

export function TrainerStatusPanel({ statuses, onToggle, onNoteChange, editable = false }: TrainerStatusPanelProps) {
  return (
    <div className="bg-sidebar-background text-sidebar-foreground p-2 rounded-lg space-y-1">
      <div className="bg-sidebar-accent px-2 py-1 rounded">
        <h2 className="text-sm font-bold text-center text-sidebar-foreground">Trainer Status</h2>
      </div>

      <div className="space-y-2">
        {statuses.map((status) => (
          <div key={status.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{status.name}</span>
              {editable ? (
                <button
                  onClick={() => onToggle?.(status.id)}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-bold transition-colors",
                    status.isUp
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  )}
                >
                  {status.isUp ? "UP" : "DOWN"}
                </button>
              ) : (
                <span
                  className={cn(
                    "px-3 py-1 rounded text-xs font-bold",
                    status.isUp ? "bg-green-600 text-white" : "bg-red-600 text-white"
                  )}
                >
                  {status.isUp ? "UP" : "DOWN"}
                </span>
              )}
            </div>
            {!status.isUp && (
              editable ? (
                <input
                  type="text"
                  value={status.note}
                  onChange={(e) => onNoteChange?.(status.id, e.target.value)}
                  placeholder="Reason..."
                  className="text-xs bg-muted text-destructive font-bold px-2 py-1 rounded border border-input"
                />
              ) : status.note ? (
                <span className="text-xs text-destructive font-bold">{status.note}</span>
              ) : null
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
