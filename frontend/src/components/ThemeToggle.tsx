import { useAtom } from "jotai";
import { Moon, Sun } from "lucide-react";
import { themeModeAtom } from "@/state/themeModeAtom";

export default function ThemeToggle() {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card/40 text-foreground transition-colors hover:border-primary/30 hover:bg-card"
      aria-label={themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {themeMode === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
