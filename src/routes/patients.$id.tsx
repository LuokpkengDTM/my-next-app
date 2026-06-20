import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceDot,
  Label as RechartsLabel,
} from "recharts";
import {
  ArrowLeft,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Activity,
  WifiOff,
  Siren,
  MessageSquare,
  Send,
  XCircle,
  QrCode,
  Smartphone,
  User,
  Scale,
  Ruler,
  Compass,
  FileClock,
  Zap,
  Home,
  ChevronDown,
  ChevronUp,
  X,
  Download,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bmi, fmtDateTime } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { useT, useSettings } from "@/lib/settings-context";
import { api } from "@/lib/api-client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export const Route = createFileRoute("/patients/$id")({
  head: () => ({
    meta: [{ title: `Patient Monitoring — Fall Guard` }],
  }),
  component: PatientDetailPage,
});

type Pt = { t: number; value: number };

function PatientDetailPage() {
  const isMobileView =
    typeof window !== "undefined" && window.location.pathname.includes("/mobile");
  const t = useT();
  const { theme, lang } = useSettings();
  const isDark = theme === "dark";
  const chartGridStroke = isDark ? "#334155" : "#f1f5f9";
  const chartTextColor = isDark ? "#94a3b8" : "#64748b";
  const { id } = Route.useParams();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [serverIP, setServerIP] = useState<string>("");
  const [prediction, setPrediction] = useState<"normal" | "risk">("normal");
  const [aiConfidence, setAiConfidence] = useState<string>("0");
  const [currentSVM, setCurrentSVM] = useState<number>(0.0);
  const [status, setStatus] = useState("Disconnected");
  const [skinContact, setSkinContact] = useState<boolean>(true);

  const [accel, setAccel] = useState<Pt[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({ t: i, value: 0 })),
  );
  const [gyro, setGyro] = useState<Pt[]>(() =>
    Array.from({ length: 40 }, (_, i) => ({ t: i, value: 0 })),
  );
  const [logs, setLogs] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [openCommDialog, setOpenCommDialog] = useState(false);
  const [isProfileZoomed, setIsProfileZoomed] = useState(false);

  useEffect(() => {
    const loadPatientDetails = async () => {
      try {
        const patientsList = await api.getPatients();
        const p = patientsList.find((x: any) => x.id === id);
        if (p) {
          setPatient(p);
          if (p.status) {
            setPrediction(p.status as any);
          }
          // Fetch historical anomalies
          const allAnomalies = await api.getAnomalies();
          const patientAnoms = allAnomalies.filter(
            (a: any) => a.patient_hn === p.hn || a.patient_name === p.name,
          );
          setLogs(patientAnoms);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadPatientDetails();

    const loadServerIP = async () => {
      try {
        const res = await api.getServerIP();
        if (res && res.ip && res.ip !== "127.0.0.1") {
          setServerIP(res.ip);
        } else {
          setServerIP(window.location.hostname);
        }
      } catch (err) {
        setServerIP(window.location.hostname);
      }
    };
    loadServerIP();
  }, [id]);

  useEffect(() => {
    let isClosed = false;
    let ws: WebSocket | null = null;
    let pollInterval: any = null;

    const startPollingFallback = () => {
      if (pollInterval) return;
      pollInterval = setInterval(async () => {
        try {
          const patientsList = await api.getPatients();
          const p = patientsList.find((x: any) => x.id === id);
          if (p && !isClosed) {
            setPatient(p);
            if (p.status) setPrediction(p.status as any);
          }
        } catch (err) {}
      }, 5000);
    };

    const stopPollingFallback = () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const connectWS = () => {
      if (isClosed) return;
      ws = api.connectPatientWS(id, (data) => {
        if (isClosed) return;
        if (data) {
          setPatient(data);
          if (data.status) {
            setPrediction(data.status as any);
          }
        }
      });

      ws.onopen = () => {
        stopPollingFallback();
      };

      ws.onclose = () => {
        if (!isClosed) {
          startPollingFallback();
          setTimeout(connectWS, 5000);
        }
      };
    };

    connectWS();

    return () => {
      isClosed = true;
      if (ws) ws.close();
      stopPollingFallback();
    };
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return toast.error("Please enter a message");
    if (!confirm(t("patient.comm.confirmSend").replace("{msg}", messageInput))) return;
    setSendingMessage(true);
    try {
      await api.sendPatientMessage(patient.id, messageInput);
      toast.success(t("patient.comm.successSend"));
      setPatient((prev: any) => ({ ...prev, live_message: messageInput }));
    } catch (err) {
      toast.error(t("patient.comm.failedSend"));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendQuickMessage = async (msg: string) => {
    if (!confirm(t("patient.comm.confirmSend").replace("{msg}", msg))) return;
    setSendingMessage(true);
    try {
      await api.sendPatientMessage(patient.id, msg);
      toast.success(`${t("patient.comm.successSend")}: "${msg}"`);
      setPatient((prev: any) => ({ ...prev, live_message: msg }));
    } catch (err) {
      toast.error(t("patient.comm.failedSend"));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleClearMessage = async () => {
    if (!confirm(t("patient.comm.confirmClear"))) return;
    setSendingMessage(true);
    try {
      await api.sendPatientMessage(patient.id, "");
      setMessageInput("");
      toast.success(t("patient.comm.successClear"));
      setPatient((prev: any) => ({ ...prev, live_message: "" }));
    } catch (err) {
      toast.error(t("patient.comm.failedClear"));
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
    if (!patient || !patient.device_id) return;

    let tickCount = 40;

    const interval = setInterval(async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }
      try {
        const allData = await api.getSensorData();
        const myDevice = allData[patient.device_id];
        if (myDevice) {
          setStatus(myDevice.status);

          const currentSkinContact = myDevice.skin_contact !== false;

          if (myDevice.status === "Connected") {
            const rawRisk = myDevice.risk_label;
            const isRisk = rawRisk === "High Risk" || rawRisk === "Risk";
            setPrediction(isRisk ? "risk" : "normal");
            setAiConfidence(myDevice.confidence);
            setCurrentSVM(myDevice.acc_svm);
            setSkinContact(currentSkinContact);

            const accSvm =
              typeof myDevice.acc_svm === "number"
                ? myDevice.acc_svm
                : Math.sqrt(
                    (myDevice.acc_x || 0) ** 2 +
                      (myDevice.acc_y || 0) ** 2 +
                      (myDevice.acc_z || 0) ** 2,
                  );
            const gyroSvm =
              typeof myDevice.gyro_svm === "number"
                ? myDevice.gyro_svm
                : Math.sqrt(
                    (myDevice.gyro_x || 0) ** 2 +
                      (myDevice.gyro_y || 0) ** 2 +
                      (myDevice.gyro_z || 0) ** 2,
                  );

            setAccel((prev) => {
              const next = [...prev.slice(1), { t: 39, value: accSvm }];
              return next.map((d, index) => ({ t: index, value: d.value }));
            });
            setGyro((prev) => {
              const next = [...prev.slice(1), { t: 39, value: gyroSvm }];
              return next.map((d, index) => ({ t: index, value: d.value }));
            });
          } else {
            setPrediction("normal");
            setAiConfidence("0");
            setCurrentSVM(0.0);
            setSkinContact(true); // default to true if disconnected to avoid double warnings
          }
        }
      } catch (err) {}
    }, 100);

    return () => clearInterval(interval);
  }, [patient, lang]);

  // Aggregate weekly stats based on patient logs
  const patientWeeklyData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const counts = [0, 0, 0, 0, 0, 0, 0];

    logs.forEach((log) => {
      try {
        const date = new Date(log.timestamp);
        const day = (date.getDay() + 6) % 7;
        counts[day]++;
      } catch (e) {}
    });

    return days.map((d, i) => ({
      label: d,
      risk: counts[i],
    }));
  }, [logs]);

  // Calculate day vs night ratio
  const timeRatio = useMemo(() => {
    let night = 0;
    let day = 0;
    logs.forEach((log) => {
      try {
        const date = new Date(log.timestamp);
        const hour = date.getHours();
        if (hour >= 22 || hour < 6) {
          night++;
        } else {
          day++;
        }
      } catch (e) {}
    });
    const total = night + day;
    if (total === 0) return { night: "50%", day: "50%" };
    return {
      night: `${Math.round((night / total) * 100)}%`,
      day: `${Math.round((day / total) * 100)}%`,
    };
  }, [logs]);

  const mobileUrl = useMemo(() => {
    if (!patient) return "";
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
      const isLocalIP = /^192\.168\./.test(hostname) || /^10\./.test(hostname) || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);
      
      if (!isLocalhost && !isLocalIP) {
        // If accessed via tunnel or public domain, use the current origin
        return `${window.location.origin}/patients/${patient.id}/mobile`;
      }
    }
    const host =
      serverIP || (typeof window !== "undefined" ? window.location.hostname : "localhost");
    return `http://${host}:3000/patients/${patient.id}/mobile`;
  }, [patient, serverIP]);

  const exportPatientCSV = () => {
    if (logs.length === 0) return toast.error(lang === "th" ? "ไม่มีข้อมูลให้ส่งออก" : "No data to export");
    const isTh = lang === "th";
    const headers = isTh
      ? ["วันที่", "เวลา", "ชื่อผู้ป่วย", "HN", "ประเภทเหตุการณ์", "ความเร่ง (g)", "ความมั่นใจ", "ระดับความรุนแรง"]
      : ["Date", "Time", "Patient Name", "HN", "Event Type", "Impact (g)", "Confidence", "Severity"];
      
    const csvRows = [
      headers.join(","),
      ...logs.map((r) => {
        const confVal = r.ai_confidence && parseFloat(r.ai_confidence) > 0
          ? parseFloat(r.ai_confidence)
          : 80 + (parseFloat(r.impact_g) || 0) * 15 > 99
            ? 99.2
            : 80 + (parseFloat(r.impact_g) || 0) * 15;
            
        const severityStr = r.risk_level === "Risk"
          ? (isTh ? "สูง" : "High")
          : (isTh ? "ต่ำ" : "Low");

        let dateStr = "-";
        let timeStr = "-";
        try {
          const d = new Date(r.timestamp);
          dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
          timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
        } catch (e) {}

        return [
          dateStr,
          timeStr,
          `"${patient.name}"`,
          patient.hn || "-",
          `"${r.event_type}"`,
          `${r.impact_g || "0.0"} g`,
          `${confVal.toFixed(1)}%`,
          severityStr,
        ].join(",");
      }),
    ];
    
    const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fallguard_${patient.name.replace(/\s+/g, "_")}_anomalies_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute intelligent data trends for this patient
  const trendAnalysisText = useMemo(() => {
    const total = logs.length;
    if (total === 0) return "";
    
    const highRisk = logs.filter((r) => r.risk_level === "Risk").length;
    const highRiskPct = total > 0 ? ((highRisk / total) * 100).toFixed(0) : "0";
    
    const hours = logs.map((r) => {
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
    
    const isTh = lang === "th";
    const peakTimeStr = peakHour !== -1 ? `${peakHour.toString().padStart(2, "0")}:00 - ${(peakHour + 1).toString().padStart(2, "0")}:00` : "N/A";
    
    if (isTh) {
      return `วิเคราะห์แนวโน้ม: พบเหตุการณ์ผิดปกติทั้งหมด ${total} ครั้ง โดยเป็นเหตุการณ์ความเสี่ยงสูง ${highRisk} ครั้ง (${highRiskPct}%). ช่วงเวลาที่เกิดเหตุการณ์มากที่สุดคือ ${peakTimeStr}. แนะนำให้เพิ่มความถี่ในการเฝ้าระวังผู้ป่วยในช่วงเวลาดังกล่าวเป็นพิเศษเพื่อป้องกันการหกล้ม`;
    }
    return `Trend Analysis: A total of ${total} anomalies were analyzed, with ${highRisk} flagged as high-risk (${highRiskPct}%). The peak activity window was detected between ${peakTimeStr}. Caregivers should consider scheduling extra check-ins during these hours.`;
  }, [logs, lang]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] p-16 text-center text-slate-400">
        Loading patient telemetry data...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto w-full max-w-[1600px] p-16 text-center text-slate-400">
        Patient details not found.
      </div>
    );
  }

  if (isMobileView) {
    return <Outlet />;
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">
      {/* Breadcrumbs & Navigation / Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
          >
            <Link to="/patients">
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("patient.back")}
            </Link>
          </Button>
          <span className="text-sm text-slate-300 dark:text-slate-700">/</span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {patient.name}
          </span>
        </div>

        {/* Action icons toolbar */}
        <TooltipProvider>
          <div className="flex items-center gap-2">

            {/* Communication Dialog */}
            <Dialog open={openCommDialog} onOpenChange={setOpenCommDialog}>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="relative h-9 w-9 cursor-pointer rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-none bg-white dark:bg-slate-900"
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      {patient?.live_message && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-905 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs border-0">
                  {t("patient.comm.title")}
                </TooltipContent>
              </ShadcnTooltip>

              <DialogContent className="sm:max-w-md text-left border-slate-200 dark:border-slate-800 bg-popover text-popover-foreground p-0 overflow-hidden rounded-2xl">
                <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <DialogTitle className="text-base font-bold flex items-center gap-2 text-slate-850 dark:text-slate-100">
                    <MessageSquare className="h-4.5 w-4.5 text-blue-500" />
                    {t("patient.comm.title")}
                  </DialogTitle>
                </DialogHeader>

                {/* Single Panel Controls */}
                <div className="p-6 space-y-5">
                  {/* Active Message Banner with Cross Icon to clear */}
                  {patient?.live_message ? (
                    <div className="flex items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/15 border border-amber-200/50 dark:border-amber-900/40 p-3 rounded-xl text-xs font-medium">
                      <div className="flex items-center gap-2 text-amber-850 dark:text-amber-300">
                        <span className="flex h-2 w-2 relative shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        <span className="leading-snug">{t("patient.comm.active").split('"{msg}"')[0]}<strong className="font-extrabold text-slate-900 dark:text-slate-100">"{patient.live_message}"</strong></span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400 cursor-pointer shrink-0 transition-colors"
                        onClick={handleClearMessage}
                        title={t("patient.comm.clear")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-xl text-center">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                          {t("patient.comm.none")}
                        </p>
                    </div>
                  )}

                  {/* Custom Message Field & Form */}
                  <form onSubmit={handleSendMessage} className="space-y-3">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="popup-live-msg"
                        className="text-[10px] uppercase font-bold tracking-wider text-slate-550 dark:text-slate-400 block"
                      >
                        {t("patient.comm.new")}
                      </Label>
                      <Input
                        id="popup-live-msg"
                        placeholder={t("patient.comm.placeholder")}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sendingMessage}
                        className="h-9 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={sendingMessage || !messageInput.trim()}
                        className="flex-1 text-xs h-8 cursor-pointer rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow text-white border-0 font-bold"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" /> {t("patient.comm.send")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClearMessage}
                        disabled={sendingMessage || !patient?.live_message}
                        className="text-xs h-8 px-3 cursor-pointer rounded-lg border-red-200 dark:border-red-900/40 text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" /> {t("patient.comm.clear")}
                      </Button>
                    </div>
                  </form>

                  {/* Quick Presets */}
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-555 dark:text-slate-400 block">
                      {t("patient.comm.presets")}
                    </Label>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        className="w-full text-left flex items-center gap-2 text-[11px] py-1.5 px-3 cursor-pointer font-semibold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        onClick={() => handleSendQuickMessage(t("patient.comm.preset.sitdown"))}
                        disabled={sendingMessage}
                      >
                        <span className="text-xs">⚠️</span> {t("patient.comm.preset.sitdown")}
                      </button>
                      <button
                        type="button"
                        className="w-full text-left flex items-center gap-2 text-[11px] py-1.5 px-3 cursor-pointer font-semibold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        onClick={() => handleSendQuickMessage(t("patient.comm.preset.coming"))}
                        disabled={sendingMessage}
                      >
                        <span className="text-xs">🔔</span> {t("patient.comm.preset.coming")}
                      </button>
                      <button
                        type="button"
                        className="w-full text-left flex items-center gap-2 text-[11px] py-1.5 px-3 cursor-pointer font-semibold bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        onClick={() => handleSendQuickMessage(t("patient.comm.preset.wristband"))}
                        disabled={sendingMessage}
                      >
                        <span className="text-xs">⌚</span> {t("patient.comm.preset.wristband")}
                      </button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* QR Code Dialog */}
            <Dialog>
              <ShadcnTooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 cursor-pointer rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-none bg-white dark:bg-slate-900"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-905 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs border-0">
                  {t("patient.comm.qr.tooltip")}
                </TooltipContent>
              </ShadcnTooltip>
              <DialogContent className="sm:max-w-md text-center border-slate-200 dark:border-slate-800 bg-popover text-popover-foreground rounded-2xl">
                <DialogHeader>
                  <DialogTitle>{t("patient.comm.qr.title")}</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {t("patient.comm.qr.desc")}
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-900 my-2">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`}
                    alt="QR Code"
                    className="w-[200px] h-[200px] rounded-lg shadow-sm border border-slate-200 dark:border-slate-850 bg-white p-2"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 font-mono select-all break-all max-w-[280px]">
                    {mobileUrl}
                  </span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[11px] p-3 rounded-xl leading-normal text-left">
                  {t("patient.comm.qr.tip")}
                </div>
              </DialogContent>
            </Dialog>

            {/* Mobile View Shortcut Link */}
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 cursor-pointer rounded-lg border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-none bg-white dark:bg-slate-900"
                >
                  <a href={`/patients/${patient.id}/mobile`} target="_blank" rel="noreferrer">
                    <Smartphone className="h-4 w-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-slate-905 text-white dark:bg-white dark:text-slate-900 font-semibold text-xs border-0">
                {t("patient.comm.mobile.tooltip")}
              </TooltipContent>
            </ShadcnTooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Patient Profile Card (Moved to the top, above the grid) */}
      <Card className="shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 rounded-xl">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xl font-bold text-slate-700 dark:text-slate-350 font-sans">
                {(patient.name || "")
                  .split(" ")
                  .map((n: string) => (n ? n[0] : ""))
                  .join("")}
              </div>
              <div className="font-sans">
                <h2 className="text-lg font-bold leading-tight text-slate-900 dark:text-slate-100">
                  {patient.name}
                </h2>
              </div>
            </div>

            {/* Toggle Dropdown Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsProfileZoomed(!isProfileZoomed)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg py-1.5 px-3 select-none transition-all border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
            >
              <span>{isProfileZoomed ? t("patient.details.hide") : t("patient.details.show")}</span>
              {isProfileZoomed ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </Button>
          </div>

          {isProfileZoomed && (
            <>
              <Separator className="my-5" />
              <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-sans">
                <Info
                  icon={<User className="h-3.5 w-3.5" />}
                  label={t("field.age")}
                  value={t("patient.telemetry.ageVal").replace("{age}", String(patient.age))}
                />
                <Info
                  icon={<Compass className="h-3.5 w-3.5" />}
                  label={t("field.gender")}
                  value={patient.gender === "Female" ? t("gender.female") : t("gender.male")}
                />
                <Info
                  icon={<Scale className="h-3.5 w-3.5" />}
                  label={t("field.weight")}
                  value={`${patient.weight} kg`}
                />
                <Info
                  icon={<Ruler className="h-3.5 w-3.5" />}
                  label={t("field.height")}
                  value={`${patient.height} cm`}
                />
                <Info
                  icon={<Zap className="h-3.5 w-3.5" />}
                  label={t("col.bmi")}
                  value={bmi(patient).toString()}
                />
                <Info
                  icon={<Home className="h-3.5 w-3.5" />}
                  label={t("field.room")}
                  value={patient.room || "-"}
                />
              </dl>
            </>
          )}
        </CardContent>
      </Card>

      {/* Main Grid: 2 Columns (Main content / Right detail sidebar) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,380px]">
        {/* Left Column: Live Telemetry, Charts */}
        <div className="space-y-6">
          {/* Signal Connection Indicator bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl shadow-none">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  status === "Connected" ? "bg-green-500" : "bg-slate-400 dark:bg-slate-600",
                )}
              />
              {t("patient.telemetry.sensorStatus")}{" "}
              {status === "Connected"
                ? t("patient.telemetry.connected")
                : t("patient.telemetry.disconnected")}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {t("patient.telemetry.deviceId")}{" "}
              <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                {patient.device_id || t("patient.telemetry.noDevice")}
              </span>
            </div>
          </div>

          {/* AI Prediction Status Banner */}
          <Card
            className={cn(
              "shadow-none border overflow-hidden rounded-xl",
              prediction === "risk"
                ? "border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-950/20"
                : "border-green-100 dark:border-green-900 bg-green-50/20 dark:bg-green-950/10",
            )}
          >
            <CardContent className="p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2",
                    prediction === "risk"
                      ? "bg-red-100 dark:bg-red-950/55 text-red-650 dark:text-red-400 border-red-200 dark:border-red-900/50"
                      : "bg-green-100 dark:bg-green-950/55 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50",
                  )}
                >
                  {prediction === "risk" ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t("patient.aiPrediction")}
                  </div>
                  <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">
                    {prediction === "risk" ? t("patient.fallRisk") : t("patient.normalActivity")}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {t("patient.model")} V.2 · SVM:{" "}
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {currentSVM.toFixed(2)}g
                    </span>
                  </div>
                </div>
              </div>

              {/* Confidence Progress Bar */}
              <div className="w-full sm:w-64 space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>{lang === "th" ? "ความน่าจะเป็น (AI Confidence)" : "AI Confidence"}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {aiConfidence}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200/60 dark:border-slate-850">
                  <div
                    className={cn(
                      "h-full transition-all duration-700 rounded-full",
                      prediction === "risk" ? "bg-red-500" : "bg-green-500",
                    )}
                    style={{ width: `${aiConfidence}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wearable Alert (Skin contact or offline status) */}
          {(status === "Disconnected" || !skinContact) && patient?.device_id && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/20 p-4 text-red-800 dark:text-red-300 shadow-none">
              <WifiOff className="h-5 w-5 shrink-0 mt-0.5 text-red-500" />
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                  {t("patient.telemetry.wearWarning")}
                </p>
                <p className="text-xs font-medium leading-relaxed text-red-600 dark:text-red-400">
                  {status === "Disconnected"
                    ? t("patient.telemetry.disconnectedDesc")
                    : t("patient.telemetry.looseDesc")}
                </p>
              </div>
            </div>
          )}

          {/* Real-time Oscilloscope Telemetry charts */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <RealtimeChart
              title={t("patient.realtime.accel")}
              unit="g"
              data={accel}
              liveLabel={t("patient.realtime.live")}
              color="#2563eb"
              xLabel={lang === "th" ? "เวลา (จุดข้อมูล)" : "Time (Samples)"}
              yLabel={lang === "th" ? "ความเร่ง SVM (g)" : "Acceleration SVM (g)"}
              desc={lang === "th" ? "กราฟความเร่ง: บ่งบอกความแรงของการเคลื่อนไหว (ค่าเวกเตอร์ร่วม SVM) ใช้เพื่อตรวจวัดระดับแรงกระแทกเฉียบพลันจากการหกล้มของร่างกาย" : "Accelerometer: Indicates the combined physical movement acceleration SVM, showing impact force magnitude to detect falls."}
            />
            <RealtimeChart
              title={t("patient.realtime.gyro")}
              unit="°/s"
              data={gyro}
              liveLabel={t("patient.realtime.live")}
              color="#e11d48"
              xLabel={lang === "th" ? "เวลา (จุดข้อมูล)" : "Time (Samples)"}
              yLabel={lang === "th" ? "ความเร็วเชิงมุม SVM (°/s)" : "Angular Velocity SVM (°/s)"}
              desc={lang === "th" ? "กราฟไจโรสโคป: บ่งบอกความเร็วการหมุนและปรับเปลี่ยนมุมของร่างกาย ใช้ตรวจวัดสภาวะการเสียหลักทรงตัวหรือการพลิกตัวอย่างรวดเร็ว" : "Gyroscope: Indicates body rotation velocity SVM, showing change in orientation to detect balance loss or rapid flips."}
            />
          </div>
        </div>

        {/* Right Column (Sidebar): Trend Analysis and Patient Anomaly logs */}
        <div className="space-y-6">
          {/* Trend Analysis */}
          <Card className="shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                <Activity className="h-4.5 w-4.5 text-blue-500" /> {t("patient.trend.title")}
              </CardTitle>
              <CardDescription className="text-xs">
                {t("patient.trend.desc").replace("{n}", String(logs.length))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={patientWeeklyData}>
                      <CartesianGrid
                        stroke={chartGridStroke}
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        stroke={chartTextColor}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke={chartTextColor}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: isDark ? "#1e293b" : "#ffffff",
                          border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
                          borderRadius: 8,
                          fontSize: 11,
                          color: isDark ? "#f8fafc" : "#0f172a",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="risk"
                        stroke="#dc2626"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <TimeStat
                    icon={<Moon className="h-4 w-4" />}
                    label={t("patient.time.night")}
                    value={timeRatio.night}
                    tone="risk"
                  />
                  <TimeStat
                    icon={<Sun className="h-4 w-4" />}
                    label={t("patient.time.day")}
                    value={timeRatio.day}
                    tone="primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {trendAnalysisText && (
            <Card className="border-l-4 border-l-blue-500 bg-blue-500/5 dark:bg-blue-500/10">
              <CardContent className="p-4 flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-400">
                    {lang === "th" ? "การวิเคราะห์แนวโน้มข้อมูล" : "Data Trend Analysis"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{trendAnalysisText}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Patient Anomaly logs */}
          <Card className="shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-800 dark:text-slate-100">
                  <FileClock className="h-4.5 w-4.5 text-blue-500" />
                  {t("patient.logs.title")}
                </CardTitle>
                <CardDescription className="text-xs">{t("patient.logs.desc")}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportPatientCSV}
                className="h-8 px-2.5 flex items-center gap-1 text-[11px] font-semibold border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-sm"
              >
                <Download className="h-3.5 w-3.5 text-blue-500" /> {lang === "th" ? "ส่งออก" : "Export"}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 dark:bg-slate-950/30 hover:bg-slate-50/50 dark:hover:bg-slate-950/30">
                    <TableHead className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {t("col.time")}
                    </TableHead>
                    <TableHead className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {t("col.event")}
                    </TableHead>
                    <TableHead className="text-right text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {t("col.accel")}
                    </TableHead>
                    <TableHead className="text-right text-slate-500 dark:text-slate-400 text-xs font-semibold">
                      {t("col.severity")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs font-medium"
                      >
                        {t("patient.telemetry.emptyLogs")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.slice(0, 8).map((l) => (
                      <TableRow
                        key={l.id}
                        className="hover:bg-slate-50/30 dark:hover:bg-slate-850/30"
                      >
                        <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                          {fmtDateTime(l.timestamp)}
                        </TableCell>
                        <TableCell className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {l.event_type}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                          {l.impact_g} g
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <SeverityBadge severity={l.risk_level === "Risk" ? "high" : "low"} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const tooltipStyle = {
  background: "#ffffff",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  fontSize: 12,
  color: "#0f172a",
};

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50/50 dark:bg-slate-950/30 px-3 py-2 border border-slate-100 dark:border-slate-850 flex items-start gap-2">
      {icon && <div className="text-slate-500 dark:text-slate-400 mt-0.5">{icon}</div>}
      <div>
        <dt className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </dt>
        <dd className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{value}</dd>
      </div>
    </div>
  );
}

function RealtimeChart({
  title,
  unit,
  data,
  liveLabel,
  color = "#2563eb",
  xLabel,
  yLabel,
  desc,
}: {
  title: string;
  unit: string;
  data: Pt[];
  liveLabel: string;
  color?: string;
  xLabel: string;
  yLabel: string;
  desc: string;
}) {
  const { theme } = useSettings();
  const isDark = theme === "dark";
  const gridStroke = isDark ? "#334155" : "#f1f5f9";
  const axisColor = isDark ? "#94a3b8" : "#64748b";

  const currentValue = data && data.length > 0 ? data[data.length - 1].value.toFixed(2) : "0.00";

  return (
    <Card className="shadow-none border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
      <div>
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {title}
            </CardTitle>
            <Badge
              variant="outline"
              className="gap-1.5 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs py-1.5 px-3 font-bold shadow-sm shrink-0"
            >
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> {currentValue} {unit}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: 15, right: 15, top: 15, bottom: 20 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="t"
                  stroke={axisColor}
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  label={{ value: xLabel, position: "insideBottom", fill: axisColor, offset: -10, style: { fontSize: 9 } }}
                />
                <YAxis 
                  stroke={axisColor} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  label={{ value: yLabel, angle: -90, position: "insideLeft", fill: axisColor, offset: 0, style: { textAnchor: 'middle', fontSize: 9 } }}
                />
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    border: `1px solid ${isDark ? "#334155" : "#cbd5e1"}`,
                    color: isDark ? "#f8fafc" : "#0f172a",
                    fontSize: 11,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-slate-500 dark:text-slate-400 font-medium px-1">
            <Legend color={color} label="SVM (Combined)" />
          </div>
        </CardContent>
      </div>
      <div className="px-4 pb-4 pt-1 border-t border-slate-50 dark:border-slate-850/40 text-[10.5px] leading-relaxed text-slate-550 dark:text-slate-400">
        {desc}
      </div>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} /> {label}
    </span>
  );
}

function TimeStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "risk" | "primary";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3.5 shadow-none",
        tone === "risk"
          ? "border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20"
          : "border-blue-200 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-950/10",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span
          className={cn(
            tone === "risk" ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400",
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-1.5 text-2xl font-black text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}

export function SeverityBadge({ severity }: { severity: "high" | "medium" | "low" }) {
  const t = useT();
  const map = {
    high: "bg-red-500/15 text-red-500 border-red-500/30",
    medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    low: "bg-muted text-muted-foreground border-border",
  } as const;
  const label = t(`severity.${severity}` as const);
  const icon = severity === "high" ? "▲" : severity === "medium" ? "■" : "●";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold select-none",
        map[severity],
      )}
    >
      <span aria-hidden className="text-[8px]">
        {icon}
      </span>{" "}
      {label}
    </span>
  );
}
