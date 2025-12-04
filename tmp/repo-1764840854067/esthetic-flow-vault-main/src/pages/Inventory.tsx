import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, AlertCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { useInventory, useInventoryStats, useFilteredInventory, useAddInventory, useUpdateInventory, useDeleteInventory, type NewInventoryInput, type InventoryRecord } from "@/hooks/use-inventory";

const initialFormState: NewInventoryInput = {
  productName: "",
  lotNumber: "",
  manufacturer: "",
  unitsAvailable: 0,
  expirationDate: "",
};

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formState, setFormState] = useState(initialFormState);
  const [editingItem, setEditingItem] = useState<InventoryRecord | null>(null);

  const { data: inventory, isLoading } = useInventory();
  const stats = useInventoryStats(inventory);
  const filteredInventory = useFilteredInventory(inventory, searchQuery);
  const { mutateAsync: addInventory, isPending: isAdding } = useAddInventory();
  const { mutateAsync: updateInventory, isPending: isUpdating } = useUpdateInventory();
  const { mutateAsync: deleteInventory, isPending: isDeleting } = useDeleteInventory();

  const handleInputChange = (field: keyof NewInventoryInput) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingItem(null);
  };

  const handleAddProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formState.productName.trim() || !formState.lotNumber.trim()) return;

    try {
      await addInventory(formState);
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleEditClick = (item: InventoryRecord) => {
    setEditingItem(item);
    setFormState({
      productName: item.product_name,
      lotNumber: item.lot_number,
      manufacturer: item.manufacturer ?? "",
      unitsAvailable: item.units_available,
      expirationDate: item.expiration_date,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingItem) return;

    try {
      await updateInventory({
        id: editingItem.id,
        unitsAvailable: formState.unitsAvailable,
        expirationDate: formState.expirationDate,
      });
      resetForm();
      setIsEditDialogOpen(false);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      await deleteInventory(id);
    } catch (error) {
      // Toast handled in hook
    }
  };

  const getStatusBadge = (item: InventoryRecord) => {
    const now = new Date();
    const expiry = new Date(item.expiration_date);
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(now.getDate() + 30);

    const isExpiring = expiry <= thirtyDaysOut && expiry >= now;
    const isLowStock = item.units_available < 5;

    if (isExpiring) {
      return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Expiring Soon</Badge>;
    }
    if (isLowStock) {
      return <Badge variant="outline" className="border-primary text-primary">Low Stock</Badge>;
    }
    return <Badge variant="secondary">In Stock</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Inventory</h1>
          <p className="text-muted-foreground">Track products, lots, and expiry dates</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="lg" variant="luxury" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="font-serif">Add Inventory</DialogTitle>
              <DialogDescription>Add a new product or lot to inventory</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={formState.productName}
                    onChange={handleInputChange("productName")}
                    placeholder="Botox 100U"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formState.manufacturer}
                    onChange={handleInputChange("manufacturer")}
                    placeholder="Allergan"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="unitsAvailable">Units Available *</Label>
                  <Input
                    id="unitsAvailable"
                    type="number"
                    min="0"
                    value={formState.unitsAvailable}
                    onChange={handleInputChange("unitsAvailable")}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date *</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formState.expirationDate}
                  onChange={handleInputChange("expirationDate")}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Product
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-accent/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Products</h3>
          </div>
          <p className="text-4xl font-serif font-semibold text-foreground">{isLoading ? "…" : stats.total}</p>
          <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
        </Card>
        
        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Low Stock Items</h3>
          </div>
          <p className="text-4xl font-serif font-semibold text-primary">{isLoading ? "…" : stats.lowStock}</p>
          <p className="text-xs text-muted-foreground mt-1">Need reordering</p>
        </Card>

        <Card variant="gradient" className="p-6 border-border/50 bg-gradient-to-br from-card via-destructive/5 to-transparent">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Expiring Soon</h3>
          </div>
          <p className="text-4xl font-serif font-semibold text-destructive">{isLoading ? "…" : stats.expiringSoon}</p>
          <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
        </Card>
      </div>

      <Card variant="elevated" className="p-6 border-border/50">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredInventory.length}</span> of{" "}
            <span className="font-semibold text-foreground">{inventory?.length ?? 0}</span> products
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
            placeholder="Search by product name or lot number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 bg-[var(--glass-background)] backdrop-blur-sm border-[var(--glass-border)] focus:border-primary/30 focus:shadow-[var(--shadow-soft)] transition-all duration-300"
          />
        </div>

        <div className="rounded-lg border border-border/50 overflow-hidden shadow-[var(--shadow-soft)]">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-surface-soft to-accent/5 hover:from-surface-soft hover:to-accent/5 border-b border-border/50">
                <TableHead className="font-semibold text-foreground">Product</TableHead>
                <TableHead className="font-semibold text-foreground">Manufacturer</TableHead>
                <TableHead className="font-semibold text-foreground">Lot Number</TableHead>
                <TableHead className="font-semibold text-foreground text-center">Units</TableHead>
                <TableHead className="font-semibold text-foreground">Expiry Date</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    {isLoading ? "Loading inventory..." : "No inventory items match your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item, index) => (
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-gradient-to-r hover:from-accent/5 hover:to-primary/5 transition-all duration-300 hover:shadow-[var(--shadow-soft)] border-b border-border/30 last:border-0"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.manufacturer ?? "—"}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-gradient-to-br from-primary/10 to-accent/5 text-primary text-xs font-semibold shadow-[var(--shadow-soft)]">
                        {item.lot_number}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-surface-soft to-accent/10 text-foreground text-sm font-semibold shadow-[var(--shadow-soft)]">
                        {item.units_available}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.expiration_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(item)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClick(item)}
                          className="gap-2 hover:scale-105 transition-transform duration-300"
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={isDeleting}
                          className="gap-2 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Adjust Inventory</DialogTitle>
            <DialogDescription>Update stock levels or expiration date for {editingItem?.product_name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Input value={editingItem?.product_name ?? ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Lot Number</Label>
              <Input value={editingItem?.lot_number ?? ""} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editUnits">Units Available *</Label>
                <Input
                  id="editUnits"
                  type="number"
                  min="0"
                  value={formState.unitsAvailable}
                  onChange={handleInputChange("unitsAvailable")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editExpiry">Expiration Date *</Label>
                <Input
                  id="editExpiry"
                  type="date"
                  value={formState.expirationDate}
                  onChange={handleInputChange("expirationDate")}
                  required
                />
              </div>
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

export default Inventory;
