import { cn } from "@/lib/utils";
import { getDirectory, type DirectoryData } from "@/lib/store";
import { useState, useEffect } from "react";

interface DirectorySidebarProps {
  className?: string;
  directoryData?: DirectoryData;
}

export function DirectorySidebar({ className, directoryData }: DirectorySidebarProps) {
  const [data, setData] = useState<DirectoryData | null>(directoryData || null);

  useEffect(() => {
    if (!directoryData) {
      setData(getDirectory());
    }
  }, [directoryData]);

  useEffect(() => {
    if (directoryData) setData(directoryData);
  }, [directoryData]);

  if (!data) return null;

  return (
    <aside className={cn("bg-sidebar-background text-sidebar-foreground p-2 rounded-lg space-y-1.5 text-xs overflow-y-auto max-h-[calc(100vh-2rem)]", className)}>
      <div className="bg-sidebar-accent px-2 py-0.5 rounded">
        <h2 className="text-xs font-bold text-center text-sidebar-foreground">MATSS Directory</h2>
      </div>
      
      <div className="text-[11px] leading-tight">
        <p className="font-semibold text-[11px]">MATSS Contact Info:</p>
        <p>{data.info.line1} • {data.info.line2}</p>
        <p>{data.info.phone}</p>
      </div>

      {data.sections.map((section) => (
        <div key={section.heading} className="space-y-0.5">
          <p className="text-amber-200 underline italic font-medium text-[11px]">{section.heading}</p>
          <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5">
            {section.contacts.map((contact, i) => (
              <div key={`${section.heading}-${i}`} className="border border-sidebar-border rounded p-1 bg-sidebar-accent/30">
                <p className="font-medium text-[11px] leading-tight">{contact.title}</p>
                {contact.name && (
                  <p className="text-[11px] leading-tight">{contact.name}{contact.callsign ? ` ${contact.callsign}` : ''}</p>
                )}
                {contact.office && <p className="text-[11px] leading-tight">Office: {contact.office}</p>}
                {contact.room && <p className="text-[11px] leading-tight">Room: {contact.room}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
