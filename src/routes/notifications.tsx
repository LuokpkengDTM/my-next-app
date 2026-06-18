import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Bell,
  Search,
  CheckCheck,
  AlertTriangle,
  Siren,
  MessageSquare,
  Activity,
  ArrowRight,
  Filter,
  Trash2,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useSettings, useT } from "@/lib/settings-context";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [{ title: "Notifications — Fall Guard" }],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const t = useT();
  const { lang } = useSettings();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [severity, setSeverity] = useState<string>("all");
  const [readCutoff, setReadCutoff] = useState<number>(0);

  // Load list and read cutoff
  const loadNotifications = async () => {
    try {
      const data = await api.getAnomalies();
      setList(data);
    } catch (err) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const savedCutoff = localStorage.getItem("sc-notifications-read-cutoff");
    if (savedCutoff) {
      setReadCutoff(parseInt(savedCutoff, 10));
    }

    return () => {
      localStorage.setItem("sc-notifications-read-cutoff", Date.now().toString());
    };
  }, []);

  const handleMarkAllRead = () => {
    const now = Date.now();
    localStorage.setItem("sc-notifications-read-cutoff", now.toString());
    setReadCutoff(now);
    toast.success(lang === "th" ? "ทำเครื่องหมายอ่านแล้วทั้งหมด" : "All notifications marked as read");
  };

  // Get unique event types for filtering
  const uniqueTypes = useMemo(() => {
    const set = new Set<string>();
    list.forEach((item) => {
      if (item.event_type) set.add(item.event_type);
    });
    return Array.from(set);
  }, [list]);

  // Filter list
  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const name = item.patient_name || "";
      const device = item.device_id || "";
      const itemType = item.event_type || "";
      const isRisk = item.risk_level === "Risk";
      const isInfo = item.risk_level === "Info";
      const itemSeverity = isRisk ? "high" : isInfo ? "low" : "medium";

      if (type !== "all" && itemType !== type) return false;
      if (severity !== "all" && itemSeverity !== severity) return false;
      if (
        q &&
        !name.toLowerCase().includes(q.toLowerCase()) &&
        !device.toLowerCase().includes(q.toLowerCase())
      )
        return false;

      return true;
    });
  }, [q, type, severity, list]);

  // Date/Time formatting helpers
  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "-";
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(lang === "th" ? "th-TH" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Check if unread
  const isUnread = (iso: string) => {
    try {
      const ts = new Date(iso).getTime();
      return ts > readCutoff;
    } catch {
      return false;
    }
  };

  // Count unread
  const unreadCount = useMemo(() => {
    return list.filter((item) => isUnread(item.timestamp)).length;
  }, [list, readCutoff]);

  // Risk & Info counters
  const highRiskCount = useMemo(() => {
    return list.filter((item) => item.risk_level === "Risk").length;
  }, [list]);

  const infoCount = useMemo(() => {
    return list.filter((item) => item.risk_level === "Info" || !item.risk_level).length;
  }, [list]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
            <Bell className="h-7 w-7 text-primary" />
            {lang === "th" ? "การแจ้งเตือนและเหตุการณ์" : "System Notifications"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "th"
              ? "ดูบันทึกเหตุการณ์ผิดปกติ การกดปุ่มฉุกเฉิน และข้อความจากอุปกรณ์ทั้งหมด"
              : "Monitor anomalous events, emergency button presses, and device statuses."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="gap-2 cursor-pointer"
          >
            <CheckCheck className="h-4 w-4" />
            {lang === "th" ? "อ่านทั้งหมดแล้ว" : "Mark all read"}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {lang === "th" ? "ความเสี่ยงอันตราย (สูง)" : "Danger Alerts (High)"}
              </p>
              <h3 className="text-3xl font-extrabold text-red-500 mt-1">{highRiskCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Siren className="h-5 w-5 text-red-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {lang === "th" ? "แจ้งเตือนทั่วไป / ข้อมูล" : "Info Messages"}
              </p>
              <h3 className="text-3xl font-extrabold text-blue-500 mt-1">{infoCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="pt-4 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {lang === "th" ? "ยังไม่ได้เปิดอ่าน" : "Unread Alerts"}
              </p>
              <h3 className="text-3xl font-extrabold text-amber-500 mt-1">{unreadCount}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="pt-6 grid gap-3 grid-cols-1 md:grid-cols-[1fr,200px,200px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={lang === "th" ? "ค้นหาชื่อผู้ป่วย หรือ รหัสอุปกรณ์..." : "Search patient name or device..."}
              className="pl-9"
            />
          </div>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder={lang === "th" ? "ทุกประเภท" : "All event types"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "th" ? "ทุกเหตุการณ์" : "All event types"}</SelectItem>
              {uniqueTypes.map((tp) => (
                <SelectItem key={tp} value={tp}>
                  {tp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger>
              <SelectValue placeholder={lang === "th" ? "ทุกระดับความรุนแรง" : "All severities"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{lang === "th" ? "ทุกระดับ" : "All severities"}</SelectItem>
              <SelectItem value="high">{lang === "th" ? "อันตราย / ความเสี่ยงสูง" : "Danger / High"}</SelectItem>
              <SelectItem value="medium">{lang === "th" ? "ระดับปานกลาง" : "Medium"}</SelectItem>
              <SelectItem value="low">{lang === "th" ? "ข้อมูล / ทั่วไป" : "Info / Low"}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            {lang === "th" ? "กำลังโหลดข้อมูลแจ้งเตือน..." : "Loading notifications feed..."}
          </div>
        ) : filteredList.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground shadow-sm">
            {lang === "th" ? "ไม่พบประวัติแจ้งเตือนที่ตรงกับตัวกรอง" : "No notifications found matching filter settings."}
          </Card>
        ) : (
          filteredList.map((item) => {
            const isHigh = item.risk_level === "Risk";
            const isInfo = item.risk_level === "Info";
            const isSOS = item.event_type?.includes("SOS");
            const unread = isUnread(item.timestamp);

            return (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-xl shadow-sm transition-all duration-200 bg-card hover:shadow-md border-l-4",
                  isHigh ? "border-l-red-500" : isInfo ? "border-l-blue-500" : "border-l-amber-500",
                  unread && "bg-muted/10 border-r border-r-amber-500/10"
                )}
              >
                {/* Left side: Icon, Details */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "mt-1 p-2 rounded-full shrink-0",
                      isHigh ? "bg-red-500/10 text-red-500" : isInfo ? "bg-blue-500/10 text-blue-500" : "bg-amber-500/10 text-amber-500"
                    )}
                  >
                    {isSOS ? (
                      <Siren className={cn("h-5 w-5", unread && "animate-pulse")} />
                    ) : isHigh ? (
                      <Activity className={cn("h-5 w-5", unread && "animate-pulse")} />
                    ) : isInfo ? (
                      <MessageSquare className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground text-sm">
                        {item.patient_name || (lang === "th" ? "ไม่ระบุชื่อ" : "Unknown")}
                      </span>
                      {item.patient_hn && (
                        <Badge variant="outline" className="font-mono text-[10px] px-1 py-0 select-none">
                          {item.patient_hn}
                        </Badge>
                      )}
                      {unread && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{item.event_type}</span>
                      {item.details ? ` · ${item.details}` : ""}
                      {item.impact_g ? ` · Acceleration: ${item.impact_g}g` : ""}
                      {item.confidence ? ` · Confidence: ${item.confidence}%` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDate(item.timestamp)} · {formatTime(item.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Right side: Action Link */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Badge
                    variant={isHigh ? "destructive" : isInfo ? "secondary" : "warning" as any}
                    className="text-[10px] font-bold"
                  >
                    {isHigh ? (lang === "th" ? "อันตราย" : "Danger") : isInfo ? (lang === "th" ? "ทั่วไป" : "Info") : (lang === "th" ? "ปานกลาง" : "Warning")}
                  </Badge>

                  {item.patient_name && (
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 hover:bg-muted cursor-pointer" title="ดูรายละเอียดผู้ป่วย">
                      {/* Search for patient database link */}
                      <Link to="/anomalies">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
