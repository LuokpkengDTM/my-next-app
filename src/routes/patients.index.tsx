import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, ExternalLink, AlertTriangle, X, Siren, WifiOff, Send, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { StatusBadge } from "@/components/status-badge";
import { bmi } from "@/lib/mock-data";
import { useT, useSettings } from "@/lib/settings-context";
import { api } from "@/lib/api-client";

export const Route = createFileRoute("/patients/")({
  head: () => ({
    meta: [{ title: "Patients — Fall Guard" }],
  }),
  component: PatientsPage,
});

type DraftPatient = {
  name: string;
  age: number;
  gender: "Male" | "Female";
  weight: number;
  height: number;
  deviceId: string;
  room: string;
};

const emptyDraft: DraftPatient = {
  name: "",
  age: 70,
  gender: "Female",
  weight: 60,
  height: 165,
  deviceId: "",
  room: "",
};

// Track per-patient disconnect state
type DisconnectAlert = {
  patientId: string;
  patientName: string;
  deviceId: string;
  since: number;
  dismissed: boolean;
};

function PatientsPage() {
  const t = useT();
  const { lang } = useSettings();
  const [list, setList] = useState<any[]>([]);
  const [devicesData, setDevicesData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [draft, setDraft] = useState<DraftPatient>(emptyDraft);

  // Disconnect alerts
  const [disconnectAlerts, setDisconnectAlerts] = useState<DisconnectAlert[]>([]);
  const prevDeviceStatus = useRef<Record<string, string>>({});

  // message send dialog
  const [msgTarget, setMsgTarget] = useState<any | null>(null);
  const [msgInput, setMsgInput] = useState("");
  const [sendingAction, setSendingAction] = useState(false);

  const loadPatients = async () => {
    try {
      const data = await api.getPatients();
      setList(data);
    } catch (err) {
      toast.error(lang === "th" ? "ไม่สามารถโหลดข้อมูลผู้ป่วยได้" : "Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = useCallback(async () => {
    try {
      const data = await api.getSensorData();
      setDevicesData(data);

      // Check for newly disconnected devices
      setList((currentList) => {
        const newAlerts: DisconnectAlert[] = [];

        for (const p of currentList) {
          if (!p.device_id) continue;
          const dev = data[p.device_id];
          const currentStatus = dev?.status ?? "Disconnected";
          const prevStatus = prevDeviceStatus.current[p.device_id];

          // Newly disconnected
          if (prevStatus === "Connected" && currentStatus === "Disconnected") {
            newAlerts.push({
              patientId: p.id,
              patientName: p.name,
              deviceId: p.device_id,
              since: Date.now(),
              dismissed: false,
            });
          }

          // Reconnected — auto-dismiss relevant alerts
          if (prevStatus === "Disconnected" && currentStatus === "Connected") {
            setDisconnectAlerts((prev) =>
              prev.filter((a) => a.patientId !== p.id)
            );
          }

          prevDeviceStatus.current[p.device_id] = currentStatus;
        }

        if (newAlerts.length > 0) {
          setDisconnectAlerts((prev) => {
            const merged = [...prev];
            for (const na of newAlerts) {
              if (!merged.find((a) => a.patientId === na.patientId)) {
                merged.push(na);
              }
            }
            return merged;
          });
        }

        return currentList;
      });
    } catch (err) {}
  }, []);

  useEffect(() => {
    loadPatients();
    loadDevices();
    const interval = setInterval(loadDevices, 3000);
    return () => clearInterval(interval);
  }, [loadDevices]);

  const dismissAlert = (patientId: string) => {
    setDisconnectAlerts((prev) =>
      prev.filter((a) => a.patientId !== patientId)
    );
  };

  const openAdd = () => {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setDraft({
      name: p.name,
      age: p.age,
      gender: p.gender as "Male" | "Female",
      weight: p.weight,
      height: p.height,
      deviceId: p.device_id || "",
      room: p.room || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!draft.name.trim()) return toast.error(lang === "th" ? "กรุณากรอกชื่อผู้ป่วย" : "Name is required");
    setSaving(true);

    try {
      if (editing) {
        const payload = {
          id: editing.id,
          name: draft.name,
          age: draft.age,
          gender: draft.gender,
          weight: draft.weight,
          height: draft.height,
          hn: editing.hn,
          treatment_history: editing.treatment_history || "-",
          risk_level: editing.risk_level || "Low",
          image: editing.image || "",
          device_id: draft.deviceId,
          room: draft.room,
        };
        await api.updatePatient(editing.id, payload);
        toast.success(lang === "th" ? "ปรับปรุงข้อมูลผู้ป่วยเรียบร้อย" : "Patient updated");
      } else {
        const id = `p${Date.now()}`;
        const payload = {
          id: id,
          name: draft.name,
          age: draft.age,
          gender: draft.gender,
          weight: draft.weight,
          height: draft.height,
          hn: `HN-${Math.floor(Math.random() * 9000) + 1000}`,
          treatment_history: "-",
          risk_level: "Low",
          image: "",
          device_id: draft.deviceId,
          room: draft.room,
        };
        await api.createPatient(payload);
        toast.success(lang === "th" ? "เพิ่มข้อมูลผู้ป่วยเรียบร้อย" : "Patient added");
      }
      await loadPatients();
      setOpen(false);
    } catch (err) {
      toast.error(lang === "th" ? "ไม่สามารถบันทึกข้อมูลผู้ป่วยได้" : "Failed to save patient");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm(lang === "th" ? "คุณแน่ใจหรือไม่ที่จะลบข้อมูลผู้ป่วยรายนี้?" : "Are you sure you want to remove this patient?")) {
      try {
        await api.deletePatient(id);
        toast.success(lang === "th" ? "ลบข้อมูลผู้ป่วยเรียบร้อย" : "Patient removed");
        await loadPatients();
      } catch (err) {
        toast.error(lang === "th" ? "ไม่สามารถลบข้อมูลผู้ป่วยได้" : "Failed to delete patient");
      }
    }
  };


  const handleSendMessage = async () => {
    if (!msgTarget || !msgInput.trim()) return;
    setSendingAction(true);
    try {
      await api.sendPatientMessage(msgTarget.id, msgInput.trim());
      toast.success(lang === "th" ? `💬 ส่งข้อความไปยัง ${msgTarget.name} เรียบร้อยแล้ว` : `💬 Message sent to ${msgTarget.name}`);
      setMsgTarget(null);
      setMsgInput("");
    } catch (err) {
      toast.error(lang === "th" ? "ไม่สามารถส่งข้อความได้" : "Failed to send message");
    } finally {
      setSendingAction(false);
    }
  };

  // Active (not dismissed) alerts
  const activeAlerts = disconnectAlerts.filter((a) => !a.dismissed);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 md:p-6 lg:p-8">

      {/* =====================================================
          DEVICE DISCONNECT POPUP BANNER (TOP OF PAGE)
      ===================================================== */}
      {activeAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
          {activeAlerts.map((alert) => (
            <div
              key={alert.patientId}
              className="flex items-start gap-3 rounded-xl border border-red-500/60 bg-red-950/95 backdrop-blur-sm p-4 shadow-2xl text-white"
              style={{ animation: "slideInRight 0.3s ease" }}
            >
              <WifiOff className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-300">
                  {lang === "th" ? "⚠️ อุปกรณ์หลุด / ไม่ได้สวมใส่" : "⚠️ Device Detached / Offline"}
                </p>
                <p className="text-xs text-red-200 mt-0.5">
                  {lang === "th" 
                    ? `${alert.patientName} — อุปกรณ์ ${alert.deviceId} ขาดการเชื่อมต่อ` 
                    : `${alert.patientName} — Device ${alert.deviceId} disconnected`}
                </p>
                <Link
                  to="/patients/$id"
                  params={{ id: alert.patientId }}
                  className="inline-block mt-1.5 text-[11px] underline text-red-300 hover:text-white"
                  onClick={() => dismissAlert(alert.patientId)}
                >
                  {lang === "th" ? "ไปยังหน้าผู้ป่วย →" : "Go to Patient page →"}
                </Link>
              </div>
              <button
                onClick={() => dismissAlert(alert.patientId)}
                className="text-red-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("patients.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("patients.subtitle")}</p>
        </div>
        <Button onClick={openAdd} className="cursor-pointer">
          <Plus className="h-4 w-4" /> {t("patients.add")}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? t("patients.edit") : t("patients.addNew")}</DialogTitle>
              <DialogDescription>
                {editing ? t("patients.editDesc") : t("patients.addDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <Field className="col-span-2" id="name" label={t("field.name")}>
                <Input id="name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Jane Doe" disabled={saving} />
              </Field>
              <Field id="age" label={t("field.age")}>
                <Input id="age" type="number" value={draft.age} onChange={(e) => setDraft({ ...draft, age: +e.target.value })} disabled={saving} />
              </Field>
              <Field id="gender" label={t("field.gender")}>
                <Select value={draft.gender} onValueChange={(v) => setDraft({ ...draft, gender: v as any })} disabled={saving}>
                  <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">{t("gender.female")}</SelectItem>
                    <SelectItem value="Male">{t("gender.male")}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field id="weight" label={t("field.weight")}>
                <Input id="weight" type="number" value={draft.weight} onChange={(e) => setDraft({ ...draft, weight: +e.target.value })} disabled={saving} />
              </Field>
              <Field id="height" label={t("field.height")}>
                <Input id="height" type="number" value={draft.height} onChange={(e) => setDraft({ ...draft, height: +e.target.value })} disabled={saving} />
              </Field>
              <Field id="device" label={t("field.deviceId")}>
                <div className="space-y-1.5">
                  <Input
                    id="device"
                    value={draft.deviceId}
                    onChange={(e) => setDraft({ ...draft, deviceId: e.target.value })}
                    placeholder="OSC_DEVICE, UDP_DEVICE, etc."
                    disabled={saving}
                  />
                  <div className="flex gap-1.5 mt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-6 px-2 cursor-pointer"
                      onClick={() => setDraft({ ...draft, deviceId: "OSC_DEVICE" })}
                      disabled={saving}
                    >
                      EmotiBit (OSC)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-6 px-2 cursor-pointer"
                      onClick={() => setDraft({ ...draft, deviceId: "UDP_DEVICE" })}
                      disabled={saving}
                    >
                      Custom IoT (UDP)
                    </Button>
                    {draft.deviceId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-6 px-2 text-muted-foreground ml-auto cursor-pointer"
                        onClick={() => setDraft({ ...draft, deviceId: "" })}
                        disabled={saving}
                      >
                        {lang === "th" ? "ล้างค่า" : "Clear"}
                      </Button>
                    )}
                  </div>
                </div>
              </Field>
              <Field id="room" label={t("field.room")}>
                <Input id="room" value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })} placeholder={lang === "th" ? "ที่อยู่ของผู้ป่วย" : "Patient's address"} disabled={saving} />
              </Field>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>{t("action.cancel")}</Button>
              <Button onClick={save} disabled={saving}>{saving ? (lang === "th" ? "กำลังบันทึก..." : "Saving...") : (editing ? t("action.save") : t("action.addPatient"))}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* =====================================================
          PATIENT TABLE
      ===================================================== */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">{lang === "th" ? "กำลังโหลดรายชื่อผู้ป่วย..." : "Loading patients roster..."}</div>
          ) : list.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {lang === "th" ? "ไม่มีผู้ป่วยที่ลงทะเบียนไว้ สามารถกดปุ่มเพิ่มผู้ป่วยได้จากด้านบน" : "No patients registered. Add one using the button above."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col.patient")}</TableHead>
                  <TableHead>{t("col.age")}</TableHead>
                  <TableHead>{t("col.gender")}</TableHead>
                  <TableHead>{t("col.bmi")}</TableHead>
                  <TableHead>{t("col.device")}</TableHead>
                  <TableHead>{t("col.room")}</TableHead>
                  <TableHead>{t("col.status")}</TableHead>
                  <TableHead>{t("col.device")}</TableHead>
                  <TableHead className="text-right">{t("col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((p) => {
                  const dev = p.device_id ? devicesData[p.device_id] : null;
                  const isConnected = dev?.status === "Connected";
                  const isDisconnected = !!p.device_id && !isConnected;
                  const hasAlert = activeAlerts.some((a) => a.patientId === p.id);

                  const displayStatus = isConnected && (dev.risk_label === "Risk" || dev.risk_label === "High Risk")
                    ? "risk"
                    : "normal";

                  return (
                    <TableRow
                      key={p.id}
                      className={cn(
                        "transition-colors",
                        hasAlert && "bg-red-950/30 border-l-4 border-l-red-500",
                        isDisconnected && !hasAlert && p.device_id && "opacity-75"
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold",
                            hasAlert
                              ? "bg-red-500/20 text-red-400 ring-2 ring-red-500/50"
                              : "bg-gradient-to-br from-primary/20 to-accent text-primary"
                          )}>
                            {p.name.split(" ").map((n: string) => n[0]).join("")}
                          </div>
                          <div>
                            <span className="font-medium">{p.name}</span>
                            {hasAlert && (
                              <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5">
                                <WifiOff className="h-2.5 w-2.5" /> {lang === "th" ? "อุปกรณ์หลุด" : "Device disconnected"}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{p.age}</TableCell>
                      <TableCell>{p.gender === "Female" ? t("gender.female") : t("gender.male")}</TableCell>
                      <TableCell className="font-mono">{bmi(p)}</TableCell>
                      <TableCell className="font-mono text-xs">{p.device_id || t("patient.telemetry.noDevice")}</TableCell>
                      <TableCell>{p.room || "-"}</TableCell>
                      <TableCell><StatusBadge status={displayStatus} /></TableCell>

                      {/* Device Status Column */}
                      <TableCell>
                        {p.device_id ? (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            isConnected
                              ? "bg-green-500/15 text-green-600 dark:text-green-400"
                              : "bg-red-500/15 text-red-600 dark:text-red-400"
                          )}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", isConnected ? "bg-green-500" : "bg-red-500")} />
                            {isConnected ? (lang === "th" ? "เชื่อมต่อ" : "Connected") : (lang === "th" ? "หลุด" : "Disconnected")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="inline-flex gap-1 items-center">
                          {/* Send Message Button */}
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label="Send message to patient"
                            title={lang === "th" ? "ส่งข้อความไปยังผู้ป่วย" : "Send message to patient"}
                            className="h-8 w-8 text-blue-500 hover:bg-blue-500/10 hover:text-blue-600"
                            onClick={() => { setMsgTarget(p); setMsgInput(""); }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          {/* Monitor */}
                          <Button asChild size="icon" variant="ghost" aria-label="Monitor">
                            <Link to="/patients/$id" params={{ id: p.id }}><ExternalLink className="h-4 w-4" /></Link>
                          </Button>
                          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-risk" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>


      {/* =====================================================
          SEND MESSAGE DIALOG
      ===================================================== */}
      <Dialog open={!!msgTarget} onOpenChange={(v) => !v && setMsgTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              {lang === "th" ? "ส่งข้อความไปยังผู้ป่วย" : "Send Message to Patient"}
            </DialogTitle>
            <DialogDescription>
              {lang === "th" ? (
                <>
                  ข้อความนี้จะปรากฏเป็น popup บนหน้าจอมือถือของ <span className="font-semibold text-foreground">{msgTarget?.name}</span>
                </>
              ) : (
                <>
                  This message will appear as a popup on the mobile screen of <span className="font-semibold text-foreground">{msgTarget?.name}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="msg-input-list" className="text-xs uppercase font-bold text-muted-foreground">{lang === "th" ? "ข้อความ" : "Message"}</Label>
            <Input
              id="msg-input-list"
              placeholder={lang === "th" ? "พิมพ์ข้อความถึงผู้ป่วย..." : "Type message to patient..."}
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              disabled={sendingAction}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgTarget(null)} disabled={sendingAction}>{t("action.cancel")}</Button>
            <Button
              onClick={handleSendMessage}
              disabled={sendingAction || !msgInput.trim()}
            >
              <Send className="mr-2 h-4 w-4" />
              {sendingAction ? (lang === "th" ? "กำลังส่ง..." : "Sending...") : (lang === "th" ? "ส่งข้อความ" : "Send Message")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
      `}</style>
    </div>
  );
}

function Field({ id, label, children, className }: { id: string; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-1.5 block text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
