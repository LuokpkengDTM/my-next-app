import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Search, Download, Filter } from "lucide-react";
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

  const exportCSV = () => {
    if (rows.length === 0) return toast.error("No data to export");
    const headers = ["Date", "Time", "Patient Name", "HN", "Event Type", "Impact (g)", "Severity"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) =>
        [
          fmtDateLocal(r.timestamp),
          fmtTimeLocal(r.timestamp),
          `"${r.patient_name}"`,
          r.patient_hn || "-",
          `"${r.event_type}"`,
          r.impact_g || "0.0",
          r.risk_level === "Risk" ? "High" : "Low",
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fallguard_anomalies_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col.date")}</TableHead>
                  <TableHead>{t("col.time")}</TableHead>
                  <TableHead>{t("col.patient")}</TableHead>
                  <TableHead>{t("col.event")}</TableHead>
                  <TableHead className="text-right">{t("col.accel")}</TableHead>
                  <TableHead>{t("col.severity")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-muted-foreground">{fmtDateLocal(l.timestamp)}</TableCell>
                    <TableCell className="text-muted-foreground">{fmtTimeLocal(l.timestamp)}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{l.patient_name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{l.patient_hn}</span>
                      </div>
                    </TableCell>
                    <TableCell>{l.event_type}</TableCell>
                    <TableCell className="text-right font-mono">{l.impact_g} g</TableCell>
                    <TableCell>
                      <SeverityBadge severity={l.risk_level === "Risk" ? "high" : "low"} />
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      {t("anomalies.noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
