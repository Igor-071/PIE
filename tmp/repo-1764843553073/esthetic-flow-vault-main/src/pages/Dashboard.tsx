import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Syringe,
  Package,
  AlertTriangle,
  Calendar,
  Clock,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import {
  useDashboardMetrics,
  useTreatmentTrends,
  useTodaySchedule,
  useQuickActions,
  useAlertsFeed,
  useAlertActions,
  useRecentTreatments,
} from "@/hooks/use-dashboard";
import { TreatmentChart } from "@/components/TreatmentChart";

const formatNumber = (value?: number) => {
  if (value === undefined || value === null) return "—";
  return value.toLocaleString();
};

const Dashboard = () => {
  const { data: metrics, isLoading: metricsLoading } = useDashboardMetrics();
  const { data: treatmentHistory, isLoading: trendsLoading } = useTreatmentTrends();
  const { data: todaySchedule, isLoading: scheduleLoading } = useTodaySchedule();
  const quickActions = useQuickActions();
  const { data: alerts, isLoading: alertsLoading } = useAlertsFeed();
  const { acknowledge, snooze } = useAlertActions();
  const { data: recentTreatments, isLoading: recentLoading } = useRecentTreatments();

  const stats = useMemo(
    () => [
      {
        title: "Active Patients",
        value: formatNumber(metrics?.activePatients),
        change: `${metrics?.newPatientsThisMonth ?? 0} new this month`,
        icon: Users,
        color: "text-primary",
        gradient: "from-primary/10 via-primary/5 to-transparent",
      },
      {
        title: "Treatments This Week",
        value: formatNumber(metrics?.treatmentsThisWeek),
        change: `${metrics?.upcomingThisWeek ?? 0} upcoming`,
        icon: Syringe,
        color: "text-accent",
        gradient: "from-accent/10 via-accent/5 to-transparent",
      },
      {
        title: "Products in Stock",
        value: formatNumber(metrics?.productsInStock),
        change: `${metrics?.lowStock ?? 0} low stock`,
        icon: Package,
        color: "text-secondary",
        gradient: "from-secondary/10 via-secondary/5 to-transparent",
      },
      {
        title: "Expiring Soon",
        value: formatNumber(metrics?.expiringSoon),
        change: "Within 30 days",
        icon: AlertTriangle,
        color: "text-destructive",
        gradient: "from-destructive/10 via-destructive/5 to-transparent",
      },
    ],
    [metrics]
  );

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your live clinic pulse.</p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card
                variant="elevated"
                className={`relative overflow-hidden border-border/50 hover:scale-[1.02] transition-transform duration-300 bg-gradient-to-br ${stat.gradient}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-[var(--shadow-soft)]`}
                  >
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-serif font-semibold text-foreground">{metricsLoading ? "…" : stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="xl:col-span-2 space-y-6"
        >
          {trendsLoading ? (
            <Card variant="glass" className="border-border/50">
              <CardHeader>
                <CardTitle className="font-serif">Treatment Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ) : (
            <TreatmentChart treatments={treatmentHistory ?? []} />
          )}

          <Card variant="glass" className="border-border/50">
            <CardHeader>
              <CardTitle className="font-serif flex items-center gap-2">
                <Syringe className="w-4 h-4 text-primary" />
                Recent Treatments
              </CardTitle>
              <p className="text-sm text-muted-foreground">Latest documented procedures</p>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentTreatments && recentTreatments.length > 0 ? (
                <div className="space-y-3">
                  {recentTreatments.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-accent/5 to-transparent border border-border/30 hover:border-primary/20 hover:shadow-[var(--shadow-soft)] transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 flex items-center justify-center shadow-[var(--shadow-soft)]">
                          <Syringe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{item.patientName}</p>
                          <p className="text-sm text-muted-foreground">{item.treatmentType}</p>
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground font-medium">
                        {new Date(item.treatmentDate).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">No treatments recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-6"
        >
          <Card variant="glass" className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Today’s Schedule
                </CardTitle>
                <p className="text-sm text-muted-foreground">Live appointments and follow-ups</p>
              </div>
              <Badge variant="outline" className="border-primary/30 text-primary">
                {todaySchedule?.appointments.length ?? 0} appts
              </Badge>
            </CardHeader>
            <CardContent>
              {scheduleLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : todaySchedule && todaySchedule.appointments.length > 0 ? (
                <div className="space-y-3">
                  {todaySchedule.appointments.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-transparent border border-border/30 flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.patientName}</p>
                        <p className="text-sm text-muted-foreground">{item.treatmentType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">{item.time}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {item.status === "scheduled" ? "Scheduled" : "In prep"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-6">No appointments scheduled today.</div>
              )}
              {todaySchedule && todaySchedule.followUps.length > 0 && (
                <div className="mt-4 border-t border-border/40 pt-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Follow-ups</p>
                  <div className="space-y-2">
                    {todaySchedule.followUps.map((followUp) => (
                      <div key={followUp.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <ClipboardCheck className="w-4 h-4 text-accent" />
                          <span>{followUp.patientName}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{followUp.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated" className="border-border/50">
            <CardHeader>
              <CardTitle className="font-serif">Quick Actions</CardTitle>
              <p className="text-sm text-muted-foreground">Jump into frequent clinic workflows</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action) => (
                <Link key={action.action} to={action.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-14 px-4 border border-border/40 bg-[var(--glass-background)] hover:bg-primary/5 hover:border-primary/30"
                  >
                    <div className="text-left">
                      <p className="font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </Link>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card variant="glass" className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif flex items-center gap-2">
                <BellRing className="w-4 h-4 text-destructive" />
                Actionable Alerts
              </CardTitle>
              <p className="text-sm text-muted-foreground">Inventory, tasks, and patient follow-ups in one place</p>
            </div>
            <Badge variant="outline" className="border-destructive/30 text-destructive">
              {alerts?.length ?? 0} open
            </Badge>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-4 rounded-xl border border-border/40 bg-gradient-to-r from-destructive/5 via-background to-transparent flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      {alert.type === "inventory" ? (
                        <Package className="w-5 h-5 text-destructive mt-1" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-accent mt-1" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary/40"
                        onClick={() => acknowledge.mutate(alert)}
                        disabled={acknowledge.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                        Acknowledge
                      </Button>
                      {alert.type === "notification" && (
                        <Button size="sm" variant="ghost" onClick={() => snooze.mutate(alert)} disabled={snooze.isPending}>
                          <Clock className="w-4 h-4 mr-2" />
                          Snooze
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground text-center py-10">You’re all caught up! No alerts right now.</div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Dashboard;
