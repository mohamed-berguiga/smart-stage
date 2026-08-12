import { useEffect, useState } from "react";

const THEME_KEY = "smart-stage-theme";

export type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/**
 * Gère le thème clair/sombre. Respecte la préférence système au premier
 * chargement, puis mémorise le choix explicite de l'utilisateur (localStorage,
 * volontairement — contrairement au token d'auth, cette préférence peut être
 * partagée entre tous les onglets sans problème).
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = getStoredTheme() ?? getSystemTheme();
    setThemeState(initial);
    applyTheme(initial);
    setReady(true);
  }, []);

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, next);
  };

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return { theme, ready, setTheme, toggleTheme };
}