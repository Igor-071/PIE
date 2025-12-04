import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Edit, Trash2, Loader2, Search } from "lucide-react";
import { useTemplates, useFilteredTemplates, useAddTemplate, useUpdateTemplate, useDeleteTemplate, type NewTemplateInput, type TreatmentTemplate } from "@/hooks/use-templates";

const initialFormState: NewTemplateInput = {
  name: "",
  treatmentType: "",
  areas: [],
  unitsPerArea: {},
  productName: "",
  notes: "",
};

const Templates = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingTemplate, setEditingTemplate] = useState<TreatmentTemplate | null>(null);

  const { data: templates, isLoading } = useTemplates();
  const filteredTemplates = useFilteredTemplates(templates, searchQuery);
  const { mutateAsync: addTemplate, isPending: isAdding } = useAddTemplate();
  const { mutateAsync: updateTemplate, isPending: isUpdating } = useUpdateTemplate();
  const { mutateAsync: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  const handleInputChange = (field: keyof NewTemplateInput) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingTemplate(null);
  };

  const handleAddTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.name.trim() || !formState.treatmentType.trim()) return;

    const areasArray = formState.areas && typeof formState.areas === 'string'
      ? (formState.areas as any).split(',').map((a: string) => a.trim()).filter(Boolean)
      : formState.areas;

    try {
      await addTemplate({ ...formState, areas: areasArray });
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleEditClick = (template: TreatmentTemplate) => {
    setEditingTemplate(template);
    setFormState({
      name: template.name,
      treatmentType: "",
      areas: (template.areas as any) ?? [],
      unitsPerArea: (template.default_units ?? 0) as any,
      productName: "",
      notes: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTemplate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTemplate) return;

    const areasArray = formState.areas && typeof formState.areas === 'string'
      ? (formState.areas as any).split(',').map((a: string) => a.trim()).filter(Boolean)
      : formState.areas;

    try {
      await updateTemplate({
        id: editingTemplate.id,
        name: formState.name,
        treatmentType: formState.treatmentType,
        areas: areasArray,
        unitsPerArea: formState.unitsPerArea,
        productName: formState.productName,
        notes: formState.notes,
      });
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteTemplate(id);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const consentTemplates = [
    { id: "1", name: "Botox Treatment Consent", version: "v2.1" },
    { id: "2", name: "Dermal Filler Consent", version: "v1.8" },
    { id: "3", name: "Implant Surgery Consent", version: "v3.0" },
  ];

  const postCareTemplates = [
    { id: "1", name: "Post-Botox Instructions", category: "Injectable" },
    { id: "2", name: "Post-Filler Care", category: "Injectable" },
    { id: "3", name: "Implant Recovery", category: "Surgical" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Templates</h1>
          <p className="text-muted-foreground">Manage treatment protocols, consent forms, and post-care instructions</p>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading…
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="elevated" className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-serif">Treatment Templates</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button size="sm" variant="soft" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle className="font-serif">Create Treatment Template</DialogTitle>
                  <DialogDescription>Define a reusable protocol for common treatments</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddTemplate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formState.name}
                      onChange={handleInputChange("name")}
                      placeholder="Standard Botox - Forehead"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="treatmentType">Treatment Type *</Label>
                    <Input
                      id="treatmentType"
                      value={formState.treatmentType}
                      onChange={handleInputChange("treatmentType")}
                      placeholder="Botox, Filler, etc."
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="areas">Areas (comma-separated)</Label>
                    <Input
                      id="areas"
                      value={Array.isArray(formState.areas) ? formState.areas.join(", ") : formState.areas}
                      onChange={handleInputChange("areas")}
                      placeholder="Forehead, Glabella, Crow's Feet"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productName">Preferred Product</Label>
                    <Input
                      id="productName"
                      value={formState.productName}
                      onChange={handleInputChange("productName")}
                      placeholder="Botox 100U"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formState.notes}
                      onChange={handleInputChange("notes")}
                      placeholder="Additional details about this protocol..."
                      className="min-h-[80px]"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isAdding}>
                      {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save Template
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Loading templates...</div>
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 rounded-lg border border-border/50 hover:bg-surface-soft/50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm text-foreground">{template.name}</h4>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                        onClick={() => handleEditClick(template)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 hover:text-destructive"
                        onClick={() => handleDelete(template.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{template.name}</p>
                  {template.areas && Array.isArray(template.areas) && (template.areas as any).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">{(template.areas as any).join(", ")}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">No treatment templates yet. Create one to get started.</div>
            )}
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-serif">Consent Forms</CardTitle>
            <Button size="sm" variant="soft" className="gap-2" disabled>
              <Plus className="w-4 h-4" />
              New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {consentTemplates.map((template) => (
              <div
                key={template.id}
                className="p-3 rounded-lg border border-border/50 hover:bg-surface-soft/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h4 className="font-medium text-sm text-foreground">{template.name}</h4>
                  </div>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0" disabled>
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{template.version}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated" className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg font-serif">Post-Care Instructions</CardTitle>
            <Button size="sm" variant="soft" className="gap-2" disabled>
              <Plus className="w-4 h-4" />
              New
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {postCareTemplates.map((template) => (
              <div
                key={template.id}
                className="p-3 rounded-lg border border-border/50 hover:bg-surface-soft/50 transition-colors group"
              >
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm text-foreground">{template.name}</h4>
                  <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0" disabled>
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{template.category}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Edit Treatment Template</DialogTitle>
            <DialogDescription>Update the details of {editingTemplate?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Template Name *</Label>
              <Input
                id="editName"
                value={formState.name}
                onChange={handleInputChange("name")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editTreatmentType">Treatment Type *</Label>
              <Input
                id="editTreatmentType"
                value={formState.treatmentType}
                onChange={handleInputChange("treatmentType")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAreas">Areas (comma-separated)</Label>
              <Input
                id="editAreas"
                value={Array.isArray(formState.areas) ? formState.areas.join(", ") : formState.areas}
                onChange={handleInputChange("areas")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editProductName">Preferred Product</Label>
              <Input
                id="editProductName"
                value={formState.productName}
                onChange={handleInputChange("productName")}
              />
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

export default Templates;
