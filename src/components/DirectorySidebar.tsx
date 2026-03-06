import { cn } from "@/lib/utils";

interface DirectoryContact {
  title: string;
  name?: string;
  callsign?: string;
  office?: string;
  room?: string;
}

interface DirectorySection {
  heading: string;
  contacts: DirectoryContact[];
}

const sections: DirectorySection[] = [
  {
    heading: "1st Floor",
    contacts: [
      { title: "OIC - (AH-1Z FLSE)", name: 'Maj B. Hough', callsign: '"Monk"', office: "(760) 725-8048", room: "108" },
      { title: "MV-22 FLSE", name: 'Maj B. Holloway', callsign: '"Cherry Boi"', office: "(760) 763-5107", room: "110" },
      { title: "UH-1Y FLSE", name: 'Maj A. Snell', callsign: '"Tipper"', office: "(760) 763-5107", room: "110" },
      { title: "Crew Chief Training", name: "SSgt. W. Kyllo", office: "(760) 763-5107", room: "110" },
      { title: "COMS COR", name: "Rob McChesney", office: "(760) 725-8047", room: "107" },
    ],
  },
  {
    heading: "2nd Floor",
    contacts: [
      { title: "MATSS Operations", office: "(760) 725-8278", room: "225" },
      { title: "NiteLab Admin", office: "(760) 763-8339", room: "224" },
      { title: "NiteLab", room: "215" },
      { title: "Electronic Classroom", room: "227" },
      { title: "CSI Office", room: "206" },
      { title: "Student Check-In", room: "220" },
    ],
  },
  {
    heading: "Building 23194",
    contacts: [
      { title: "H1 CICC Office", name: "Jared Tape", office: "(760) 725-0036" },
    ],
  },
];

export function DirectorySidebar({ className }: { className?: string }) {
  return (
    <aside className={cn("bg-sidebar-background text-sidebar-foreground p-4 rounded-lg space-y-4 text-sm", className)}>
      <div className="bg-sidebar-accent px-3 py-2 rounded">
        <h2 className="text-lg font-bold text-center text-sidebar-foreground">MATSS Directory</h2>
      </div>
      
      <div className="space-y-1">
        <p className="font-semibold">MATSS Contact Information:</p>
        <p>MCAS Camp Pendleton Bldg 2394</p>
        <p>Camp Pendleton</p>
        <p>760-725-0778</p>
      </div>

      {sections.map((section) => (
        <div key={section.heading} className="space-y-3">
          <p className="text-amber-200 underline italic font-medium">{section.heading}</p>
          {section.contacts.map((contact) => (
            <div key={contact.title} className="space-y-0.5">
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
