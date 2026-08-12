import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
    >
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}