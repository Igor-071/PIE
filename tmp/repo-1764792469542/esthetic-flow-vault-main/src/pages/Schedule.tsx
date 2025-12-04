import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Clock, User, Edit, Trash2, Loader2, CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import {
  useAppointments,
  useAppointmentsByDateRange,
  useAppointmentStats,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  type NewAppointmentInput,
  type Appointment,
  type AppointmentStatus,
} from "@/hooks/use-appointments";
import { usePatients } from "@/hooks/use-patients";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameDay } from "date-fns";

const initialFormState: NewAppointmentInput = {
  patientId: "",
  appointmentDate: "",
  appointmentType: "",
  durationMinutes: 60,
  notes: "",
  status: "scheduled",
};

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const monthStart = selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date());
  const monthEnd = selectedDate ? endOfMonth(selectedDate) : endOfMonth(new Date());

  const { data: appointments, isLoading } = useAppointmentsByDateRange(monthStart.toISOString(), monthEnd.toISOString());
  const stats = useAppointmentStats(appointments);
  const { data: patients } = usePatients();
  const { mutateAsync: createAppointment, isPending: isCreating } = useCreateAppointment();
  const { mutateAsync: updateAppointment, isPending: isUpdating } = useUpdateAppointment();
  const { mutateAsync: deleteAppointment, isPending: isDeleting } = useDeleteAppointment();

  const dayAppointments = selectedDate
    ? appointments?.filter((apt) => isSameDay(new Date(apt.appointment_date), selectedDate)) ?? []
    : [];

  const handleInputChange = (field: keyof NewAppointmentInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSelectChange = (field: keyof NewAppointmentInput) => (value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingAppointment(null);
  };

  const handleCreateAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.patientId || !formState.appointmentDate || !formState.appointmentType) return;

    try {
      await createAppointment(formState);
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setFormState({
      patientId: appointment.patient_id,
      appointmentDate: format(new Date(appointment.appointment_date), "yyyy-MM-dd'T'HH:mm"),
      appointmentType: appointment.appointment_type,
      durationMinutes: appointment.duration_minutes ?? 60,
      notes: appointment.notes ?? "",
      status: appointment.status as AppointmentStatus,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateAppointment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAppointment) return;

    try {
      await updateAppointment({
        id: editingAppointment.id,
        appointmentDate: formState.appointmentDate,
        appointmentType: formState.appointmentType,
        durationMinutes: formState.durationMinutes,
        status: formState.status,
        notes: formState.notes,
      });
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this appointment?")) return;
    try {
      await deleteAppointment(id);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleQuickStatusChange = async (appointment: Appointment, newStatus: AppointmentStatus) => {
    try {
      await updateAppointment({
        id: appointment.id,
        status: newStatus,
      });
    } catch (error) {
      // Toast handled in hook
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    const variants: Record<AppointmentStatus, { variant: any; label: string; icon?: any }> = {
      scheduled: { variant: "outline", label: "Scheduled" },
      confirmed: { variant: "default", label: "Confirmed", icon: CheckCircle2 },
      in_progress: { variant: "default", label: "In Progress", icon: Clock },
      completed: { variant: "secondary", label: "Completed", icon: CheckCircle2 },
      cancelled: { variant: "destructive", label: "Cancelled", icon: XCircle },
      no_show: { variant: "destructive", label: "No Show", icon: XCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {config.label}
      </Badge>
    );
  };

  const appointmentDates = appointments?.map(apt => new Date(apt.appointment_date)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Schedule</h1>
          <p className="text-muted-foreground">Manage appointments and clinic calendar</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="luxury" className="gap-2">
              <Plus className="w-4 h-4" />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Schedule Appointment</DialogTitle>
              <DialogDescription>Book a new appointment for a patient</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Select value={formState.patientId} onValueChange={handleSelectChange("patientId")} required>
                  <SelectTrigger id="patient">
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
                  <Label htmlFor="appointmentDate">Date & Time *</Label>
                  <Input
                    id="appointmentDate"
                    type="datetime-local"
                    value={formState.appointmentDate}
                    onChange={handleInputChange("appointmentDate")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formState.durationMinutes}
                    onChange={handleInputChange("durationMinutes")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointmentType">Appointment Type *</Label>
                <Select value={formState.appointmentType} onValueChange={handleSelectChange("appointmentType")} required>
                  <SelectTrigger id="appointmentType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Treatment">Treatment</SelectItem>
                    <SelectItem value="Follow-up">Follow-up</SelectItem>
                    <SelectItem value="Procedure">Procedure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formState.notes}
                  onChange={handleInputChange("notes")}
                  placeholder="Additional notes..."
                  className="min-h-[80px]"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Schedule
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-accent/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Appointments</h3>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-4xl font-serif font-semibold text-foreground">{isLoading ? "…" : stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </Card>
        
        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Today</h3>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-4xl font-serif font-semibold text-primary">{isLoading ? "…" : stats.today}</p>
          <p className="text-xs text-muted-foreground mt-1">Scheduled</p>
        </Card>

        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-accent/10 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Upcoming</h3>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <p className="text-4xl font-serif font-semibold text-foreground">{isLoading ? "…" : stats.upcoming}</p>
          <p className="text-xs text-muted-foreground mt-1">Next 7 days</p>
        </Card>

        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-green-500/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-4xl font-serif font-semibold text-green-600">{isLoading ? "…" : stats.completed}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card variant="elevated" className="lg:col-span-1 border-border/50">
          <CardHeader>
            <CardTitle className="font-serif">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              modifiers={{
                hasAppointment: appointmentDates,
              }}
              modifiersStyles={{
                hasAppointment: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                },
              }}
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="font-medium">Selected: {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "None"}</p>
              <p className="mt-1">{dayAppointments.length} appointment{dayAppointments.length !== 1 ? "s" : ""}</p>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated" className="lg:col-span-2 border-border/50">
          <CardHeader>
            <CardTitle className="font-serif">
              {selectedDate ? `Appointments for ${format(selectedDate, "MMMM d, yyyy")}` : "Appointments"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
            ) : dayAppointments.length > 0 ? (
              <div className="space-y-3">
                {dayAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 rounded-lg border border-border/50 bg-surface-soft/30 hover:bg-surface-soft/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-primary" />
                          <h4 className="font-semibold text-foreground">
                            {appointment.patients?.first_name} {appointment.patients?.last_name}
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">{appointment.appointment_type}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(appointment.appointment_date), "h:mm a")}</span>
                          <span>·</span>
                          <span>{appointment.duration_minutes} min</span>
                        </div>
                        {appointment.notes && (
                          <p className="text-xs text-muted-foreground mt-2">{appointment.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(appointment.status as AppointmentStatus)}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditClick(appointment)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:text-destructive"
                            onClick={() => handleDelete(appointment.id)}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {appointment.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleQuickStatusChange(appointment, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}
                      {(appointment.status === "scheduled" || appointment.status === "confirmed") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleQuickStatusChange(appointment, "in_progress")}
                        >
                          Start
                        </Button>
                      )}
                      {appointment.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => handleQuickStatusChange(appointment, "completed")}
                        >
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {selectedDate ? "No appointments scheduled for this day." : "Select a date to view appointments."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Appointment</DialogTitle>
            <DialogDescription>Update appointment details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateAppointment} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <Input value={editingAppointment?.patients?.first_name + " " + editingAppointment?.patients?.last_name} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDate">Date & Time *</Label>
                <Input
                  id="editDate"
                  type="datetime-local"
                  value={formState.appointmentDate}
                  onChange={handleInputChange("appointmentDate")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDuration">Duration (minutes)</Label>
                <Input
                  id="editDuration"
                  type="number"
                  min="15"
                  step="15"
                  value={formState.durationMinutes}
                  onChange={handleInputChange("durationMinutes")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editType">Appointment Type *</Label>
              <Select value={formState.appointmentType} onValueChange={handleSelectChange("appointmentType")} required>
                <SelectTrigger id="editType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Treatment">Treatment</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Procedure">Procedure</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select value={formState.status} onValueChange={handleSelectChange("status")}>
                <SelectTrigger id="editStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editNotes">Notes</Label>
              <Textarea
                id="editNotes"
                value={formState.notes}
                onChange={handleInputChange("notes")}
                className="min-h-[80px]"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;

