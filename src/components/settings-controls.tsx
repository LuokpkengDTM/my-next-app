import { Moon, Sun, Eye, Languages, Minus, Plus, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings, useT } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

export function SettingsControls() {
  const t = useT();
  const { theme, toggleTheme, fontScale, setFontScale, lang, setLang } =
    useSettings();

  const bump = (delta: number) =>
    setFontScale(Math.max(0.85, Math.min(1.35, +(fontScale + delta).toFixed(3))));

  return (
    <div className="flex items-center gap-1">
      <div className="hidden items-center gap-0.5 rounded-md border bg-background p-0.5 md:flex">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={t("a11y.fontSmaller")}
          onClick={() => bump(-0.075)}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={t("a11y.fontReset")}
          onClick={() => setFontScale(1)}
        >
          <Type className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label={t("a11y.fontLarger")}
          onClick={() => bump(0.075)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        aria-label={t("a11y.language")}
        onClick={() => setLang(lang === "en" ? "th" : "en")}
        className="gap-1 px-2"
      >
        <Languages className="h-4 w-4" />
        <span className="text-xs font-semibold">
          {lang === "en" ? t("lang.short.en") : t("lang.short.th")}
        </span>
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label={t("a11y.theme")}
        aria-pressed={theme === "dark"}
        onClick={toggleTheme}
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </Button>
    </div>
  );
}
