import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { useSettings } from "@/lib/settings-context";
import { PixelHeart } from "@/components/ui/pixel-heart";

interface LoginViewProps {
  onLoginSuccess: (token: string, username: string) => void;
  isModal?: boolean;
}

export function LoginView({ onLoginSuccess, isModal = false }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang, setLang } = useSettings();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api.login(username, password);
      onLoginSuccess(data.access_token, username);
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Firebase quota") || msg.includes("โควตา") || msg.includes("Quota exceeded") || msg.includes("quota exceeded")) {
        setError(msg);
      } else {
        setError(lang === "th" ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" : "Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const isTh = lang === "th";

  const cardContent = (
    <Card className={`w-full max-w-md ${isModal ? "border-0 shadow-none bg-transparent" : "border-border/60 shadow-xl bg-card/60 backdrop-blur-md"}`}>
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
          <PixelHeart size={28} pixelColor="#FFF56D" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {isTh ? "เข้าสู่ระบบ Fall Guard" : "Sign in to Fall Guard"}
        </CardTitle>
        <CardDescription>
          {isTh 
            ? "ระบบวิเคราะห์ความเสี่ยงการหกล้มด้วยปัญญาประดิษฐ์" 
            : "AI-powered fall risk monitoring system"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-risk/10 p-3 text-center text-xs font-semibold text-risk border border-risk/20">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="username">{isTh ? "ชื่อผู้ใช้งาน" : "Username"}</Label>
            <Input
              id="username"
              type="text"
              placeholder={isTh ? "ป้อนชื่อผู้ใช้งานของคุณ" : "Enter your username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="password">{isTh ? "รหัสผ่าน" : "Password"}</Label>
            <Input
              id="password"
              type="password"
              placeholder={isTh ? "ป้อนรหัสผ่านของคุณ" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading 
              ? (isTh ? "กำลังตรวจสอบข้อมูล..." : "Signing in...") 
              : (isTh ? "เข้าสู่ระบบ" : "Sign In")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  if (isModal) {
    return cardContent;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLang(lang === "en" ? "th" : "en")}
        >
          {isTh ? "English" : "ไทย"}
        </Button>
      </div>
      {cardContent}
    </div>
  );
}
