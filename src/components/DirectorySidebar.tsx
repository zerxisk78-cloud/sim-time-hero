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
      <div className="bg-sidebar-accent px-3 py-2 rounded">
        <h2 className="text-lg font-bold text-center text-sidebar-foreground">MATSS Directory</h2>
      </div>
      
      <div className="space-y-1">
        <p className="font-semibold">MATSS Contact Information:</p>
        <p>{data.info.line1}</p>
        <p>{data.info.line2}</p>
        <p>{data.info.phone}</p>
      </div>

      {data.sections.map((section) => (
        <div key={section.heading} className="space-y-3">
          <p className="text-amber-200 underline italic font-medium">{section.heading}</p>
          {section.contacts.map((contact, i) => (
            <div key={`${section.heading}-${i}`} className="space-y-0.5">
              <p className="font-medium">{contact.title}</p>
              {contact.name && (
                <p>{contact.name}{contact.callsign ? ` ${contact.callsign}` : ''}</p>
              )}
              {contact.office && <p>Office: {contact.office}</p>}
              {contact.room && <p>Room: {contact.room}</p>}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
