import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Eye, Loader2, Trash2 } from "lucide-react";
import { usePatients, useAddPatient, useDeletePatient, useFilteredPatients, type NewPatientInput } from "@/hooks/use-patients";

const initialFormState: NewPatientInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  allergies: "",
  medicalHistory: "",
};

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);

  const { data: patients, isLoading } = usePatients();
  const filteredPatients = useFilteredPatients(patients, searchQuery);
  const { mutateAsync: addPatient, isPending: isSaving } = useAddPatient();
  const { mutateAsync: deletePatient, isPending: isDeleting } = useDeletePatient();

  const totalPatients = patients?.length ?? 0;

  const handleInputChange = (field: keyof NewPatientInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
  };

  const handleCreatePatient = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.firstName.trim() || !formState.lastName.trim()) return;

    try {
      await addPatient(formState);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      // Toast handled inside hook
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString();
  };

  const handleDeletePatient = async () => {
    if (!deletePatientId) return;
    try {
      await deletePatient(deletePatientId);
      setDeletePatientId(null);
    } catch (error) {
      // Toast handled inside hook
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Patients</h1>
          <p className="text-muted-foreground">Manage your patient records</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="luxury" className="gap-2">
              <Plus className="w-4 h-4" />
              New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Add Patient</DialogTitle>
              <DialogDescription>Capture the basics now — you can add clinical details later.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePatient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formState.firstName}
                    onChange={handleInputChange("firstName")}
                    placeholder="Ava"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formState.lastName}
                    onChange={handleInputChange("lastName")}
                    placeholder="Hunter"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formState.email}
                    onChange={handleInputChange("email")}
                    placeholder="patient@clinic.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formState.phone}
                    onChange={handleInputChange("phone")}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formState.dateOfBirth}
                    onChange={handleInputChange("dateOfBirth")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Input
                    id="allergies"
                    value={formState.allergies}
                    onChange={handleInputChange("allergies")}
                    placeholder="Penicillin"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical Notes</Label>
                <Textarea
                  id="medicalHistory"
                  value={formState.medicalHistory}
                  onChange={handleInputChange("medicalHistory")}
                  placeholder="Relevant health information..."
                  className="min-h-[90px]"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Patient
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card variant="elevated" className="p-6 border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredPatients.length}</span> of{" "}
            <span className="font-semibold text-foreground">{totalPatients}</span> patients
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Syncing with Supabase…
            </div>
          )}
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search patients by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-[var(--glass-background)] backdrop-blur-sm border-[var(--glass-border)] focus:border-primary/30 focus:shadow-[var(--shadow-soft)] transition-all duration-300"
          />
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden shadow-[var(--shadow-soft)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-surface-soft to-accent/5 hover:from-surface-soft hover:to-accent/5 border-b border-border/50">
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead className="font-semibold text-foreground">Email</TableHead>
                <TableHead className="font-semibold text-foreground">Phone</TableHead>
                <TableHead className="font-semibold text-foreground">Date of Birth</TableHead>
                <TableHead className="font-semibold text-foreground">Created</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    {isLoading ? "Loading patients..." : "No patients match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients.map((patient, index) => (
                  <TableRow 
                    key={patient.id} 
                    className="hover:bg-gradient-to-r hover:from-accent/5 hover:to-primary/5 transition-all duration-300 hover:shadow-[var(--shadow-soft)] border-b border-border/30 last:border-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">
                      {patient.first_name} {patient.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{patient.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{patient.phone ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(patient.date_of_birth)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(patient.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/patients/${patient.id}`}>
                          <Button variant="ghost" size="sm" className="gap-2 hover:scale-105 transition-transform duration-300">
                            <Eye className="w-4 h-4" />
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2 hover:scale-105 transition-transform duration-300 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeletePatientId(patient.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AlertDialog open={!!deletePatientId} onOpenChange={(open) => !open && setDeletePatientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this patient record and all associated data (treatments, photos, documents, implants).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePatient}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Patient"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Patients;
