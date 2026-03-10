import { useState, useEffect } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/data", {
          method: "GET",
          signal: AbortSignal.timeout(2000),
        });
        // If the response is JSON, server is up. If HTML, it's the SPA fallback.
        const text = await res.text();
        try {
          JSON.parse(text);
          setIsConnected(true);
        } catch {
          setIsConnected(false);
        }
      } catch {
        setIsConnected(false);
      }
    };

    check();
    const interval = setInterval(check, 15000);
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) return null;

  return (
    <div
      className={`fixed bottom-3 left-3 z-50 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium shadow-md border transition-colors ${
        isConnected
          ? "bg-green-900/80 text-green-200 border-green-700/50"
          : "bg-destructive/80 text-destructive-foreground border-destructive/50"
      }`}
      title={isConnected ? "Connected to server — data syncs across devices" : "Offline — data saved locally only"}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Server Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline Mode</span>
        </>
      )}
    </div>
  );
}
