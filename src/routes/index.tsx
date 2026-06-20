import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  HeartPulse,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useT, useSettings } from "@/lib/settings-context";
import { api } from "@/lib/api-client";
import { dailyRiskData, weeklyRiskData, monthlyRiskData, yearlyRiskData } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fall Guard" },
      { name: "description", content: "Global overview of all monitored patients and fall-risk analytics." },
    ],
  }),
  component: DashboardPage,
});

type Range = "daily" | "weekly" | "monthly" | "yearly";

function DashboardPage() {
  const t = useT();
  const { theme, lang } = useSettings();
  const isDark = theme === "dark";
  const chartGridStroke = isDark ? "#334155" : "#f1f5f9";
  const chartTextColor = isDark ? "#94a3b8" : "#64748b";
  const tooltipStyle = {
    background: isDark ? "#1e293b" : "#ffffff",
    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
    borderRadius: 8,
    fontSize: 12,
    color: isDark ? "#f8fafc" : "#0f172a",
  };
  const [range, setRange] = useState<Range>("daily");
  
  const [patients, setPatients] = useState<any[]>([]);
  const [devicesData, setDevicesData] = useState<Record<string, any>>({});
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      if (e.key === "1") {
        setStatusFilter("all");
      } else if (e.key === "2") {
        setStatusFilter("risk");
      } else if (e.key === "3") {
        setStatusFilter("normal");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [patientsData, trendsData, sensorData] = await Promise.all([
          api.getPatients(),
          api.getRiskTrends(),
          api.getSensorData(),
        ]);
        setPatients(patientsData);
        setTrends(trendsData);
        setDevicesData(sensorData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    // Poll sensor data every 3 seconds for the dashboard
    const interval = setInterval(async () => {
      try {
        const sensorData = await api.getSensorData();
        setDevicesData(sensorData);
      } catch (err) {}
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const rangeData = useMemo(() => {
    if (!trends) {
      return {
        daily: { data: dailyRiskData, xKey: "label" },
        weekly: { data: weeklyRiskData, xKey: "label" },
        monthly: { data: monthlyRiskData, xKey: "label" },
        yearly: { data: yearlyRiskData, xKey: "label" },
      };
    }
    return {
      daily: { data: trends.daily, xKey: "label" },
      weekly: { data: trends.weekly, xKey: "label" },
      monthly: { data: trends.monthly, xKey: "label" },
      yearly: { data: trends.yearly, xKey: "label" },
    };
  }, [trends]);

  const chart = rangeData[range];

  const stats = useMemo(() => {
    // Determine how many patients are at risk
    let atRiskCount = 0;
    patients.forEach((p) => {
      if (p.device_id && devicesData[p.device_id]) {
        const dev = devicesData[p.device_id];
        if (dev.status === "Connected" && (dev.risk_label === "Risk" || dev.risk_label === "High Risk")) {
          atRiskCount++;
        }
      }
    });

    // Count today's alerts
    let todayAlertsCount = 0;
    if (trends?.daily) {
      todayAlertsCount = trends.daily.reduce((a: number, b: any) => a + b.risk, 0);
    } else {
      todayAlertsCount = dailyRiskData.reduce((a, b) => a + b.risk, 0);
    }

    // Calculate uptime based on patients with connected devices
    let connected = 0;
    patients.forEach((p: any) => {
      if (p.device_id && devicesData[p.device_id]) {
        const dev = devicesData[p.device_id];
        if (dev.status === "Connected") {
          connected++;
        }
      }
    });
    const totalPatients = patients.length;
    const uptimePercent = totalPatients > 0 ? ((connected / totalPatients) * 100).toFixed(1) : "0.0";

    return {
      atRisk: atRiskCount,
      monitored: patients.length,
      todayAlerts: todayAlertsCount,
      uptime: uptimePercent,
    };
  }, [patients, devicesData, trends]);

  const alertsTrend = useMemo(() => {
    const todayCount = stats.todayAlerts;
    const weeklyData = trends?.weekly || weeklyRiskData;
    
    // Map JS getDay() (0 = Sun, 1 = Mon...) to Python/Backend index (0 = Mon, 6 = Sun)
    const todayIndex = (new Date().getDay() + 6) % 7;
    const yesterdayIndex = (todayIndex + 6) % 7;
    const yesterdayCount = weeklyData[yesterdayIndex]?.risk || 0;

    if (yesterdayCount <= 0) {
      if (todayCount > 0) {
        return {
          text: lang === "th" ? `+${todayCount} เคส เทียบกับเมื่อวาน` : `+${todayCount} cases vs yesterday`,
          isIncrease: true,
          isDecrease: false,
        };
      }
      return {
        text: lang === "th" ? "คงที่ เทียบกับเมื่อวาน" : "Stable vs yesterday",
        isIncrease: false,
        isDecrease: false,
      };
    }

    const diffPercent = ((todayCount - yesterdayCount) / yesterdayCount) * 100;
    const roundedPercent = Math.abs(Math.round(diffPercent));

    if (diffPercent > 0.5) {
      return {
        text: lang === "th" ? `+${roundedPercent}% เทียบกับเมื่อวาน` : `+${roundedPercent}% vs yesterday`,
        isIncrease: true,
        isDecrease: false,
      };
    } else if (diffPercent < -0.5) {
      return {
        text: lang === "th" ? `-${roundedPercent}% เทียบกับเมื่อวาน` : `-${roundedPercent}% vs yesterday`,
        isIncrease: false,
        isDecrease: true,
      };
    } else {
      return {
        text: lang === "th" ? "คงที่ เทียบกับเมื่อวาน" : "Stable vs yesterday",
        isIncrease: false,
        isDecrease: false,
      };
    }
  }, [stats.todayAlerts, trends, lang]);

  const [statusFilter, setStatusFilter] = useState<"all" | "risk" | "normal">("all");

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      if (statusFilter !== "all") {
        const device = p.device_id ? devicesData[p.device_id] : null;
        const isConnected = device?.status === "Connected";
        const displayStatus = isConnected && (device?.risk_label === "Risk" || device?.risk_label === "High Risk")
          ? "risk"
          : "normal";
        if (displayStatus !== statusFilter) return false;
      }

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = p.name ? p.name.toLowerCase().includes(query) : false;
        const matchesRoom = p.room ? String(p.room).toLowerCase().includes(query) : false;
        if (!matchesName && !matchesRoom) return false;
      }

      return true;
    });
  }, [patients, devicesData, statusFilter, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-slate-900 dark:text-slate-100">{t("dashboard.title")}</h1>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" aria-label="Help & Documentation">
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 shadow-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-slate-700 dark:text-slate-300 text-xs rounded-lg space-y-3 z-50">
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-1 border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-blue-600" />
                    <span>{t("dashboard.help.title")}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{t("dashboard.help.statusTitle")}:</p>
                    <div className="grid grid-cols-[16px_1fr] gap-2 items-start">
                      <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-950/40 border border-red-300 dark:border-red-900/40 text-red-700 dark:text-red-400 flex items-center justify-center font-bold text-[9px]">!</span>
                      <div>
                        <span className="font-bold text-red-700 dark:text-red-400 font-sans">{t("status.risk")}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.help.riskDesc")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[16px_1fr] gap-2 items-start">
                      <span className="inline-block w-3.5 h-3.5 rounded-full bg-green-100 dark:bg-green-950/40 border border-green-300 dark:border-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center font-bold text-[9px]">✓</span>
                      <div>
                        <span className="font-bold text-green-700 dark:text-green-400 font-sans">{t("status.normal")}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.help.normalDesc")}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[16px_1fr] gap-2 items-start">
                      <span className="inline-block w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 flex items-center justify-center font-bold text-[9px]">-</span>
                      <div>
                        <span className="font-bold text-slate-600 dark:text-slate-400 font-sans">{t("dashboard.help.offline")}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{t("dashboard.help.offlineDesc")}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{t("dashboard.help.shortcut")}</span> {lang === "th" ? "กดปุ่มตัวเลข" : "Press"} <span className="font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-1 rounded">1</span>, <span className="font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-1 rounded">2</span>, {lang === "th" ? "หรือ" : "or"} <span className="font-bold border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 px-1 rounded">3</span> {t("dashboard.help.shortcutDesc")}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("dashboard.subtitle").replace("{n}", String(stats.monitored))}
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="h-9 cursor-pointer rounded-lg bg-blue-600 hover:bg-blue-700">
          <Link to="/patients">
            <Users className="h-4 w-4 mr-1.5" /> {t("dashboard.managePatients")}
          </Link>
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label={t("kpi.atRisk")}
          value={stats.atRisk}
          hint={t("kpi.atRisk.hint")}
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="risk"
        />
        <KpiCard
          label={t("kpi.alertsToday")}
          value={stats.todayAlerts}
          hint={
            alertsTrend.isIncrease ? (
              <span className="inline-flex items-center gap-1 text-red-600 font-bold">
                <TrendingUp className="h-3.5 w-3.5" /> {alertsTrend.text}
              </span>
            ) : alertsTrend.isDecrease ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <TrendingDown className="h-3.5 w-3.5" /> {alertsTrend.text}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-500 font-bold">
                <Activity className="h-3.5 w-3.5" /> {alertsTrend.text}
              </span>
            )
          }
          icon={<Activity className="h-5 w-5" />}
          tone="warning"
        />
        <KpiCard
          label={t("kpi.monitored")}
          value={stats.monitored}
          hint={
            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
              <TrendingDown className="h-3.5 w-3.5" /> {
                lang === "th" 
                  ? `อาการปกติ ${stats.monitored - stats.atRisk} คน` 
                  : `${stats.monitored - stats.atRisk} stable patients`
              }
            </span>
          }
          icon={<Users className="h-5 w-5" />}
          tone="primary"
        />
        <KpiCard
          label={t("kpi.uptime")}
          value={`${stats.uptime}%`}
          hint={t("kpi.uptime.hint").replace("8", String(patients.length))}
          icon={<HeartPulse className="h-5 w-5" />}
          tone="success"
        />
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2 shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader className="flex-row items-start justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">{t("chart.trends.title")}</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("chart.trends.desc")}</CardDescription>
            </div>
            <Tabs value={range} onValueChange={(v) => setRange(v as Range)}>
              <TabsList className="bg-slate-100 dark:bg-slate-950 p-0.5 border border-slate-200/50 dark:border-slate-800 rounded-lg">
                <TabsTrigger value="daily" className="text-xs px-2.5 py-1 cursor-pointer rounded-md">{t("range.daily")}</TabsTrigger>
                <TabsTrigger value="weekly" className="text-xs px-2.5 py-1 cursor-pointer rounded-md">{t("range.weekly")}</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-2.5 py-1 cursor-pointer rounded-md">{t("range.monthly")}</TabsTrigger>
                <TabsTrigger value="yearly" className="text-xs px-2.5 py-1 cursor-pointer rounded-md">{t("range.yearly")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.data} margin={{ left: 15, right: 20, top: 15, bottom: 20 }}>
                  <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey={chart.xKey} 
                    stroke={chartTextColor} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    label={{ value: lang === "th" ? "ช่วงเวลา" : "Time range", position: "insideBottom", fill: chartTextColor, offset: -10 }}
                  />
                  <YAxis 
                    stroke={chartTextColor} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    label={{ value: lang === "th" ? "จำนวนเหตุการณ์ (ครั้ง)" : "Event Count", angle: -90, position: "insideLeft", fill: chartTextColor, offset: -5, style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="normal" stroke="#2563eb" strokeWidth={2.5} dot={false} name={t("status.normal")} />
                  <Line type="monotone" dataKey="risk" stroke="#dc2626" strokeWidth={2.5} dot={false} name={t("status.risk")} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {lang === "th" ? "💡 คำอธิบายกราฟแนวโน้ม:" : "💡 Trend Chart Explanation:"}
              </span>
              {lang === "th" 
                ? "กราฟนี้แสดงเปรียบเทียบแนวโน้มความถี่เหตุการณ์ความเสี่ยงหกล้ม (เส้นสีแดง) และความเคลื่อนไหวปกติ (เส้นสีน้ำเงิน) ทำให้ผู้ดูแลเห็นแนวโน้มความเปลี่ยนแปลงความปลอดภัยของผู้ป่วยในแต่ละวัน สัปดาห์ หรือเดือน" 
                : "This graph compares the trend of fall-risk events (red line) against normal physical motions (blue line) over time, showing overall changes in patient safety profiles."}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-100">{t("chart.byHour.title")}</CardTitle>
            <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("chart.byHour.desc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rangeData.daily.data.filter((_: any, i: number) => i % 2 === 0)} margin={{ left: 15, right: 20, top: 15, bottom: 20 }}>
                  <CartesianGrid stroke={chartGridStroke} strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke={chartTextColor} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    label={{ value: lang === "th" ? "ช่วงเวลาของวัน (ชั่วโมง)" : "Time of Day (Hours)", position: "insideBottom", fill: chartTextColor, offset: -10 }}
                  />
                  <YAxis 
                    stroke={chartTextColor} 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    label={{ value: lang === "th" ? "จำนวนแจ้งเตือน (ครั้ง)" : "Alerts (Count)", angle: -90, position: "insideLeft", fill: chartTextColor, offset: -5, style: { textAnchor: 'middle' } }}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="risk" fill="#dc2626" radius={[4, 4, 0, 0]} name={t("status.risk")} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                {lang === "th" ? "💡 คำอธิบายกราฟรายชั่วโมง:" : "💡 Hourly Chart Explanation:"}
              </span>
              {lang === "th" 
                ? "กราฟแท่งนี้ชี้ให้เห็นความหนาแน่นของการเกิดเหตุการณ์ความเสี่ยงรายชั่วโมงตลอดวัน ช่วยให้ระบุช่วงเวลาที่เปราะบางที่สุด (เช่น ช่วงเวลาดึกหรือกลางคืนที่ผู้ป่วยลุกเดินเอง)" 
                : "This bar chart indicates the density of fall-risk alerts per hour, identifying high-vulnerability timeframes such as late-night hours."}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient grid */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{t("roster.title")}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("roster.desc")}</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 self-start sm:self-center w-full sm:w-auto shrink-0">
          <Input
            type="text"
            placeholder={t("index.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full sm:w-56 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg shadow-none"
          />
          <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 rounded-lg shrink-0">
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "text-xs px-3 h-7 rounded-md cursor-pointer",
                statusFilter === "all" ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              )}
              onClick={() => setStatusFilter("all")}
            >
              {t("index.filterAll")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "text-xs px-3 h-7 rounded-md cursor-pointer",
                statusFilter === "risk" ? "bg-red-50 dark:bg-red-950/35 text-red-700 dark:text-red-350 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              )}
              onClick={() => setStatusFilter("risk")}
            >
              {t("index.filterRisk")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "text-xs px-3 h-7 rounded-md cursor-pointer",
                statusFilter === "normal" ? "bg-green-50 dark:bg-green-950/35 text-green-700 dark:text-green-350 font-bold" : "text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400"
              )}
              onClick={() => setStatusFilter("normal")}
            >
              {t("index.filterNormal")}
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">{t("index.loading")}</div>
      ) : filteredPatients.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-900/30">
          {t("index.noPatients")}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPatients.map((p) => (
            <PatientCard key={p.id} patient={p} devicesData={devicesData} />
          ))}
        </div>
      )}
    </div>
  );
}

// tooltips are defined locally in DashboardPage to support theme changes

function KpiCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint: React.ReactNode;
  icon: React.ReactNode;
  tone: "primary" | "risk" | "success" | "warning";
}) {
  const toneClasses = {
    primary: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
    risk: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30",
    success: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30",
    warning: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30",
  }[tone];
  return (
    <Card className="shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg border", toneClasses)}>{icon}</div>
        </div>
        <div className="mt-3 text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</div>
        <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">{hint}</div>
      </CardContent>
    </Card>
  );
}

function PatientCard({ patient, devicesData }: { patient: any; devicesData: Record<string, any> }) {
  const t = useT();
  const { lang } = useSettings();
  
  const device = patient.device_id ? devicesData[patient.device_id] : null;
  const isConnected = device?.status === "Connected";
  const displayStatus = isConnected && (device?.risk_label === "Risk" || device?.risk_label === "High Risk")
    ? "risk"
    : "normal";

  const lastUpdate = isConnected 
    ? (lang === "th" ? "เมื่อสักครู่" : "now") 
    : t("dashboard.help.offline");

  return (
    <Card className={cn(
      "group relative overflow-hidden shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/40 dark:hover:bg-slate-800/40 transition-colors duration-150", 
      displayStatus === "risk" && "border-red-300 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10"
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold select-none",
              displayStatus === "risk" ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            )}>
              {patient.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div>
              <div className="font-semibold leading-tight text-slate-900 dark:text-slate-100">{patient.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t("patient.telemetry.ageVal").replace("{age}", String(patient.age))} · {t("field.room")} {patient.room || "-"}
              </div>
            </div>
          </div>
          <StatusBadge status={displayStatus} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 px-2 py-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{t("patient.device")}</div>
            <div className="font-bold text-slate-700 dark:text-slate-300 truncate mt-0.5">{patient.device_id || t("patient.telemetry.noDevice")}</div>
          </div>
          <div className="rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/50 px-2 py-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">{t("patient.lastUpdate")}</div>
            <div className="font-bold text-slate-700 dark:text-slate-300 mt-0.5">{lastUpdate}</div>
          </div>
        </div>
        <Button asChild size="sm" className="mt-4 w-full cursor-pointer h-9 rounded-lg" variant={displayStatus === "risk" ? "destructive" : "secondary"}>
          <Link to="/patients/$id" params={{ id: patient.id }}>
            {t("patient.monitor")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
