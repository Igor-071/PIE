import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Download, Loader2 } from "lucide-react";
import { useImplants, useRegisterImplant, type NewImplantInput } from "@/hooks/use-implants";
import { usePatients } from "@/hooks/use-patients";

const initialFormState: NewImplantInput = {
  patientId: "",
  deviceName: "",
  manufacturer: "",
  modelNumber: "",
  lotNumber: "",
  serialNumber: "",
  udi: "",
  implantDate: new Date().toISOString().split("T")[0],
  bodySide: "n/a",
  warrantyExpiration: "",
};

const Implants = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);

  const { data: implants, isLoading } = useImplants();
  const { data: patients } = usePatients();
  const { mutateAsync: registerImplant, isPending: isSaving } = useRegisterImplant();

  const filteredImplants = (implants ?? []).filter((implant: any) => {
    const patientName = `${implant.patients?.first_name ?? ""} ${implant.patients?.last_name ?? ""}`.toLowerCase();
    const term = searchQuery.toLowerCase();
    return (
      patientName.includes(term) ||
      implant.lot_number.toLowerCase().includes(term) ||
      implant.device_name.toLowerCase().includes(term)
    );
  });

  const handleInputChange = (field: keyof NewImplantInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelectChange = (field: keyof NewImplantInput) => (value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleRegisterImplant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.patientId || !formState.deviceName.trim() || !formState.lotNumber.trim()) return;

    try {
      await registerImplant(formState);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleDownloadCard = (implant: any) => {
    // Create a printable implant card
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const warrantyStatus = () => {
      if (!implant.warranty_expiration) return '<span class="warranty-badge">No warranty</span>';
      const expiry = new Date(implant.warranty_expiration);
      const today = new Date();
      const daysUntil = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        return '<span class="warranty-badge warranty-expired">Expired</span>';
      } else if (daysUntil < 180) {
        return `<span class="warranty-badge warranty-expiring">${daysUntil} days remaining</span>`;
      } else {
        return `<span class="warranty-badge warranty-active">Active until ${expiry.toLocaleDateString()}</span>`;
      }
    };

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Implant Device Card - ${implant.device_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
            .card { border: 2px solid #e5e7eb; border-radius: 12px; padding: 30px; background: white; }
            .header { border-bottom: 2px solid #d1d5db; padding-bottom: 20px; margin-bottom: 20px; }
            h1 { color: #1f2937; font-size: 24px; margin: 0 0 10px 0; }
            .subtitle { color: #6b7280; font-size: 14px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .field { margin-bottom: 15px; }
            .label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
            .value { color: #1f2937; font-size: 16px; font-weight: 500; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
            .warranty-badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 600; }
            .warranty-active { background: #dcfce7; color: #166534; }
            .warranty-expiring { background: #fef3c7; color: #92400e; }
            .warranty-expired { background: #fee2e2; color: #991b1b; }
            @media print { body { margin: 0; padding: 20px; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>Implant Device Card</h1>
              <div class="subtitle">Official device information and traceability record</div>
            </div>
            <div class="field">
              <div class="label">Patient Name</div>
              <div class="value">${implant.patients?.first_name || ''} ${implant.patients?.last_name || ''}</div>
            </div>
            <div class="grid">
              <div class="field"><div class="label">Device Name</div><div class="value">${implant.device_name}</div></div>
              <div class="field"><div class="label">Manufacturer</div><div class="value">${implant.manufacturer}</div></div>
            </div>
            <div class="grid">
              <div class="field"><div class="label">Model Number</div><div class="value">${implant.model_number || 'N/A'}</div></div>
              <div class="field"><div class="label">Lot Number</div><div class="value">${implant.lot_number}</div></div>
            </div>
            <div class="grid">
              <div class="field"><div class="label">Serial Number</div><div class="value">${implant.serial_number || 'N/A'}</div></div>
              <div class="field"><div class="label">Body Side</div><div class="value" style="text-transform: capitalize;">${implant.body_side || 'N/A'}</div></div>
            </div>
            ${implant.udi ? `<div class="field"><div class="label">UDI (Unique Device Identifier)</div><div class="value" style="font-family: monospace; font-size: 14px;">${implant.udi}</div></div>` : ''}
            <div class="grid">
              <div class="field"><div class="label">Implant Date</div><div class="value">${new Date(implant.implant_date).toLocaleDateString()}</div></div>
              <div class="field"><div class="label">Warranty Status</div><div class="value">${warrantyStatus()}</div></div>
            </div>
            <div class="footer">
              <p><strong>Important:</strong> Keep this card for warranty claims and product recalls.</p>
              <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            <div class="no-print" style="margin-top: 30px; text-align: center;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600;">Print Card</button>
              <button onclick="window.close()" style="padding: 10px 20px; background: white; color: #6b7280; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; margin-left: 10px;">Close</button>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Implant Registry</h1>
          <p className="text-muted-foreground">Track all implant records and warranties</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="luxury" className="gap-2">
              <Plus className="w-4 h-4" />
              Register Implant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Register Implant</DialogTitle>
              <DialogDescription>Record a new implant device for patient safety and traceability.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRegisterImplant} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient *</Label>
                <Select value={formState.patientId} onValueChange={handleSelectChange("patientId")} required>
                  <SelectTrigger id="patientId">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients?.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name *</Label>
                  <Input
                    id="deviceName"
                    value={formState.deviceName}
                    onChange={handleInputChange("deviceName")}
                    placeholder="Breast Implant"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formState.manufacturer}
                    onChange={handleInputChange("manufacturer")}
                    placeholder="Allergan"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modelNumber">Model Number</Label>
                  <Input
                    id="modelNumber"
                    value={formState.modelNumber}
                    onChange={handleInputChange("modelNumber")}
                    placeholder="Natrelle Inspira"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Lot Number *</Label>
                  <Input
                    id="lotNumber"
                    value={formState.lotNumber}
                    onChange={handleInputChange("lotNumber")}
                    placeholder="LOT-2024-A123"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formState.serialNumber}
                    onChange={handleInputChange("serialNumber")}
                    placeholder="AB123456789"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="udi">UDI</Label>
                  <Input
                    id="udi"
                    value={formState.udi}
                    onChange={handleInputChange("udi")}
                    placeholder="Unique Device Identifier"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="implantDate">Implant Date *</Label>
                  <Input
                    id="implantDate"
                    type="date"
                    value={formState.implantDate}
                    onChange={handleInputChange("implantDate")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodySide">Body Side</Label>
                  <Select value={formState.bodySide} onValueChange={handleSelectChange("bodySide")}>
                    <SelectTrigger id="bodySide">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="bilateral">Bilateral</SelectItem>
                      <SelectItem value="n/a">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="warrantyExpiration">Warranty Expiry</Label>
                  <Input
                    id="warrantyExpiration"
                    type="date"
                    value={formState.warrantyExpiration}
                    onChange={handleInputChange("warrantyExpiration")}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Register Implant
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="elevated" className="p-6 border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredImplants.length}</span> of{" "}
            <span className="font-semibold text-foreground">{implants?.length ?? 0}</span> implants
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading…
            </div>
          )}
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by patient name, device, or lot number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-[var(--glass-background)] backdrop-blur-sm border-[var(--glass-border)] focus:border-primary/30 focus:shadow-[var(--shadow-soft)] transition-all duration-300"
          />
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden shadow-[var(--shadow-soft)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-surface-soft to-accent/5 hover:from-surface-soft hover:to-accent/5 border-b border-border/50">
                <TableHead className="font-semibold text-foreground">Patient</TableHead>
                <TableHead className="font-semibold text-foreground">Device</TableHead>
                <TableHead className="font-semibold text-foreground">Manufacturer</TableHead>
                <TableHead className="font-semibold text-foreground">Model</TableHead>
                <TableHead className="font-semibold text-foreground">Lot Number</TableHead>
                <TableHead className="font-semibold text-foreground">Serial</TableHead>
                <TableHead className="font-semibold text-foreground">Side</TableHead>
                <TableHead className="font-semibold text-foreground">Date</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredImplants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                    {isLoading ? "Loading implants..." : "No implants match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredImplants.map((implant, index) => (
                  <TableRow
                    key={implant.id}
                    className="hover:bg-gradient-to-r hover:from-accent/5 hover:to-primary/5 transition-all duration-300 hover:shadow-[var(--shadow-soft)] border-b border-border/30 last:border-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">
                      {(implant as any).patients?.first_name} {(implant as any).patients?.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{implant.device_name}</TableCell>
                    <TableCell className="text-muted-foreground">{implant.manufacturer}</TableCell>
                    <TableCell className="text-muted-foreground">{implant.model_number ?? "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-gradient-to-br from-primary/10 to-accent/5 text-primary text-xs font-semibold shadow-[var(--shadow-soft)]">
                        {implant.lot_number}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{implant.serial_number ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground capitalize">{implant.body_side ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(implant.implant_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-2 hover:scale-105 transition-transform duration-300"
                        onClick={() => handleDownloadCard(implant)}
                      >
                        <Download className="w-4 h-4" />
                        Card
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default Implants;
