import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";

// ============================================
// Treatment Reports
// ============================================

interface TreatmentReportRow {
  treatment_date: string;
  treatment_type: string;
  patient_name: string;
  provider_id: string | null;
  units_used: number | null;
  product_name: string | null;
  lot_number: string | null;
}

async function fetchTreatmentReport(startDate: string, endDate: string): Promise<TreatmentReportRow[]> {
  const { data, error } = await supabase
    .from("treatments")
    .select(`
      treatment_date,
      treatment_type,
      units_used,
      product_name,
      lot_number,
      provider_id,
      patients (
        first_name,
        last_name
      )
    `)
    .gte("treatment_date", startDate)
    .lte("treatment_date", endDate)
    .order("treatment_date", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    treatment_date: row.treatment_date,
    treatment_type: row.treatment_type,
    patient_name: `${row.patients?.first_name || ""} ${row.patients?.last_name || ""}`.trim(),
    provider_id: row.provider_id,
    units_used: row.units_used,
    product_name: row.product_name,
    lot_number: row.lot_number,
  }));
}

export function useTreatmentReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["treatment-report", startDate, endDate],
    queryFn: () => fetchTreatmentReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// ============================================
// Inventory Reports
// ============================================

interface InventoryReportRow {
  product_name: string;
  category: string;
  lot_number: string;
  quantity_in_stock: number;
  expiration_date: string | null;
  cost_per_unit: number | null;
  total_value: number;
}

async function fetchInventoryReport(): Promise<InventoryReportRow[]> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("product_name", { ascending: true });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    product_name: row.product_name,
    category: row.category,
    lot_number: row.lot_number,
    quantity_in_stock: row.quantity_in_stock,
    expiration_date: row.expiration_date,
    cost_per_unit: row.cost_per_unit,
    total_value: (row.quantity_in_stock || 0) * (row.cost_per_unit || 0),
  }));
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ["inventory-report"],
    queryFn: fetchInventoryReport,
  });
}

// ============================================
// Financial Summary
// ============================================

interface FinancialSummary {
  totalRevenue: number;
  totalTreatments: number;
  averageRevenuePerTreatment: number;
  revenueByProvider: { provider_id: string | null; revenue: number; treatments: number }[];
  revenueByMonth: { month: string; revenue: number; treatments: number }[];
  topTreatmentTypes: { treatment_type: string; count: number; revenue: number }[];
}

// Note: This is a simplified version assuming we'll add a revenue field to treatments
// In a real system, you'd have a separate billing/payments table
async function fetchFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
  const { data: treatments, error } = await supabase
    .from("treatments")
    .select("*")
    .gte("treatment_date", startDate)
    .lte("treatment_date", endDate);

  if (error) throw error;

  // Since we don't have actual revenue data yet, we'll estimate based on treatment types
  // This is a placeholder - in production, you'd track actual charges
  const treatmentPricing: Record<string, number> = {
    "Botox": 400,
    "Filler": 600,
    "Microneedling": 300,
    "Chemical Peel": 150,
    "Laser": 500,
  };

  const estimateRevenue = (treatmentType: string): number => {
    const type = Object.keys(treatmentPricing).find(key => 
      treatmentType.toLowerCase().includes(key.toLowerCase())
    );
    return type ? treatmentPricing[type] : 250; // default $250
  };

  const totalRevenue = treatments.reduce((sum, t) => sum + estimateRevenue(t.treatment_type), 0);
  const totalTreatments = treatments.length;
  const averageRevenuePerTreatment = totalTreatments > 0 ? totalRevenue / totalTreatments : 0;

  // Revenue by provider
  const revenueByProviderMap = new Map<string | null, { revenue: number; treatments: number }>();
  treatments.forEach(t => {
    const current = revenueByProviderMap.get(t.provider_id) || { revenue: 0, treatments: 0 };
    revenueByProviderMap.set(t.provider_id, {
      revenue: current.revenue + estimateRevenue(t.treatment_type),
      treatments: current.treatments + 1,
    });
  });

  // Revenue by month
  const revenueByMonthMap = new Map<string, { revenue: number; treatments: number }>();
  treatments.forEach(t => {
    const month = format(new Date(t.treatment_date), "MMM yyyy");
    const current = revenueByMonthMap.get(month) || { revenue: 0, treatments: 0 };
    revenueByMonthMap.set(month, {
      revenue: current.revenue + estimateRevenue(t.treatment_type),
      treatments: current.treatments + 1,
    });
  });

  // Top treatment types
  const treatmentTypeMap = new Map<string, { count: number; revenue: number }>();
  treatments.forEach(t => {
    const current = treatmentTypeMap.get(t.treatment_type) || { count: 0, revenue: 0 };
    treatmentTypeMap.set(t.treatment_type, {
      count: current.count + 1,
      revenue: current.revenue + estimateRevenue(t.treatment_type),
    });
  });

  return {
    totalRevenue,
    totalTreatments,
    averageRevenuePerTreatment,
    revenueByProvider: Array.from(revenueByProviderMap.entries()).map(([provider_id, data]) => ({
      provider_id,
      ...data,
    })),
    revenueByMonth: Array.from(revenueByMonthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()),
    topTreatmentTypes: Array.from(treatmentTypeMap.entries())
      .map(([treatment_type, data]) => ({ treatment_type, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
  };
}

export function useFinancialSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["financial-summary", startDate, endDate],
    queryFn: () => fetchFinancialSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

// ============================================
// Export Functions
// ============================================

export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) {
    alert("No data to export");
    return;
  }

  // Get headers from first row
  const headers = Object.keys(data[0]);
  
  // Create CSV content
  const csvContent = [
    headers.join(","), // header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(",")
    ),
  ].join("\n");

  // Create download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper functions for common date ranges
export function getThisMonth() {
  const now = new Date();
  return {
    startDate: format(startOfMonth(now), "yyyy-MM-dd"),
    endDate: format(endOfMonth(now), "yyyy-MM-dd"),
  };
}

export function getThisYear() {
  const now = new Date();
  return {
    startDate: format(startOfYear(now), "yyyy-MM-dd"),
    endDate: format(endOfYear(now), "yyyy-MM-dd"),
  };
}

