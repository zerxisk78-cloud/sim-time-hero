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
    <aside className={cn("bg-sidebar-background text-sidebar-foreground p-4 rounded-lg space-y-4 text-sm", className)}>
      <div className="bg-sidebar-accent px-2 py-1 rounded">
        <h2 className="text-sm font-bold text-center text-sidebar-foreground">MATSS Directory</h2>
      </div>
      
      <div className="text-xs leading-tight">
        <p className="font-semibold text-xs">MATSS Contact Info:</p>
        <p>{data.info.line1} • {data.info.line2}</p>
        <p>{data.info.phone}</p>
      </div>

      {data.sections.map((section) => (
        <div key={section.heading} className="space-y-1">
          <p className="text-amber-200 underline italic font-medium">{section.heading}</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {section.contacts.map((contact, i) => (
              <div key={`${section.heading}-${i}`} className="space-y-0 border border-sidebar-border rounded p-1.5 bg-sidebar-accent/30">
                <p className="font-medium text-xs">{contact.title}</p>
                {contact.name && (
                  <p className="text-xs">{contact.name}{contact.callsign ? ` ${contact.callsign}` : ''}</p>
                )}
                {contact.office && <p className="text-xs">Office: {contact.office}</p>}
                {contact.room && <p className="text-xs">Room: {contact.room}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
