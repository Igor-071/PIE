import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type InventoryRecord = Tables<"inventory">;

export interface NewInventoryInput {
  productName: string;
  lotNumber: string;
  manufacturer?: string;
  unitsAvailable: number;
  expirationDate: string;
}

export interface UpdateInventoryInput {
  id: string;
  unitsAvailable?: number;
  expirationDate?: string;
}

const fetchInventory = async (): Promise<InventoryRecord[]> => {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("expiration_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const useInventory = () => {
  return useQuery({
    queryKey: ["inventory"],
    queryFn: fetchInventory,
    staleTime: 30_000,
  });
};

export const useInventoryStats = (inventory?: InventoryRecord[]) => {
  return useMemo(() => {
    if (!inventory) return { total: 0, lowStock: 0, expiringSoon: 0 };

    const now = new Date();
    const thirtyDaysOut = new Date();
    thirtyDaysOut.setDate(now.getDate() + 30);

    const lowStock = inventory.filter((item) => item.units_available < 5).length;
    const expiringSoon = inventory.filter(
      (item) => new Date(item.expiration_date) <= thirtyDaysOut && new Date(item.expiration_date) >= now
    ).length;

    return {
      total: inventory.length,
      lowStock,
      expiringSoon,
    };
  }, [inventory]);
};

export const useFilteredInventory = (inventory: InventoryRecord[] | undefined, searchQuery: string) => {
  return useMemo(() => {
    if (!inventory) return [];
    const term = searchQuery.trim().toLowerCase();
    if (!term) return inventory;

    return inventory.filter((item) => {
      return (
        item.product_name.toLowerCase().includes(term) ||
        item.lot_number.toLowerCase().includes(term) ||
        (item.manufacturer?.toLowerCase() ?? "").includes(term)
      );
    });
  }, [inventory, searchQuery]);
};

const mapToInsert = (payload: NewInventoryInput): TablesInsert<"inventory"> => ({
  product_name: payload.productName.trim(),
  lot_number: payload.lotNumber.trim(),
  manufacturer: payload.manufacturer?.trim() || null,
  units_available: payload.unitsAvailable,
  expiration_date: payload.expirationDate,
});

export const useAddInventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: NewInventoryInput) => {
      const body = mapToInsert(payload);
      const { data, error } = await supabase.from("inventory").insert(body).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Product added",
        description: "The inventory item has been added.",
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateInventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (payload: UpdateInventoryInput) => {
      const { id, ...updates } = payload;
      const body: TablesUpdate<"inventory"> = {};
      if (updates.unitsAvailable !== undefined) body.units_available = updates.unitsAvailable;
      if (updates.expirationDate) body.expiration_date = updates.expirationDate;

      const { data, error } = await supabase.from("inventory").update(body).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Inventory updated",
        description: "Stock levels have been adjusted.",
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update inventory",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteInventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Product removed",
        description: "The inventory item has been deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDecrementInventory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lotNumber, unitsUsed }: { lotNumber: string; unitsUsed: number }) => {
      // Find matching lot
      const { data: items, error: fetchError } = await supabase
        .from("inventory")
        .select("*")
        .eq("lot_number", lotNumber)
        .single();

      if (fetchError) throw fetchError;
      if (!items) throw new Error(`Lot ${lotNumber} not found in inventory`);

      const newUnits = Math.max(0, items.units_available - unitsUsed);

      const { error: updateError } = await supabase
        .from("inventory")
        .update({ units_available: newUnits })
        .eq("id", items.id);

      if (updateError) throw updateError;

      return { oldUnits: items.units_available, newUnits };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
};

