import { TrainerStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TrainerStatusPanelProps {
  statuses: TrainerStatus[];
  onToggle?: (id: string) => void;
  onNoteChange?: (id: string, note: string) => void;
  editable?: boolean;
  hideHeader?: boolean;
}

export function TrainerStatusPanel({ statuses, onToggle, onNoteChange, editable = false, hideHeader = false }: TrainerStatusPanelProps) {
  return (
    <div className="bg-sidebar-background text-sidebar-foreground p-1.5 rounded-lg space-y-0.5">
      {!hideHeader && (
        <div className="bg-sidebar-accent px-1.5 py-0.5 rounded">
          <h2 className="text-xs font-bold text-center text-sidebar-foreground">Trainer Status</h2>
        </div>
      )}

      <div className="space-y-0">
        {statuses.map((status) => (
          <div key={status.id} className="flex flex-col">
            <div className="flex items-center justify-between py-0.5">
              <span className="font-medium text-xs leading-tight">{status.name}</span>
              {editable ? (
                <button
                  onClick={() => onToggle?.(status.id)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold transition-colors leading-tight",
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
                    "px-2 py-0.5 rounded text-[10px] font-bold leading-tight",
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
                  className="text-[10px] bg-muted text-destructive font-bold px-1.5 py-0.5 rounded border border-input"
                />
              ) : status.note ? (
                <span className="text-[10px] text-destructive font-bold leading-tight">{status.note}</span>
              ) : null
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
