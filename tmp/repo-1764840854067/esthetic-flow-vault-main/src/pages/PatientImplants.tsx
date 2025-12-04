import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QRCodeSVG } from "qrcode.react";
import { Calendar, Shield, Download, Activity, Plus } from "lucide-react";
import { useRegisterImplant } from "@/hooks/use-implants";
import { useToast } from "@/hooks/use-toast";

const PatientImplants = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [implants, setImplants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImplant, setSelectedImplant] = useState<any>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    deviceName: "",
    manufacturer: "",
    modelNumber: "",
    lotNumber: "",
    serialNumber: "",
    udi: "",
    implantDate: "",
    bodySide: "",
    warrantyExpiration: "",
  });
  
  const registerImplant = useRegisterImplant();

  useEffect(() => {
    if (user) {
      loadImplants();
    }
  }, [user]);

  const loadImplants = async () => {
    try {
      const { data: patientUser } = await supabase
        .from("patient_users")
        .select("patient_id")
        .eq("id", user?.id)
        .single();

      if (!patientUser?.patient_id) {
        setLoading(false);
        return;
      }

      setPatientId(patientUser.patient_id);

      const { data: implants } = await supabase
        .from("implants")
        .select("*")
        .eq("patient_id", patientUser.patient_id)
        .order("implant_date", { ascending: false });

      setImplants(implants || []);
    } catch (error) {
      console.error("Error loading implants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (value: string) => {
    setFormData({ ...formData, bodySide: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      toast({
        title: "Error",
        description: "Patient ID not found",
        variant: "destructive",
      });
      return;
    }

    try {
      await registerImplant.mutateAsync({
        patientId,
        deviceName: formData.deviceName,
        manufacturer: formData.manufacturer,
        modelNumber: formData.modelNumber || undefined,
        lotNumber: formData.lotNumber,
        serialNumber: formData.serialNumber || undefined,
        udi: formData.udi || undefined,
        implantDate: formData.implantDate,
        bodySide: formData.bodySide as "left" | "right" | "bilateral" | "n/a" | undefined,
        warrantyExpiration: formData.warrantyExpiration || undefined,
      });

      setIsDialogOpen(false);
      setFormData({
        deviceName: "",
        manufacturer: "",
        modelNumber: "",
        lotNumber: "",
        serialNumber: "",
        udi: "",
        implantDate: "",
        bodySide: "",
        warrantyExpiration: "",
      });
      loadImplants();
    } catch (error) {
      console.error("Error registering implant:", error);
    }
  };

  const getWarrantyStatus = (expirationDate: string | null) => {
    if (!expirationDate) return { text: "No warranty", color: "secondary" };

    const today = new Date();
    const expiry = new Date(expirationDate);
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { text: "Expired", color: "destructive" };
    } else if (daysUntilExpiry < 180) {
      return { text: `${daysUntilExpiry} days left`, color: "default" };
    } else {
      return { text: "Active", color: "default" };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <div className="text-center py-12">Loading your implants...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold tracking-wide">Implant Registry</h1>
          <p className="text-muted-foreground font-light">
            View and download your implant information cards
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Register Implant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Register New Implant</DialogTitle>
              <DialogDescription>
                Add your medical implant information to your personal registry
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceName">Device Name *</Label>
                  <Input
                    id="deviceName"
                    name="deviceName"
                    value={formData.deviceName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modelNumber">Model Number</Label>
                  <Input
                    id="modelNumber"
                    name="modelNumber"
                    value={formData.modelNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Lot Number *</Label>
                  <Input
                    id="lotNumber"
                    name="lotNumber"
                    value={formData.lotNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="udi">UDI</Label>
                  <Input
                    id="udi"
                    name="udi"
                    value={formData.udi}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="implantDate">Implant Date *</Label>
                  <Input
                    id="implantDate"
                    name="implantDate"
                    type="date"
                    value={formData.implantDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodySide">Body Side</Label>
                  <Select value={formData.bodySide} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select side" />
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
                  <Label htmlFor="warrantyExpiration">Warranty Expiration</Label>
                  <Input
                    id="warrantyExpiration"
                    name="warrantyExpiration"
                    type="date"
                    value={formData.warrantyExpiration}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={registerImplant.isPending}>
                  {registerImplant.isPending ? "Registering..." : "Register Implant"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {implants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {implants.map((implant) => {
            const warrantyStatus = getWarrantyStatus(implant.warranty_expiration);
            return (
              <Card
                key={implant.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br from-card via-card to-accent/10 border-border/50"
                onClick={() => setSelectedImplant(implant)}
              >
                <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/10 border-b border-border/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-serif">{implant.device_name}</CardTitle>
                      <CardDescription className="mt-1 font-light">
                        {implant.manufacturer}
                      </CardDescription>
                    </div>
                    <Activity className="w-5 h-5 text-primary/60" />
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-light">Date Implanted</span>
                    <span className="font-medium">
                      {new Date(implant.implant_date).toLocaleDateString()}
                    </span>
                  </div>
                  {implant.body_side && implant.body_side !== "n/a" && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-light">Body Side</span>
                      <Badge variant="outline" className="capitalize border-primary/30 bg-primary/5">
                        {implant.body_side}
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1 font-light">
                      <Shield className="w-3 h-3" />
                      Warranty
                    </span>
                    <Badge variant={warrantyStatus.color as any} className="shadow-sm">
                      {warrantyStatus.text}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No implants recorded yet</p>
          </CardContent>
        </Card>
      )}

      {/* Implant Detail Modal/View */}
      {selectedImplant && (
        <Card className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-2xl z-50 overflow-auto shadow-2xl border-border/50 bg-card">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-accent/10 border-b border-border/30">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-serif">{selectedImplant.device_name}</CardTitle>
                <CardDescription className="font-light">{selectedImplant.manufacturer}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImplant(null)}
                className="hover:bg-primary/10"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl border-2 border-primary/20 shadow-sm">
              <QRCodeSVG
                value={JSON.stringify({
                  id: selectedImplant.id,
                  device: selectedImplant.device_name,
                  manufacturer: selectedImplant.manufacturer,
                  lot: selectedImplant.lot_number,
                  udi: selectedImplant.udi,
                })}
                size={200}
                level="H"
                includeMargin={true}
              />
              <p className="text-xs text-muted-foreground text-center font-light">
                Scan this QR code to verify implant details
              </p>
            </div>

            {/* Implant Details */}
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground font-light">Model Number</div>
                <div className="font-medium">{selectedImplant.model_number || "N/A"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground font-light">Lot Number</div>
                <div className="font-medium">{selectedImplant.lot_number}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground font-light">Serial Number</div>
                <div className="font-medium">{selectedImplant.serial_number || "N/A"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground font-light">UDI</div>
                <div className="font-medium break-all">{selectedImplant.udi || "N/A"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-muted-foreground font-light">Implant Date</div>
                <div className="font-medium">
                  {new Date(selectedImplant.implant_date).toLocaleDateString()}
                </div>
              </div>
              {selectedImplant.warranty_expiration && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-muted-foreground font-light">Warranty Expiration</div>
                  <div className="font-medium">
                    {new Date(selectedImplant.warranty_expiration).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            <Button className="w-full shadow-sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Implant Card (PDF)
            </Button>
          </CardContent>
        </Card>
      )}

      {selectedImplant && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSelectedImplant(null)}
        />
      )}
    </div>
  );
};

export default PatientImplants;
