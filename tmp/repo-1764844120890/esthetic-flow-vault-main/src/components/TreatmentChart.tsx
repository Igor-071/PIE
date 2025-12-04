import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Activity } from "lucide-react";

interface Treatment {
  treatment_date: string;
  treatment_type: string;
}

interface TreatmentChartProps {
  treatments: Treatment[];
}

export const TreatmentChart = ({ treatments }: TreatmentChartProps) => {
  // Group treatments by month
  const monthlyData = treatments.reduce((acc, treatment) => {
    const date = new Date(treatment.treatment_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthLabel, count: 0 };
    }
    acc[monthKey].count += 1;
    return acc;
  }, {} as Record<string, { month: string; count: number }>);

  const chartData = Object.values(monthlyData).sort((a, b) => 
    a.month.localeCompare(b.month)
  );

  if (chartData.length === 0) return null;

  const totalTreatments = treatments.length;
  const uniqueMonths = chartData.length;

  return (
    <Card variant="glass" className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Treatment Journey
            </CardTitle>
            <CardDescription>Your treatment frequency over time</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{totalTreatments}</div>
            <div className="text-xs text-muted-foreground">Total Treatments</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="treatmentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              strokeOpacity={0.3}
              vertical={false}
            />
            <XAxis 
              dataKey="month" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, 'auto']}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                boxShadow: "var(--shadow-premium)",
              }}
              labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="url(#treatmentGradient)"
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ 
                fill: "hsl(var(--background))", 
                stroke: "hsl(var(--primary))", 
                strokeWidth: 2,
                r: 5 
              }}
              activeDot={{ 
                r: 7,
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
