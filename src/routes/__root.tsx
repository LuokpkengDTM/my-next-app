import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { Bell, Search, LogOut, User, Mail, Phone, Save, Siren, ExternalLink, Check, Maximize2, Minimize2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsProvider, useSettings, useT } from "@/lib/settings-context";
import { SettingsControls } from "@/components/settings-controls";
import { LoginView } from "@/components/login-view";
import { api, clearToken } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back to the dashboard.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fall Guard — AI Fall Risk Monitoring" },
      { name: "description", content: "Real-time AI-powered fall risk monitoring dashboard for caregivers." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ email: string; phone: string } | null>(null);
  const [activeAlertPatient, setActiveAlertPatient] = useState<any>(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<string[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAlertMinimized, setIsAlertMinimized] = useState(false);

  useEffect(() => {
    if (activeAlertPatient) {
      setIsAlertMinimized(false);
    }
  }, [activeAlertPatient?.id]);

  const isMobileView = typeof window !== "undefined" && window.location.pathname.includes("/mobile");

  // Web Audio API siren alert sound
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(4, audioCtx.currentTime); // 4Hz frequency modulation (siren)

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(150, audioCtx.currentTime);

      osc2.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.6);

      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      osc1.stop(audioCtx.currentTime + 1.6);
      osc2.stop(audioCtx.currentTime + 1.6);
    } catch (e) {
      console.log("Audio alert playback blocked or not supported", e);
    }
  };

  useEffect(() => {
    if (isMobileView) {
      setLoading(false);
      return;
    }
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("username");
    if (t && u) {
      setToken(t);
      setUsername(u);
      api.getProfile().then(setProfile).catch(() => {});
    }
    setLoading(false);
  }, [isMobileView]);

  // Clear notification unread count instantly when entering the notifications page
  useEffect(() => {
    if (router.state.location.pathname === "/notifications") {
      setUnreadCount(0);
    }
  }, [router.state.location.pathname]);

  // Global Polling for SOS / Risk alerts
  useEffect(() => {
    if (!token || isMobileView) return;

    let isMounted = true;
    const playedSoundForIds = new Set<string>();

    const pollPatientsForSOS = async () => {
      try {
        const patientsList = await api.getPatients();
        if (!isMounted) return;

        // Find all patients with active risk status
        const riskPatients = patientsList.filter((p: any) => p.status === "risk");

        // Find first risk patient who hasn't been acknowledged yet
        const unacknowledgedPatient = riskPatients.find((p: any) => !acknowledgedAlerts.includes(p.id));

        if (unacknowledgedPatient) {
          setActiveAlertPatient(unacknowledgedPatient);

          // Play audio siren alert exactly once per alert onset
          if (!playedSoundForIds.has(unacknowledgedPatient.id)) {
            playAlertSound();
            playedSoundForIds.add(unacknowledgedPatient.id);
          }
        } else {
          setActiveAlertPatient(null);
        }

        // Clean up sound tracking and acknowledgements for patients no longer in risk state
        const currentRiskIds = new Set(riskPatients.map((p: any) => p.id));
        for (const id of Array.from(playedSoundForIds)) {
          if (!currentRiskIds.has(id)) {
            playedSoundForIds.delete(id);
          }
        }
        setAcknowledgedAlerts((prev) => prev.filter((id) => currentRiskIds.has(id)));

        // --- Fetch anomalies for unreadCount ---
        const isNotificationsPage = window.location.pathname === "/notifications";
        const savedCutoff = localStorage.getItem("sc-notifications-read-cutoff");
        const cutoff = savedCutoff ? parseInt(savedCutoff, 10) : 0;

        if (isNotificationsPage) {
          setUnreadCount(0);
        } else {
          const anomalies = await api.getAnomalies();
          if (!isMounted) return;
          const count = anomalies.filter((item: any) => {
            try {
              const ts = new Date(item.timestamp).getTime();
              return ts > cutoff;
            } catch {
              return false;
            }
          }).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error("SOS global checking and anomalies check failed", err);
      }
    };

    pollPatientsForSOS();
    const interval = setInterval(pollPatientsForSOS, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [token, isMobileView, acknowledgedAlerts]);

  const handleResolveAlert = async (patientId: string) => {
    const lang = document.documentElement.lang === "th" ? "th" : "en";
    try {
      await api.updatePatientStatus(patientId, "normal", 0.0, "0");
      toast.success(lang === "th" ? "✓ ดำเนินการช่วยเหลือและรีเซ็ตสถานะเป็นปกติสำเร็จ" : "✓ Action resolved and status reset to normal successfully.");
      setActiveAlertPatient(null);
      setAcknowledgedAlerts((prev) => [...prev, patientId]);
    } catch (err) {
      toast.error(lang === "th" ? "ไม่สามารถยกเลิกสถานะฉุกเฉินได้" : "Failed to resolve emergency status.");
    }
  };

  const handleSnoozeAlert = (patientId: string) => {
    setAcknowledgedAlerts((prev) => [...prev, patientId]);
    setActiveAlertPatient(null);
  };

  const handleGoToPatient = (patientId: string) => {
    setAcknowledgedAlerts((prev) => [...prev, patientId]);
    setActiveAlertPatient(null);
    router.navigate({
      to: "/patients/$id",
      params: { id: patientId },
    });
  };

  const handleLoginSuccess = (t: string, u: string) => {
    setToken(t);
    setUsername(u);
    api.getProfile().then(setProfile).catch(() => {});
  };

  const handleLogout = () => {
    const isTh = document.documentElement.lang === "th";
    const confirmed = window.confirm(
      isTh
        ? "คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบ?"
        : "Are you sure you want to sign out?"
    );
    if (!confirmed) return;
    clearToken();
    setToken(null);
    setUsername("");
    setProfile(null);
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (isMobileView) {
    return (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <Outlet />
          <Toaster />
        </SettingsProvider>
      </QueryClientProvider>
    );
  }

  if (!token) {
    return (
      <QueryClientProvider client={queryClient}>
        <SettingsProvider>
          <LoginView onLoginSuccess={handleLoginSuccess} />
        </SettingsProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <SidebarProvider>
          <AppSidebar />
          <div className="flex min-h-dvh flex-1 min-w-0 flex-col transition-all duration-200 ease-in-out">
            <AppHeader 
              username={username} 
              profile={profile} 
              onLogout={handleLogout} 
              onProfileUpdate={() => api.getProfile().then(setProfile)} 
              unreadCount={unreadCount}
            />
            <main className="flex-1">
              <Outlet />
            </main>
          </div>
          <Toaster />

          <EmergencyAlertOverlay
            activeAlertPatient={activeAlertPatient}
            isAlertMinimized={isAlertMinimized}
            setIsAlertMinimized={setIsAlertMinimized}
            handleSnoozeAlert={handleSnoozeAlert}
            handleGoToPatient={handleGoToPatient}
            handleResolveAlert={handleResolveAlert}
          />
        </SidebarProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

function AppHeader({
  username,
  profile,
  onLogout,
  onProfileUpdate,
  unreadCount,
}: {
  username: string;
  profile: { email: string; phone: string } | null;
  onLogout: () => void;
  onProfileUpdate: () => void;
  unreadCount: number;
}) {
  const t = useT();
  const { lang } = useSettings();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({ email, phone });
      toast.success(lang === "th" ? "บันทึกข้อมูลสำเร็จ" : "Profile saved successfully");
      onProfileUpdate();
      setDialogOpen(false);
    } catch (err) {
      toast.error(lang === "th" ? "ปรับปรุงโปรไฟล์ล้มเหลว" : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const initial = username ? username.charAt(0).toUpperCase() : "U";
  const isNotificationsPage = router.state.location.pathname === "/notifications";
  const showRedDot = unreadCount > 0 && !isNotificationsPage;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger />
      <div className="ml-auto flex items-center gap-1.5">
        <SettingsControls />
        <Button asChild variant="ghost" size="icon" aria-label={t("header.notifications")} className="relative cursor-pointer">
          <Link to="/notifications">
            <Bell className={`h-4 w-4 ${showRedDot ? "animate-swing" : ""}`} />
            {showRedDot && (
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-risk animate-pulse" />
            )}
          </Link>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-full bg-muted/50 py-1 pl-1 pr-3 h-10 select-none cursor-pointer">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initial}
              </div>
              <div className="hidden text-xs text-left leading-tight sm:block">
                <div className="font-medium text-foreground">{username}</div>
                <div className="text-muted-foreground">{t("header.role")}</div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold text-foreground">{username}</p>
                {profile?.email && <p className="text-xs text-muted-foreground truncate">{profile.email}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>{t("profile.settings")}</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSaveProfile}>
                  <DialogHeader>
                    <DialogTitle>{t("profile.adminTitle")}</DialogTitle>
                    <DialogDescription>
                      {t("profile.updateDesc")}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <Label htmlFor="prof-username">{t("profile.username")}</Label>
                      <Input id="prof-username" value={username} disabled />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prof-email" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {t("profile.email")}
                      </Label>
                      <Input
                        id="prof-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="prof-phone" className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {t("profile.phone")}
                      </Label>
                      <Input
                        id="prof-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="08X-XXX-XXXX"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      {t("action.cancel")}
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="mr-2 h-4 w-4" /> {t("action.save")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-risk cursor-pointer focus:bg-risk/10 focus:text-risk">
              <LogOut className="mr-2 h-4 w-4" />
              <span>{t("profile.signout")}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function EmergencyAlertOverlay({
  activeAlertPatient,
  isAlertMinimized,
  setIsAlertMinimized,
  handleSnoozeAlert,
  handleGoToPatient,
  handleResolveAlert,
}: {
  activeAlertPatient: any;
  isAlertMinimized: boolean;
  setIsAlertMinimized: (b: boolean) => void;
  handleSnoozeAlert: (id: string) => void;
  handleGoToPatient: (id: string) => void;
  handleResolveAlert: (id: string) => void;
}) {
  const t = useT();
  const { lang } = useSettings();
  const router = useRouter();

  return (
    <>
      {/* SOS / Emergency Popup Dialog */}
      <Dialog open={!!activeAlertPatient && !isAlertMinimized} onOpenChange={(open) => {
        if (!open && activeAlertPatient && !isAlertMinimized) {
          handleSnoozeAlert(activeAlertPatient.id);
        }
      }}>
        <DialogContent className="max-w-[400px] border-red-500/20 dark:border-red-500/30 bg-background text-foreground shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] rounded-2xl overflow-hidden p-0 [&>button]:hidden">
          <div className="relative p-6 pb-4">
            {/* Top-Right Control Buttons Container */}
            <div className="absolute right-4 top-4 flex items-center gap-1.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors flex items-center justify-center"
                onClick={() => setIsAlertMinimized(true)}
                title={t("alert.minimize")}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 transition-colors flex items-center justify-center"
                onClick={() => handleSnoozeAlert(activeAlertPatient.id)}
                title={t("alert.closeTemp")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <DialogHeader className="space-y-3">
              <DialogTitle className="flex items-center gap-2.5 text-red-600 dark:text-red-400 text-lg font-bold tracking-tight pr-20">
                <div className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </div>
                <Siren className="h-5 w-5 animate-pulse shrink-0 text-red-600" />
                {t("alert.emergency")}
              </DialogTitle>
              <DialogDescription className="text-slate-600 dark:text-slate-350 text-xs leading-relaxed mt-2 pr-2">
                {lang === "th" ? (
                  <>
                    ผู้ป่วย <span className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-red-500/40 decoration-2 underline-offset-2">{activeAlertPatient?.name}</span>
                    {activeAlertPatient?.room && <span className="text-slate-500"> (ที่อยู่ {activeAlertPatient.room})</span>} ได้ส่งสัญญาณแจ้งเตือนหรือเกิดเหตุการณ์หกล้มขึ้น กรุณาเข้าตรวจสอบโดยด่วน
                  </>
                ) : (
                  <>
                    Patient <span className="font-semibold text-slate-900 dark:text-slate-100 underline decoration-red-500/40 decoration-2 underline-offset-2">{activeAlertPatient?.name}</span>
                    {activeAlertPatient?.room && <span className="text-slate-500"> ({t("field.room")} {activeAlertPatient.room})</span>} has sent an alert signal or a fall event was detected. Please check immediately.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="mx-6 p-4 bg-red-50/40 dark:bg-red-950/15 border border-red-100/60 dark:border-red-900/30 rounded-xl my-2">
            <div className="text-center space-y-1.5">
              <div className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{t("alert.type")}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {activeAlertPatient?.ai_confidence === "100" || activeAlertPatient?.impact_g === 0.0
                  ? `⚠️ ${t("alert.sos")}`
                  : `🚨 ${t("alert.ai")}`
                }
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {t("alert.hn")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeAlertPatient?.hn || "-"}</span> · {t("alert.device")}: <span className="font-semibold text-slate-800 dark:text-slate-200">{activeAlertPatient?.device_id || "-"}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-850/80 flex flex-col gap-2.5">
            {/* Primary Resolve Action */}
            <Button 
              type="button"
              variant="outline"
              onClick={() => handleResolveAlert(activeAlertPatient.id)}
              className="w-full font-bold cursor-pointer h-10 rounded-lg text-xs bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-955/35 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Check className="h-4 w-4 text-red-600 dark:text-red-400" /> {t("alert.resolve")}
            </Button>

            <div className="grid grid-cols-2 gap-2.5 w-full">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => handleSnoozeAlert(activeAlertPatient.id)}
                className="cursor-pointer h-9 px-3 rounded-lg text-xs font-semibold"
              >
                {t("alert.closeTemp")}
              </Button>
              <Button 
                type="button"
                variant="outline"
                onClick={() => handleGoToPatient(activeAlertPatient.id)}
                className="border-blue-200/80 text-blue-700 dark:border-blue-900/30 dark:text-blue-400 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 cursor-pointer h-9 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {t("alert.details")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Minimized Alert Panel */}
      {activeAlertPatient && isAlertMinimized && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 rounded-xl bg-background border border-red-500/30 dark:border-red-500/50 p-4 shadow-[0_4px_30px_rgba(239,68,68,0.15)] dark:shadow-[0_4px_30px_rgba(239,68,68,0.25)] text-foreground transition-all duration-300">
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm tracking-tight">
              <div className="relative flex h-2 w-2 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-600"></span>
              </div>
              <Siren className="h-4.5 w-4.5 animate-pulse text-red-500" />
              <span>{t("alert.minimizedTitle")}</span>
            </div>
            {/* Top right icon button now navigates directly to the patient profile and expands the alert */}
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 rounded-full cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800"
              onClick={() => {
                router.navigate({
                  to: "/patients/$id",
                  params: { id: activeAlertPatient.id },
                });
                setIsAlertMinimized(false);
              }}
              title={t("alert.expand")}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs mt-3 text-slate-600 dark:text-slate-350">
            {lang === "th" ? "ผู้ป่วย" : "Patient"}: <span className="text-slate-900 dark:text-slate-100 font-bold">{activeAlertPatient.name}</span>
            {activeAlertPatient.room && <span className="text-slate-500"> ({lang === "th" ? "ที่อยู่" : "Room"} {activeAlertPatient.room})</span>}
          </p>
          <div className="flex gap-2 mt-4 justify-end">
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => handleResolveAlert(activeAlertPatient.id)}
              className="cursor-pointer font-bold h-8 px-2.5 rounded-lg text-xs"
            >
              <Check className="mr-1 h-3.5 w-3.5" />
              {t("alert.resolve")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
