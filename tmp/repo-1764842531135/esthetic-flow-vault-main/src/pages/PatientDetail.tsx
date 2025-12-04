import { useParams, Link } from "react-router-dom";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Phone, Mail, MapPin, Syringe, FileText, Package, Activity, Shield, Loader2, Plus, Upload, Download, Trash2, Image } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  usePatientProfile,
  usePatientTreatments,
  usePatientImplants,
  usePatientStats,
  useCreateTreatment,
  useRegisterImplant,
} from "@/hooks/use-patient-detail";
import { useTemplates } from "@/hooks/use-templates";
import { usePatientDocuments, useUploadDocument, useDeleteDocument, getDocumentUrl } from "@/hooks/use-documents";
import { usePatientPhotos, useUploadPhoto, useDeletePhoto, getPhotoUrl } from "@/hooks/use-treatment-photos";

const initialTreatmentForm = {
  treatmentType: "",
  treatmentDate: "",
  productName: "",
  lotNumber: "",
  unitsUsed: "",
  providerId: "",
  notes: "",
};

const initialImplantForm = {
  deviceName: "",
  implantDate: "",
  manufacturer: "",
  lotNumber: "",
  bodySide: "",
  modelNumber: "",
  serialNumber: "",
  udi: "",
  warrantyExpiration: "",
};

const PatientDetail = () => {
  const { id } = useParams();
  const patientId = id ?? "";

  const { data: patient, isLoading: patientLoading } = usePatientProfile(patientId);
  const { data: treatments, isLoading: treatmentsLoading } = usePatientTreatments(patientId);
  const { data: implants, isLoading: implantsLoading } = usePatientImplants(patientId);
  const { data: templates } = useTemplates();
  const { data: documents, isLoading: documentsLoading } = usePatientDocuments(patientId);
  const { data: photos, isLoading: photosLoading } = usePatientPhotos(patientId);
  const stats = usePatientStats(treatments, implants);

  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [implantDialogOpen, setImplantDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [treatmentForm, setTreatmentForm] = useState(initialTreatmentForm);
  const [implantForm, setImplantForm] = useState(initialImplantForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("medical_record");
  const [documentDescription, setDocumentDescription] = useState("");
  const [photoType, setPhotoType] = useState<"before" | "after" | "during">("before");
  const [photoNotes, setPhotoNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const createTreatment = useCreateTreatment();
  const registerImplant = useRegisterImplant();
  const { mutateAsync: uploadDocument, isPending: isUploadingDoc } = useUploadDocument();
  const { mutateAsync: deleteDocument, isPending: isDeletingDoc } = useDeleteDocument();
  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } = useUploadPhoto();
  const { mutateAsync: deletePhoto, isPending: isDeletingPhoto } = useDeletePhoto();

  const loading = patientLoading || !patient;

  const handleTreatmentChange = (field: keyof typeof treatmentForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTreatmentForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (!template) return;

    setTreatmentForm((prev) => ({
      ...prev,
      treatmentType: "",
      productName: "",
      notes: "",
    }));
  };

  const handleImplantChange = (field: keyof typeof implantForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setImplantForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmitTreatment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!patientId) return;
    await createTreatment.mutateAsync({
      patientId,
      treatmentType: treatmentForm.treatmentType,
      treatmentDate: treatmentForm.treatmentDate,
      productName: treatmentForm.productName || undefined,
      lotNumber: treatmentForm.lotNumber || undefined,
      unitsUsed: treatmentForm.unitsUsed ? Number(treatmentForm.unitsUsed) : undefined,
      providerId: treatmentForm.providerId || undefined,
      notes: treatmentForm.notes || undefined,
    });
    setTreatmentDialogOpen(false);
    setTreatmentForm(initialTreatmentForm);
  };

  const handleSubmitImplant = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!patientId) return;
    await registerImplant.mutateAsync({
      patientId,
      deviceName: implantForm.deviceName,
      implantDate: implantForm.implantDate,
      manufacturer: implantForm.manufacturer,
      lotNumber: implantForm.lotNumber,
      bodySide: implantForm.bodySide || undefined,
      modelNumber: implantForm.modelNumber || undefined,
      serialNumber: implantForm.serialNumber || undefined,
      udi: implantForm.udi || undefined,
      warrantyExpiration: implantForm.warrantyExpiration || undefined,
    });
    setImplantDialogOpen(false);
    setImplantForm(initialImplantForm);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDocumentUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !patientId) return;

    try {
      await uploadDocument({
        patientId,
        file: selectedFile,
        documentType,
        description: documentDescription || undefined,
      });
      setSelectedFile(null);
      setDocumentDescription("");
      setDocumentDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handlePhotoUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile || !patientId) return;

    try {
      await uploadPhoto({
        patientId,
        file: selectedFile,
        photoType,
        notes: photoNotes || undefined,
      });
      setSelectedFile(null);
      setPhotoNotes("");
      setPhotoDialogOpen(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleDeleteDocument = async (doc: any) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(doc);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleDeletePhoto = async (photo: any) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    try {
      await deletePhoto(photo);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const formatDate = (value?: string | null, fallback = "—") => {
    if (!value) return fallback;
    return new Date(value).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/patients">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-foreground">
            {patient?.first_name} {patient?.last_name}
          </h1>
          <p className="text-muted-foreground text-sm">Patient ID: {patient?.id}</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={implantDialogOpen} onOpenChange={setImplantDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Register Implant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle className="font-serif">Register Implant</DialogTitle>
                <DialogDescription>Document implant details for traceability.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitImplant} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Device Name</label>
                    <Input value={implantForm.deviceName} onChange={handleImplantChange("deviceName")} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Implant Date</label>
                    <Input type="date" value={implantForm.implantDate} onChange={handleImplantChange("implantDate")} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Manufacturer</label>
                    <Input value={implantForm.manufacturer} onChange={handleImplantChange("manufacturer")} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Lot Number</label>
                    <Input value={implantForm.lotNumber} onChange={handleImplantChange("lotNumber")} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Body Side</label>
                    <Input value={implantForm.bodySide} onChange={handleImplantChange("bodySide")} placeholder="Left / Right / Bilateral" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Model Number</label>
                    <Input value={implantForm.modelNumber} onChange={handleImplantChange("modelNumber")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Serial Number</label>
                    <Input value={implantForm.serialNumber} onChange={handleImplantChange("serialNumber")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">UDI</label>
                    <Input value={implantForm.udi} onChange={handleImplantChange("udi")} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Warranty Expiration</label>
                    <Input type="date" value={implantForm.warrantyExpiration} onChange={handleImplantChange("warrantyExpiration")} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setImplantDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={registerImplant.isPending}>
                    {registerImplant.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Implant
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2">
                <Syringe className="w-4 h-4" />
                New Treatment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif">Add Treatment</DialogTitle>
                <DialogDescription>Log the treatment you performed today.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmitTreatment} className="space-y-4">
                {templates && templates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="template">Load from Template (optional)</Label>
                    <Select onValueChange={handleTemplateSelect}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Choose a protocol..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Selecting a template will pre-fill treatment details below</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="treatmentType">Treatment Type *</Label>
                    <Input id="treatmentType" value={treatmentForm.treatmentType} onChange={handleTreatmentChange("treatmentType")} required placeholder="Botox Face" />
                  </div>
                  <div>
                    <Label htmlFor="treatmentDate">Treatment Date *</Label>
                    <Input id="treatmentDate" type="datetime-local" value={treatmentForm.treatmentDate} onChange={handleTreatmentChange("treatmentDate")} required />
                  </div>
                  <div>
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" value={treatmentForm.productName} onChange={handleTreatmentChange("productName")} placeholder="Allergan Botox" />
                  </div>
                  <div>
                    <Label htmlFor="lotNumber">Lot Number</Label>
                    <Input id="lotNumber" value={treatmentForm.lotNumber} onChange={handleTreatmentChange("lotNumber")} />
                  </div>
                  <div>
                    <Label htmlFor="unitsUsed">Units Used</Label>
                    <Input id="unitsUsed" type="number" value={treatmentForm.unitsUsed} onChange={handleTreatmentChange("unitsUsed")} min="0" />
                  </div>
                  <div>
                    <Label htmlFor="providerId">Provider</Label>
                    <Input id="providerId" value={treatmentForm.providerId} onChange={handleTreatmentChange("providerId")} placeholder="Optional provider ID" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="treatmentNotes">Notes</Label>
                  <Textarea id="treatmentNotes" value={treatmentForm.notes} onChange={handleTreatmentChange("notes")} placeholder="Areas treated, dosage, observations..." />
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setTreatmentDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTreatment.isPending}>
                    {createTreatment.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Treatment
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Date of Birth</p>
                <p className="text-muted-foreground">{formatDate(patient?.date_of_birth)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground">{patient?.phone ?? "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-muted-foreground">{patient?.email ?? "—"}</p>
              </div>
            </div>
            {patient?.medical_history && (
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Medical Notes</p>
                  <p className="text-muted-foreground">{patient.medical_history}</p>
                </div>
              </div>
            )}
            {patient?.allergies && (
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Allergies</p>
                  <p className="text-muted-foreground">{patient.allergies}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Treatment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-semibold text-foreground">{stats.totalTreatments}</p>
              <p className="text-sm text-muted-foreground">Total Treatments</p>
            </div>
            <div>
              <p className="text-3xl font-semibold text-foreground">{stats.activeImplants}</p>
              <p className="text-sm text-muted-foreground">Active Implants</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Visit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-xl font-semibold text-foreground">{stats.lastTreatmentDate ? formatDate(stats.lastTreatmentDate, "No visits yet") : "No visits yet"}</p>
            {treatments && treatments[0] && (
              <>
                <p className="text-muted-foreground">{treatments[0].treatment_type}</p>
                {treatments[0].product_name && (
                  <p className="text-muted-foreground">Product: {treatments[0].product_name}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="treatments" className="space-y-6">
        <TabsList className="bg-surface-soft">
          <TabsTrigger value="treatments">Treatment History</TabsTrigger>
          <TabsTrigger value="implants">Implants</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="treatments">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Treatment History</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setTreatmentDialogOpen(true)}>
                Log Treatment
              </Button>
            </CardHeader>
            <CardContent>
              {treatmentsLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading treatments...</div>
              ) : treatments && treatments.length > 0 ? (
                <div className="space-y-4">
                  {treatments.map((treatment) => (
                    <div key={treatment.id} className="p-4 rounded-lg border border-border/50 hover:bg-surface-soft/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{treatment.treatment_type}</h4>
                          <p className="text-sm text-muted-foreground">{treatment.product_name || "—"}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(treatment.treatment_date)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {treatment.units_used && (
                          <span className="text-muted-foreground">
                            Units: <span className="font-medium text-foreground">{treatment.units_used}</span>
                          </span>
                        )}
                        {treatment.lot_number && (
                          <span className="text-muted-foreground">
                            Lot: <span className="font-medium text-foreground">{treatment.lot_number}</span>
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          Provider: <span className="font-medium text-foreground">{treatment.profiles?.full_name ?? "—"}</span>
                        </span>
                      </div>
                      {treatment.notes && (
                        <p className="text-sm text-muted-foreground mt-2 border-t border-border/40 pt-2">{treatment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">No treatments recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="implants">
          <Card className="border-border/50">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Implant Registry</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setImplantDialogOpen(true)}>
                Register Implant
              </Button>
            </CardHeader>
            <CardContent>
              {implantsLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading implants...</div>
              ) : implants && implants.length > 0 ? (
                <div className="space-y-4">
                  {implants.map((implant) => {
                    const warrantyStatus = (() => {
                      if (!implant.warranty_expiration) return "No warranty";
                      const remaining = new Date(implant.warranty_expiration).getTime() - Date.now();
                      if (remaining < 0) return "Expired";
                      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
                      return `${days} days left`;
                    })();
                    return (
                      <div key={implant.id} className="p-4 rounded-lg border border-border/50 bg-surface-soft/30">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-foreground">{implant.device_name}</h4>
                            <p className="text-sm text-muted-foreground">{implant.manufacturer}</p>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(implant.implant_date)}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Package className="w-4 h-4" />
                            Lot: <span className="font-medium text-foreground">{implant.lot_number}</span>
                          </div>
                          {implant.body_side && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Activity className="w-4 h-4" />
                              Side: <span className="font-medium text-foreground capitalize">{implant.body_side}</span>
                            </div>
                          )}
                          {implant.serial_number && (
                            <div className="text-muted-foreground">
                              Serial: <span className="font-medium text-foreground">{implant.serial_number}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            Warranty: <span className="font-medium text-foreground">{warrantyStatus}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">No implants recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif">Photos</CardTitle>
              <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Photo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif">Upload Treatment Photo</DialogTitle>
                    <DialogDescription>Upload before/after/during treatment photos</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePhotoUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="photoFile">Photo File *</Label>
                      <Input
                        id="photoFile"
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        required
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photoType">Photo Type *</Label>
                      <Select value={photoType} onValueChange={(value: any) => setPhotoType(value)}>
                        <SelectTrigger id="photoType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="before">Before</SelectItem>
                          <SelectItem value="during">During</SelectItem>
                          <SelectItem value="after">After</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="photoNotes">Notes</Label>
                      <Textarea
                        id="photoNotes"
                        value={photoNotes}
                        onChange={(e) => setPhotoNotes(e.target.value)}
                        placeholder="Optional notes about this photo..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setPhotoDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingPhoto || !selectedFile}>
                        {isUploadingPhoto && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Upload
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {photosLoading ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
              ) : photos && photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-border/50 bg-surface-soft/30">
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt={photo.photo_type}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <Badge variant="default" className="capitalize">{photo.photo_type}</Badge>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(getPhotoUrl(photo.storage_path), "_blank")}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeletePhoto(photo)}
                            disabled={isDeletingPhoto}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {photo.notes && (
                        <div className="p-2 text-xs text-muted-foreground truncate">
                          {photo.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p>No photos uploaded yet.</p>
                  <p className="text-sm mt-1">Upload before/after treatment photos above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-serif">Documents & Consent Forms</CardTitle>
              <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-xl">
                  <DialogHeader>
                    <DialogTitle className="font-serif">Upload Document</DialogTitle>
                    <DialogDescription>Upload consent forms, records, or other patient documents</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleDocumentUpload} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="docFile">Document File *</Label>
                      <Input
                        id="docFile"
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        required
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docType">Document Type *</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger id="docType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consent_form">Consent Form</SelectItem>
                          <SelectItem value="medical_record">Medical Record</SelectItem>
                          <SelectItem value="insurance">Insurance</SelectItem>
                          <SelectItem value="photo">Photo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="docDescription">Description</Label>
                      <Textarea
                        id="docDescription"
                        value={documentDescription}
                        onChange={(e) => setDocumentDescription(e.target.value)}
                        placeholder="Optional description..."
                        className="min-h-[80px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setDocumentDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingDoc || !selectedFile}>
                        {isUploadingDoc && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Upload
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 rounded-lg border border-border/50 bg-surface-soft/30 flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground">{doc.file_name}</h4>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="capitalize">
                              {doc.document_type.replace("_", " ")}
                            </Badge>
                            <span>{formatFileSize(doc.file_size)}</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getDocumentUrl(doc.storage_path), "_blank")}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:text-destructive"
                          onClick={() => handleDeleteDocument(doc)}
                          disabled={isDeletingDoc}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
                  <p>No documents uploaded yet.</p>
                  <p className="text-sm mt-1">Upload consent forms, medical records, or other files above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PatientDetail;
