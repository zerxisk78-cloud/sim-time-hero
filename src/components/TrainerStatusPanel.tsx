import { TrainerStatus, SimSlot, MRT_SIM_IDS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getDisplayName } from "@/lib/store";

interface MrtConfig {
  id: string;
  name: string;
  type: string; // 'AH' or 'UH'
}

interface TrainerStatusPanelProps {
  statuses: TrainerStatus[];
  onToggle?: (id: string) => void;
  onNoteChange?: (id: string, note: string) => void;
  editable?: boolean;
  hideHeader?: boolean;
  simData?: Record<string, SimSlot[]>;
}

function getCurrentMrtConfig(simData: Record<string, SimSlot[]>): MrtConfig[] {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return MRT_SIM_IDS.map(id => {
    const slots = simData[id] || [];
    // Find the current or most recent slot
    let currentSlot: SimSlot | null = null;
    for (const slot of slots) {
      if (!slot.unit && !slot.csi) continue;
      const [h, m] = [parseInt(slot.time.slice(0, 2)), parseInt(slot.time.slice(2))];
      const slotMinutes = h * 60 + m;
      if (slotMinutes <= currentMinutes) {
        currentSlot = slot;
      }
    }
    return {
      id,
      name: getDisplayName(id) || id.toUpperCase(),
      type: currentSlot?.csi || '--',
    };
  });
}

export function TrainerStatusPanel({ statuses, onToggle, onNoteChange, editable = false, hideHeader = false, simData }: TrainerStatusPanelProps) {
  const mrtConfigs = simData ? getCurrentMrtConfig(simData) : [];

  return (
    <div className="bg-sidebar-background text-sidebar-foreground p-1.5 rounded-lg space-y-1">
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

      {mrtConfigs.length > 0 && (
        <>
          <div className="bg-sidebar-accent px-1.5 py-0.5 rounded mt-1">
            <h2 className="text-xs font-bold text-center text-sidebar-foreground">MRT Config</h2>
          </div>
          <div className="space-y-0">
            {mrtConfigs.map(mrt => (
              <div key={mrt.id} className="flex items-center justify-between py-0.5">
                <span className="font-medium text-xs leading-tight">{mrt.name}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-bold leading-tight",
                  mrt.type === 'AH' ? 'bg-red-600/20 text-red-400' :
                  mrt.type === 'UH' ? 'bg-blue-600/20 text-blue-400' :
                  'bg-muted text-muted-foreground'
                )}>
                  {mrt.type}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
