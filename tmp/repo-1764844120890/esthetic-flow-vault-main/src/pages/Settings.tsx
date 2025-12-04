import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Building2, Users, Bell, Shield, Trash2, Pencil, History } from "lucide-react";
import {
  useClinicSettings,
  useUpdateClinicSettings,
  useStaff,
  useAddStaff,
  useUpdateStaff,
  useDeleteStaff,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  useAuditLog,
} from "@/hooks/use-settings";
import { format } from "date-fns";

const Settings = () => {
  const { data: clinicSettings, isLoading: clinicLoading } = useClinicSettings();
  const { data: staff, isLoading: staffLoading } = useStaff();
  const { data: notificationPrefs, isLoading: prefsLoading } = useNotificationPreferences();
  const { data: auditLog, isLoading: auditLoading } = useAuditLog(100);

  const updateClinic = useUpdateClinicSettings();
  const addStaff = useAddStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const updatePrefs = useUpdateNotificationPreferences();

  // Clinic settings form state
  const [clinicForm, setClinicForm] = useState({
    clinic_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    website: "",
    timezone: "America/New_York",
  });

  // Staff dialog state
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [staffForm, setStaffForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "staff",
    is_active: true,
  });

  // Initialize forms when data loads
  useEffect(() => {
    if (clinicSettings) {
      setClinicForm({
        clinic_name: clinicSettings.clinic_name || "",
        email: clinicSettings.email || "",
        phone: clinicSettings.phone || "",
        address: clinicSettings.address || "",
        city: clinicSettings.city || "",
        state: clinicSettings.state || "",
        zip: clinicSettings.zip || "",
        country: clinicSettings.country || "",
        website: clinicSettings.website || "",
        timezone: clinicSettings.timezone || "America/New_York",
      });
    }
  }, [clinicSettings]);

  const handleClinicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateClinic.mutateAsync(clinicForm);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStaff) {
      await updateStaff.mutateAsync({ id: editingStaff.id, ...staffForm });
    } else {
      await addStaff.mutateAsync({ ...staffForm, user_id: null });
    }
    setStaffDialogOpen(false);
    resetStaffForm();
  };

  const handleEditStaff = (member: any) => {
    setEditingStaff(member);
    setStaffForm({
      first_name: member.first_name,
      last_name: member.last_name,
      email: member.email,
      phone: member.phone || "",
      role: member.role,
      is_active: member.is_active,
    });
    setStaffDialogOpen(true);
  };

  const handleDeleteStaff = async (id: string) => {
    if (confirm("Are you sure you want to remove this staff member?")) {
      await deleteStaff.mutateAsync(id);
    }
  };

  const resetStaffForm = () => {
    setEditingStaff(null);
    setStaffForm({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      role: "staff",
      is_active: true,
    });
  };

  const handleToggleNotification = async (field: string, value: boolean) => {
    await updatePrefs.mutateAsync({ [field]: value });
  };

  if (clinicLoading || staffLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // If no clinic settings exist, show a message
  if (!clinicSettings && !clinicLoading) {
    // Auto-create default settings
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Initializing clinic settings...</p>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your clinic profile, team, and preferences</p>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <TabsList className="bg-surface-soft">
          <TabsTrigger value="clinic" className="gap-2">
            <Building2 className="w-4 h-4" />
            Clinic Profile
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="w-4 h-4" />
            Team Management
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* Clinic Profile Tab */}
        <TabsContent value="clinic">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">Clinic Information</CardTitle>
              <CardDescription>Update your clinic's basic information and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClinicSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="clinic_name">Clinic Name *</Label>
                    <Input
                      id="clinic_name"
                      value={clinicForm.clinic_name}
                      onChange={(e) => setClinicForm({ ...clinicForm, clinic_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clinicForm.email}
                      onChange={(e) => setClinicForm({ ...clinicForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={clinicForm.phone}
                      onChange={(e) => setClinicForm({ ...clinicForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={clinicForm.website}
                      onChange={(e) => setClinicForm({ ...clinicForm, website: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    value={clinicForm.address}
                    onChange={(e) => setClinicForm({ ...clinicForm, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={clinicForm.city}
                      onChange={(e) => setClinicForm({ ...clinicForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={clinicForm.state}
                      onChange={(e) => setClinicForm({ ...clinicForm, state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={clinicForm.zip}
                      onChange={(e) => setClinicForm({ ...clinicForm, zip: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={clinicForm.country}
                      onChange={(e) => setClinicForm({ ...clinicForm, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={clinicForm.timezone} onValueChange={(value) => setClinicForm({ ...clinicForm, timezone: value })}>
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="America/Anchorage">Alaska Time</SelectItem>
                        <SelectItem value="Pacific/Honolulu">Hawaii Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateClinic.isPending}>
                    {updateClinic.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="team">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif">Team Members</CardTitle>
                <CardDescription>Manage your clinic staff and their roles</CardDescription>
              </div>
              <Dialog open={staffDialogOpen} onOpenChange={(open) => {
                setStaffDialogOpen(open);
                if (!open) resetStaffForm();
              }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingStaff ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
                    <DialogDescription>
                      {editingStaff ? "Update staff member information" : "Add a new team member to your clinic"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleStaffSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={staffForm.first_name}
                          onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={staffForm.last_name}
                          onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff_email">Email *</Label>
                      <Input
                        id="staff_email"
                        type="email"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="staff_phone">Phone</Label>
                      <Input
                        id="staff_phone"
                        value={staffForm.phone}
                        onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={staffForm.role} onValueChange={(value) => setStaffForm({ ...staffForm, role: value })}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="provider">Provider</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="is_active">Active</Label>
                      <Switch
                        id="is_active"
                        checked={staffForm.is_active}
                        onCheckedChange={(checked) => setStaffForm({ ...staffForm, is_active: checked })}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setStaffDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addStaff.isPending || updateStaff.isPending}>
                        {(addStaff.isPending || updateStaff.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingStaff ? "Update" : "Add"} Staff
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff && staff.length > 0 ? (
                    staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.first_name} {member.last_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell className="text-muted-foreground">{member.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={member.role === "admin" ? "default" : "secondary"} className="capitalize">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.is_active ? "default" : "secondary"}>
                            {member.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditStaff(member)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:text-destructive"
                              onClick={() => handleDeleteStaff(member.id)}
                              disabled={deleteStaff.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No staff members yet. Add your first team member above.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_appointments">Appointment Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive emails about new and updated appointments</p>
                    </div>
                    <Switch
                      id="email_appointments"
                      checked={notificationPrefs?.email_appointments ?? true}
                      onCheckedChange={(checked) => handleToggleNotification("email_appointments", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_reminders">Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Get reminders before scheduled appointments</p>
                    </div>
                    <Switch
                      id="email_reminders"
                      checked={notificationPrefs?.email_reminders ?? true}
                      onCheckedChange={(checked) => handleToggleNotification("email_reminders", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_inventory_alerts">Inventory Alerts</Label>
                      <p className="text-sm text-muted-foreground">Alerts for low stock and expiring products</p>
                    </div>
                    <Switch
                      id="email_inventory_alerts"
                      checked={notificationPrefs?.email_inventory_alerts ?? true}
                      onCheckedChange={(checked) => handleToggleNotification("email_inventory_alerts", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email_reports">Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">Summary of treatments and financials</p>
                    </div>
                    <Switch
                      id="email_reports"
                      checked={notificationPrefs?.email_reports ?? false}
                      onCheckedChange={(checked) => handleToggleNotification("email_reports", checked)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-4">SMS Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_appointments">Appointment Updates</Label>
                      <p className="text-sm text-muted-foreground">SMS alerts for appointment changes</p>
                    </div>
                    <Switch
                      id="sms_appointments"
                      checked={notificationPrefs?.sms_appointments ?? false}
                      onCheckedChange={(checked) => handleToggleNotification("sms_appointments", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms_reminders">Appointment Reminders</Label>
                      <p className="text-sm text-muted-foreground">Text reminders before appointments</p>
                    </div>
                    <Switch
                      id="sms_reminders"
                      checked={notificationPrefs?.sms_reminders ?? false}
                      onCheckedChange={(checked) => handleToggleNotification("sms_reminders", checked)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-4">In-App Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="in_app_all">All Notifications</Label>
                      <p className="text-sm text-muted-foreground">Show all in-app notifications</p>
                    </div>
                    <Switch
                      id="in_app_all"
                      checked={notificationPrefs?.in_app_all ?? true}
                      onCheckedChange={(checked) => handleToggleNotification("in_app_all", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Change Password</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input id="current_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input id="new_password" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input id="confirm_password" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold mb-4">Two-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add an extra layer of security to your account
                </p>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="audit">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">Audit Log</CardTitle>
              <CardDescription>View all system changes and who made them</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : auditLog && auditLog.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Table</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Record ID</TableHead>
                        <TableHead>Changed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLog.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(entry.changed_at), "MMM dd, yyyy HH:mm:ss")}
                          </TableCell>
                          <TableCell className="font-medium capitalize">
                            {entry.table_name.replace("_", " ")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                entry.action === "INSERT"
                                  ? "default"
                                  : entry.action === "UPDATE"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {entry.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {entry.record_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.changed_by ? entry.changed_by.slice(0, 8) + "..." : "System"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No audit log entries yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;

