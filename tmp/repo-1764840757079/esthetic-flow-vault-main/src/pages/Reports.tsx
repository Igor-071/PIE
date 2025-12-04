import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Download, DollarSign, TrendingUp, Calendar, FileText } from "lucide-react";
import {
  useTreatmentReport,
  useInventoryReport,
  useFinancialSummary,
  exportToCSV,
  getThisMonth,
  getThisYear,
} from "@/hooks/use-reports";
import { format } from "date-fns";

const Reports = () => {
  const thisMonth = getThisMonth();
  const thisYear = getThisYear();

  const [treatmentDateRange, setTreatmentDateRange] = useState<"month" | "year" | "custom">("month");
  const [treatmentStartDate, setTreatmentStartDate] = useState(thisMonth.startDate);
  const [treatmentEndDate, setTreatmentEndDate] = useState(thisMonth.endDate);

  const [financialDateRange, setFinancialDateRange] = useState<"month" | "year" | "custom">("month");
  const [financialStartDate, setFinancialStartDate] = useState(thisMonth.startDate);
  const [financialEndDate, setFinancialEndDate] = useState(thisMonth.endDate);

  const { data: treatmentData, isLoading: treatmentLoading } = useTreatmentReport(
    treatmentStartDate,
    treatmentEndDate
  );

  const { data: inventoryData, isLoading: inventoryLoading } = useInventoryReport();

  const { data: financialData, isLoading: financialLoading } = useFinancialSummary(
    financialStartDate,
    financialEndDate
  );

  const handleTreatmentDateRangeChange = (range: "month" | "year" | "custom") => {
    setTreatmentDateRange(range);
    if (range === "month") {
      setTreatmentStartDate(thisMonth.startDate);
      setTreatmentEndDate(thisMonth.endDate);
    } else if (range === "year") {
      setTreatmentStartDate(thisYear.startDate);
      setTreatmentEndDate(thisYear.endDate);
    }
  };

  const handleFinancialDateRangeChange = (range: "month" | "year" | "custom") => {
    setFinancialDateRange(range);
    if (range === "month") {
      setFinancialStartDate(thisMonth.startDate);
      setFinancialEndDate(thisMonth.endDate);
    } else if (range === "year") {
      setFinancialStartDate(thisYear.startDate);
      setFinancialEndDate(thisYear.endDate);
    }
  };

  const handleExportTreatments = () => {
    if (!treatmentData) return;
    exportToCSV(treatmentData, "treatment_report");
  };

  const handleExportInventory = () => {
    if (!inventoryData) return;
    exportToCSV(inventoryData, "inventory_report");
  };

  const handleExportFinancials = () => {
    if (!financialData) return;
    const exportData = [
      {
        metric: "Total Revenue",
        value: `$${financialData.totalRevenue.toFixed(2)}`,
      },
      {
        metric: "Total Treatments",
        value: financialData.totalTreatments,
      },
      {
        metric: "Avg Revenue per Treatment",
        value: `$${financialData.averageRevenuePerTreatment.toFixed(2)}`,
      },
    ];
    exportToCSV(exportData, "financial_summary");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground mb-2">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Export data and view financial summaries for your clinic
        </p>
      </div>

      <Tabs defaultValue="treatments" className="space-y-6">
        <TabsList className="bg-surface-soft">
          <TabsTrigger value="treatments" className="gap-2">
            <FileText className="w-4 h-4" />
            Treatments
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Calendar className="w-4 h-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="financials" className="gap-2">
            <DollarSign className="w-4 h-4" />
            Financials
          </TabsTrigger>
        </TabsList>

        {/* Treatments Report Tab */}
        <TabsContent value="treatments">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="font-serif">Treatment Report</CardTitle>
                <CardDescription>View and export treatment records</CardDescription>
              </div>
              <Button onClick={handleExportTreatments} className="gap-2" disabled={!treatmentData || treatmentData.length === 0}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <Select
                    value={treatmentDateRange}
                    onValueChange={(value: any) => handleTreatmentDateRangeChange(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {treatmentDateRange === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={treatmentStartDate}
                        onChange={(e) => setTreatmentStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={treatmentEndDate}
                        onChange={(e) => setTreatmentEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              {treatmentLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : treatmentData && treatmentData.length > 0 ? (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing {treatmentData.length} treatments from {format(new Date(treatmentStartDate), "MMM dd, yyyy")} to{" "}
                    {format(new Date(treatmentEndDate), "MMM dd, yyyy")}
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Treatment Type</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Lot Number</TableHead>
                          <TableHead className="text-right">Units Used</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {treatmentData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{format(new Date(row.treatment_date), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="font-medium">{row.patient_name}</TableCell>
                            <TableCell>{row.treatment_type}</TableCell>
                            <TableCell className="text-muted-foreground">{row.product_name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">
                              {row.lot_number || "—"}
                            </TableCell>
                            <TableCell className="text-right">{row.units_used ?? "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No treatments found for the selected date range.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Report Tab */}
        <TabsContent value="inventory">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="font-serif">Inventory Report</CardTitle>
                <CardDescription>Current inventory status and valuation</CardDescription>
              </div>
              <Button onClick={handleExportInventory} className="gap-2" disabled={!inventoryData || inventoryData.length === 0}>
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {inventoryLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : inventoryData && inventoryData.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-surface-soft/30">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-semibold text-foreground">
                          {inventoryData.length}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Products</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-surface-soft/30">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-semibold text-foreground">
                          {inventoryData.reduce((sum, item) => sum + item.quantity_in_stock, 0)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Units</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-surface-soft/30">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-semibold text-foreground">
                          ${inventoryData.reduce((sum, item) => sum + item.total_value, 0).toFixed(2)}
                        </div>
                        <p className="text-sm text-muted-foreground">Total Value</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Lot Number</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Cost/Unit</TableHead>
                          <TableHead className="text-right">Total Value</TableHead>
                          <TableHead>Expiration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.product_name}</TableCell>
                            <TableCell className="capitalize">{row.category}</TableCell>
                            <TableCell className="text-muted-foreground font-mono text-xs">
                              {row.lot_number}
                            </TableCell>
                            <TableCell className="text-right">{row.quantity_in_stock}</TableCell>
                            <TableCell className="text-right">
                              ${row.cost_per_unit?.toFixed(2) || "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ${row.total_value.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {row.expiration_date
                                ? format(new Date(row.expiration_date), "MMM dd, yyyy")
                                : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No inventory items found.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Summary Tab */}
        <TabsContent value="financials">
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="font-serif">Financial Summary</CardTitle>
                  <CardDescription>Revenue analysis and insights</CardDescription>
                </div>
                <Button onClick={handleExportFinancials} className="gap-2" disabled={!financialData}>
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Select
                      value={financialDateRange}
                      onValueChange={(value: any) => handleFinancialDateRangeChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {financialDateRange === "custom" && (
                    <>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={financialStartDate}
                          onChange={(e) => setFinancialStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={financialEndDate}
                          onChange={(e) => setFinancialEndDate(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>

                {financialLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                  </div>
                ) : financialData ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-green-700 dark:text-green-400">
                              Total Revenue
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                            ${financialData.totalRevenue.toLocaleString()}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-surface-soft/30">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Total Treatments
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-foreground">
                            {financialData.totalTreatments}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-surface-soft/30">
                        <CardContent className="pt-6">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            <span className="text-sm font-medium text-muted-foreground">
                              Avg Per Treatment
                            </span>
                          </div>
                          <div className="text-3xl font-bold text-foreground">
                            ${financialData.averageRevenuePerTreatment.toFixed(0)}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base">Top Treatment Types</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {financialData.topTreatmentTypes.map((type, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">{type.treatment_type}</p>
                                  <p className="text-xs text-muted-foreground">{type.count} treatments</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-sm">${type.revenue.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base">Revenue by Provider</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {financialData.revenueByProvider.map((provider, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-sm">
                                    {provider.provider_id || "Unassigned"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {provider.treatments} treatments
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-sm">
                                    ${provider.revenue.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {financialData.revenueByMonth.length > 0 && (
                      <Card className="border-border/50">
                        <CardHeader>
                          <CardTitle className="text-base">Monthly Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Month</TableHead>
                                <TableHead className="text-right">Treatments</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {financialData.revenueByMonth.map((month, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{month.month}</TableCell>
                                  <TableCell className="text-right">{month.treatments}</TableCell>
                                  <TableCell className="text-right font-semibold">
                                    ${month.revenue.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No financial data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;

