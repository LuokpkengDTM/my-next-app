import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Save,
  Settings,
  Languages,
  Sun,
  Moon,
  Type,
  Eye,
  Sliders,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSettings, useT } from "@/lib/settings-context";
import { api } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings — Fall Guard" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const t = useT();
  const { theme, setTheme, fontScale, setFontScale, lang, setLang } = useSettings();

  // Draft states for Preferences & Accessibility
  const [draftTheme, setDraftTheme] = useState(theme);
  const [draftFontScale, setDraftFontScale] = useState(fontScale);
  const [draftLang, setDraftLang] = useState(lang);

  const [profile, setProfile] = useState<{ username: string; email: string; phone: string } | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Confirmation dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"preferences" | "profile" | null>(null);

  // Sync draft states when settings load/change
  useEffect(() => {
    setDraftTheme(theme);
    setDraftFontScale(fontScale);
    setDraftLang(lang);
  }, [theme, fontScale, lang]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await api.getProfile();
        setProfile(data);
        setEmail(data.email || "");
        setPhone(data.phone || "");
      } catch (err) {
        toast.error("Failed to load profile settings");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleOpenConfirm("profile");
  };

  const handleSaveProfileConfirmed = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ email, phone });
      toast.success(lang === "th" ? "บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว" : "Profile settings saved successfully");
      const u = localStorage.getItem("username") || "Caregiver";
      setProfile({ username: u, email, phone });
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenConfirm = (type: "preferences" | "profile") => {
    setConfirmType(type);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    setConfirmOpen(false);
    if (confirmType === "preferences") {
      setTheme(draftTheme);
      setFontScale(draftFontScale);
      setLang(draftLang);
      toast.success(draftLang === "th" ? "บันทึกการแสดงผลและการช่วยเหลือสำเร็จ" : "Display and accessibility settings saved successfully");
    } else if (confirmType === "profile") {
      await handleSaveProfileConfirmed();
    }
    setConfirmType(null);
  };

  const adjustFontScale = (delta: number) => {
    setDraftFontScale(Math.max(0.85, Math.min(1.35, +(draftFontScale + delta).toFixed(3))));
  };

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 p-4 md:p-6 lg:p-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          {lang === "th" ? "ตั้งค่าระบบ" : "System Settings"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {lang === "th"
            ? "ปรับแต่งการแสดงผล การช่วยเหลือ และข้อมูลโปรไฟล์ส่วนตัวของผู้ดูแล"
            : "Customize display settings, accessibility helper modes, and admin profile info."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Column 1: Preferences & Accessibility */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sliders className="h-5 w-5 text-primary" />
              {lang === "th" ? "การแสดงผลและการช่วยเหลือ" : "Preferences & Accessibility"}
            </CardTitle>
            <CardDescription>
              {lang === "th"
                ? "ปรับแต่งรูปแบบและตัวช่วยอำนวยความสะดวกให้เหมาะกับคุณ"
                : "Modify themes, fonts, and accessibility options to fit your needs."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  <Languages className="h-4 w-4 text-muted-foreground" />
                  {lang === "th" ? "ภาษาที่ใช้แสดงผล" : "Display Language"}
                </Label>
                <span className="text-xs text-muted-foreground font-semibold">
                  {lang === "th" ? "ภาษาไทย" : "English"}
                </span>
              </div>
              <Select value={draftLang} onValueChange={(v) => setDraftLang(v as any)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English (EN)</SelectItem>
                  <SelectItem value="th">ภาษาไทย (TH)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Theme Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-sm font-medium">
                  {draftTheme === "dark" ? (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                  )}
                  {lang === "th" ? "ธีมการแสดงผล" : "Interface Theme"}
                </Label>
                <span className="text-xs text-muted-foreground capitalize">{draftTheme}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={draftTheme === "light" ? "default" : "outline"}
                  className="flex-1 gap-2 cursor-pointer"
                  onClick={() => setDraftTheme("light")}
                >
                  <Sun className="h-4 w-4" />
                  {lang === "th" ? "สว่าง" : "Light"}
                </Button>
                <Button
                  variant={draftTheme === "dark" ? "default" : "outline"}
                  className="flex-1 gap-2 cursor-pointer"
                  onClick={() => setDraftTheme("dark")}
                >
                  <Moon className="h-4 w-4" />
                  {lang === "th" ? "มืด" : "Dark"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Font Scaling */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Type className="h-4 w-4 text-muted-foreground" />
                {lang === "th" ? "ปรับขนาดตัวอักษร" : "Text Scaling"}
              </Label>
              <div className="flex items-center gap-4 bg-muted/30 border rounded-lg p-2.5 justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => adjustFontScale(-0.075)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <span className="text-sm font-bold block">{Math.round(draftFontScale * 100)}%</span>
                  <span className="text-[10px] text-muted-foreground">
                    {lang === "th" ? "ขนาดฟอนต์มาตรฐาน" : "Scale modifier"}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  onClick={() => adjustFontScale(0.075)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => setDraftFontScale(1)}
              >
                {lang === "th" ? "รีเซ็ตเป็นขนาดเริ่มต้น" : "Reset to default size"}
              </Button>
            </div>

            <Separator />
            <Button
              onClick={() => handleOpenConfirm("preferences")}
              className="w-full gap-2 mt-4 cursor-pointer"
              variant={draftTheme !== theme || draftFontScale !== fontScale || draftLang !== lang ? "default" : "outline"}
            >
              <Save className="h-4 w-4" />
              {lang === "th" ? "บันทึกการตั้งค่าการแสดงผล" : "Save Display Settings"}
            </Button>
          </CardContent>
        </Card>

        {/* Column 2: Admin Profile Settings */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {lang === "th" ? "ข้อมูลผู้ดูแลระบบ" : "Admin Profile"}
            </CardTitle>
            <CardDescription>
              {lang === "th"
                ? "จัดการข้อมูลติดต่อที่ใช้งานในระบบรายงานตัวผู้ดูแล"
                : "Manage your email and phone details for caregiver notifications."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {lang === "th" ? "กำลังโหลดข้อมูลโปรไฟล์..." : "Loading admin profile..."}
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="username">{lang === "th" ? "ชื่อบัญชีผู้ใช้" : "Username"}</Label>
                  <Input id="username" value={profile?.username || ""} disabled className="bg-muted/40 font-semibold" />
                  <span className="text-[10px] text-muted-foreground block">
                    {lang === "th" ? "ชื่อบัญชีผู้ใช้ไม่สามารถเปลี่ยนแปลงได้" : "Caregiver username is read-only."}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    {lang === "th" ? "อีเมลติดต่อ" : "Email Address"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="caregiver@fallguard.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    {lang === "th" ? "เบอร์โทรศัพท์มือถือ" : "Phone Number"}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="08X-XXX-XXXX"
                  />
                </div>

                <Button type="submit" className="w-full gap-2 mt-4 cursor-pointer" disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving
                    ? lang === "th"
                      ? "กำลังบันทึก..."
                      : "Saving..."
                    : lang === "th"
                    ? "บันทึกการเปลี่ยนแปลง"
                    : "Save changes"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md bg-background text-foreground shadow-2xl border border-muted-foreground/25">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {confirmType === "preferences"
                ? lang === "th" ? "🔔 ยืนยันการตั้งค่าการแสดงผล" : "🔔 Confirm Display Settings"
                : lang === "th" ? "👤 ยืนยันการเปลี่ยนข้อมูลผู้ดูแล" : "👤 Confirm Profile Changes"
              }
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm pt-2">
              {confirmType === "preferences"
                ? lang === "th" 
                  ? "คุณแน่ใจหรือไม่ที่จะบันทึกและใช้การเปลี่ยนแปลงการแสดงผลและการเข้าถึงเหล่านี้?"
                  : "Are you sure you want to save and apply these display and accessibility changes?"
                : lang === "th"
                  ? "คุณแน่ใจหรือไม่ที่จะบันทึกการเปลี่ยนแปลงข้อมูลโปรไฟล์ของคุณ?"
                  : "Are you sure you want to save your profile changes?"
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmOpen(false);
                setConfirmType(null);
              }}
              className="w-full sm:w-auto cursor-pointer"
            >
              {lang === "th" ? "ยกเลิก" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmAction}
              className="w-full sm:w-auto font-bold cursor-pointer"
            >
              {lang === "th" ? "ยืนยัน" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
