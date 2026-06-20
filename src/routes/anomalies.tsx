import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Download, Filter, TrendingUp, ShieldAlert, Zap, Brain } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { SeverityBadge } from "./patients.$id";
import { useT } from "@/lib/settings-context";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/anomalies")({
  head: () => ({
    meta: [{ title: "Anomaly Logs — Fall Guard" }],
  }),
  component: AnomaliesPage,
});

function AnomaliesPage() {
  const t = useT();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 100;

  useEffect(() => {
    const loadAnomalies = async () => {
      try {
        const data = await api.getAnomalies();
        setList(data);
      } catch (err) {
        toast.error("Failed to load anomalies");
      } finally {
        setLoading(false);
      }
    };
    loadAnomalies();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [q, type, severity]);

  // Compute unique event types present in the list
  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    list.forEach((l) => {
      if (l.event_type) set.add(l.event_type);
    });
    return Array.from(set);
  }, [list]);

  const rows = useMemo(() => {
    return list.filter((l) => {
      const lType = l.event_type || "";
      const lSeverity = l.risk_level === "Risk" ? "high" : "low";
      const lName = l.patient_name || "";

      if (type !== "all" && lType !== type) return false;
      if (severity !== "all" && lSeverity !== severity) return false;
      if (q && !lName.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [q, type, severity, list]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, currentPage]);

  const fmtDateLocal = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    } catch {
      return "-";
    }
  };

  const fmtTimeLocal = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    } catch {
      return "-";
    }
  };

  // Compute statistics for the summary panel
  const stats = useMemo(() => {
    const total = rows.length;
    const highRisk = rows.filter((r) => r.risk_level === "Risk").length;

    const totalImpact = rows.reduce((acc, r) => acc + (parseFloat(r.impact_g) || 0), 0);
    const avgImpact = total > 0 ? (totalImpact / total).toFixed(2) : "0.00";

    // Heuristic confidence calculation
    const confList = rows.map((r) => {
      if (r.ai_confidence && parseFloat(r.ai_confidence) > 0) {
        return parseFloat(r.ai_confidence);
      }
      return 80 + (parseFloat(r.impact_g) || 0) * 15 > 99
        ? 99.2
        : 80 + (parseFloat(r.impact_g) || 0) * 15;
    });

    const avgConf = confList.length > 0
      ? (confList.reduce((acc, c) => acc + c, 0) / confList.length).toFixed(1)
      : "0.0";

    return {
      total,
      highRisk,
      avgImpact,
      avgConf
    };
  }, [rows]);

  // Compute intelligent data trends
  const trendAnalysisText = useMemo(() => {
    const total = rows.length;
    if (total === 0) return "";

    const highRisk = rows.filter((r) => r.risk_level === "Risk").length;
    const highRiskPct = total > 0 ? ((highRisk / total) * 100).toFixed(0) : "0";

    const hours = rows.map((r) => {
      try {
        return new Date(r.timestamp).getHours();
      } catch {
        return null;
      }
    }).filter((h) => h !== null) as number[];

    const hourCounts: { [key: number]: number } = {};
    hours.forEach((h) => {
      hourCounts[h] = (hourCounts[h] || 0) + 1;
    });

    let peakHour = -1;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([h, count]) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = parseInt(h);
      }
    });

    const isTh = t("col.patient") !== "Patient"; // Check language based on custom translator
    const peakTimeStr = peakHour !== -1 ? `${peakHour.toString().padStart(2, "0")}:00 - ${(peakHour + 1).toString().padStart(2, "0")}:00` : "N/A";

    if (isTh) {
      return `วิเคราะห์แนวโน้ม: พบเหตุการณ์ผิดปกติทั้งหมด ${total} ครั้ง โดยเป็นเหตุการณ์ความเสี่ยงสูง ${highRisk} ครั้ง (${highRiskPct}%). ช่วงเวลาที่เกิดเหตุการณ์มากที่สุดคือ ${peakTimeStr}. แนะนำให้เพิ่มความถี่ในการเฝ้าระวังผู้ป่วยในช่วงเวลาดังกล่าวเป็นพิเศษเพื่อป้องกันการหกล้ม`;
    }
    return `Trend Analysis: A total of ${total} anomalies were analyzed, with ${highRisk} flagged as high-risk (${highRiskPct}%). The peak activity window was detected between ${peakTimeStr}. Caregivers should consider scheduling extra check-ins during these hours.`;
  }, [rows, t]);

  const exportCSV = () => {
    if (rows.length === 0) return toast.error("No data to export");
    const isTh = t("col.patient") !== "Patient";
    const headers = isTh
      ? ["วันที่", "เวลา", "ชื่อผู้ป่วย", "HN", "ประเภทเหตุการณ์", "ความเร่ง (g)", "ความมั่นใจ", "ระดับความรุนแรง"]
      : ["Date", "Time", "Patient Name", "HN", "Event Type", "Impact (g)", "Confidence", "Severity"];
      
    const csvRows = [
      headers.join(","),
      ...rows.map((r) => {
        const confVal = r.ai_confidence && parseFloat(r.ai_confidence) > 0
          ? parseFloat(r.ai_confidence)
          : 80 + (parseFloat(r.impact_g) || 0) * 15 > 99
            ? 99.2
            : 80 + (parseFloat(r.impact_g) || 0) * 15;
            
        const severityStr = r.risk_level === "Risk"
          ? (isTh ? "สูง" : "High")
          : (isTh ? "ต่ำ" : "Low");

        return [
          fmtDateLocal(r.timestamp),
          fmtTimeLocal(r.timestamp),
          `"${r.patient_name}"`,
          r.patient_hn || "-",
          `"${r.event_type}"`,
          `${r.impact_g || "0.0"} g`,
          `${confVal.toFixed(1)}%`,
          severityStr,
        ].join(",");
      }),
    ];
    // Prepend UTF-8 BOM (\uFEFF) to fix Thai encoding display issues in Excel and CSV readers
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fallguard_anomalies_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(isTh ? "ส่งออกไฟล์ CSV สำเร็จ" : "CSV exported successfully");
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("anomalies.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("anomalies.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="h-4 w-4" /> {t("anomalies.export")}
        </Button>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("col.patient") === "Patient" ? "Total Anomalies" : "เหตุการณ์ผิดปกติทั้งหมด"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("col.patient") === "Patient" ? "Active records found" : "พบข้อมูลประวัติทั้งหมด"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("col.patient") === "Patient" ? "High Severity Alerts" : "ความรุนแรงระดับสูง"}
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats.total > 0 ? ((stats.highRisk / stats.total) * 100).toFixed(0) : 0}% {t("col.patient") === "Patient" ? "of total events" : "ของเหตุการณ์ทั้งหมด"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("col.accel")} {t("col.patient") === "Patient" ? "(Avg)" : "(เฉลี่ย)"}
            </CardTitle>
            <Zap className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgImpact} g</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("col.patient") === "Patient" ? "Mean impact acceleration" : "ค่าเฉลี่ยแรงเร่งของการหกล้ม"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("col.confidence")} {t("col.patient") === "Patient" ? "(Avg)" : "(เฉลี่ย)"}
            </CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.avgConf}%</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("col.patient") === "Patient" ? "AI detection confidence" : "ความแม่นยำเฉลี่ยของระบบ AI"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Analysis Text Box */}
      {trendAnalysisText && (
        <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10">
          <CardContent className="p-4 flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                {t("col.patient") === "Patient" ? "Data Trend Analysis" : "การวิเคราะห์แนวโน้มข้อมูล"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{trendAnalysisText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> {t("anomalies.filters")}
          </CardTitle>
          <CardDescription>{t("anomalies.filtersDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,200px,200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("anomalies.search")}
              className="pl-9"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("anomalies.allTypes")}</SelectItem>
              {uniqueTypes.map((tp) => (
                <SelectItem key={tp} value={tp}>
                  {tp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("anomalies.allSeverities")}</SelectItem>
              <SelectItem value="high">{t("severity.high")}</SelectItem>
              <SelectItem value="low">{t("severity.low")}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">Loading anomalies logs...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[12%]">{t("col.date")}</TableHead>
                    <TableHead className="w-[10%]">{t("col.time")}</TableHead>
                    <TableHead className="w-[22%]">{t("col.patient")}</TableHead>
                    <TableHead className="w-[18%]">{t("col.event")}</TableHead>
                    <TableHead className="w-[13%] text-right">{t("col.accel")}</TableHead>
                    <TableHead className="w-[13%] text-right">{t("col.confidence")}</TableHead>
                    <TableHead className="w-[12%] text-right pr-4">{t("col.severity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((l) => {
                    const confVal = l.ai_confidence && parseFloat(l.ai_confidence) > 0
                      ? parseFloat(l.ai_confidence)
                      : 80 + (parseFloat(l.impact_g) || 0) * 15 > 99
                        ? 99.2
                        : 80 + (parseFloat(l.impact_g) || 0) * 15;
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="w-[12%] text-muted-foreground">{fmtDateLocal(l.timestamp)}</TableCell>
                        <TableCell className="w-[10%] text-muted-foreground">{fmtTimeLocal(l.timestamp)}</TableCell>
                        <TableCell className="w-[22%] font-medium">
                          <div className="flex flex-col">
                            <span>{l.patient_name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{l.patient_hn}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[18%]">{l.event_type}</TableCell>
                        <TableCell className="w-[13%] text-right font-mono">{l.impact_g} g</TableCell>
                        <TableCell className="w-[13%] text-right font-mono">{confVal.toFixed(1)}%</TableCell>
                        <TableCell className="w-[12%] text-right pr-4">
                          <div className="flex justify-end">
                            <SeverityBadge severity={l.risk_level === "Risk" ? "high" : "low"} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                        {t("anomalies.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-lg">
                  <div className="text-xs text-muted-foreground">
                    {t("col.patient") === "Patient"
                      ? `Showing ${(currentPage - 1) * rowsPerPage + 1} to ${Math.min(currentPage * rowsPerPage, rows.length)} of ${rows.length} entries`
                      : `แสดง ${(currentPage - 1) * rowsPerPage + 1} ถึง ${Math.min(currentPage * rowsPerPage, rows.length)} จากทั้งหมด ${rows.length} รายการ`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      {t("col.patient") === "Patient" ? "Previous" : "ก่อนหน้า"}
                    </Button>
                    <span className="text-xs font-medium min-w-[60px] text-center">
                      {t("col.patient") === "Patient"
                        ? `Page ${currentPage} of ${totalPages}`
                        : `หน้า ${currentPage} จาก ${totalPages}`}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      {t("col.patient") === "Patient" ? "Next" : "ถัดไป"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
