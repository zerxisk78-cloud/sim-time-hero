import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { type DirectoryData, saveDirectory } from "@/lib/store";

interface DirectoryEditorProps {
  data: DirectoryData;
  onChange: (data: DirectoryData) => void;
}

export function DirectoryEditor({ data, onChange }: DirectoryEditorProps) {
  const updateInfo = (field: keyof DirectoryData['info'], value: string) => {
    onChange({ ...data, info: { ...data.info, [field]: value } });
  };

  const updateSectionHeading = (si: number, heading: string) => {
    const sections = [...data.sections];
    sections[si] = { ...sections[si], heading };
    onChange({ ...data, sections });
  };

  const updateContact = (si: number, ci: number, field: string, value: string) => {
    const sections = [...data.sections];
    const contacts = [...sections[si].contacts];
    contacts[ci] = { ...contacts[ci], [field]: value || undefined };
    sections[si] = { ...sections[si], contacts };
    onChange({ ...data, sections });
  };

  const addContact = (si: number) => {
    const sections = [...data.sections];
    sections[si] = { ...sections[si], contacts: [...sections[si].contacts, { title: "New Position" }] };
    onChange({ ...data, sections });
  };

  const removeContact = (si: number, ci: number) => {
    const sections = [...data.sections];
    sections[si] = { ...sections[si], contacts: sections[si].contacts.filter((_, i) => i !== ci) };
    onChange({ ...data, sections });
  };

  const addSection = () => {
    onChange({ ...data, sections: [...data.sections, { heading: "New Section", contacts: [] }] });
  };

  const removeSection = (si: number) => {
    onChange({ ...data, sections: data.sections.filter((_, i) => i !== si) });
  };

  const handleSave = () => {
    saveDirectory(data);
    toast.success("Directory saved");
  };

  return (
    <Card className="mb-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base">MATSS Directory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Contact Info</p>
          <div className="grid grid-cols-3 gap-2">
            <Input value={data.info.line1} onChange={e => updateInfo('line1', e.target.value)} className="h-8 text-xs" placeholder="Address line 1" />
            <Input value={data.info.line2} onChange={e => updateInfo('line2', e.target.value)} className="h-8 text-xs" placeholder="Address line 2" />
            <Input value={data.info.phone} onChange={e => updateInfo('phone', e.target.value)} className="h-8 text-xs" placeholder="Phone" />
          </div>
        </div>

        {data.sections.map((section, si) => (
          <div key={si} className="border border-border rounded p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input value={section.heading} onChange={e => updateSectionHeading(si, e.target.value)} className="h-8 text-xs font-bold flex-1" />
              <button onClick={() => removeSection(si)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            
            {section.contacts.map((contact, ci) => (
              <div key={ci} className="grid grid-cols-6 gap-1 items-center">
                <Input value={contact.title} onChange={e => updateContact(si, ci, 'title', e.target.value)} className="h-7 text-xs col-span-1" placeholder="Title" />
                <Input value={contact.name || ''} onChange={e => updateContact(si, ci, 'name', e.target.value)} className="h-7 text-xs" placeholder="Name" />
                <Input value={contact.callsign || ''} onChange={e => updateContact(si, ci, 'callsign', e.target.value)} className="h-7 text-xs" placeholder="Callsign" />
                <Input value={contact.office || ''} onChange={e => updateContact(si, ci, 'office', e.target.value)} className="h-7 text-xs" placeholder="Office #" />
                <Input value={contact.room || ''} onChange={e => updateContact(si, ci, 'room', e.target.value)} className="h-7 text-xs" placeholder="Room" />
                <button onClick={() => removeContact(si, ci)} className="text-destructive hover:opacity-70 justify-self-center"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => addContact(si)}>
              <Plus className="h-3 w-3 mr-1" /> Add Contact
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={addSection}>
            <Plus className="h-3 w-3 mr-1" /> Add Section
          </Button>
          <Button size="sm" onClick={handleSave}>Save Directory</Button>
        </div>
      </CardContent>
    </Card>
  );
}
