import { createContext, useState, useEffect, useContext } from "react";

export const COLOR_THEMES = [
  {
    id: "violet",
    label: "Violet",
    preview: "#7c3aed",
    colors: { accent: "#7c3aed" },
    vars: {
      "--accent":     "#7c3aed",
      "--accent-2":   "#a855f7",
      "--accent-bg":  "rgba(124,58,237,0.15)",
      "--accent-bd":  "rgba(124,58,237,0.40)",
      "--cyan":       "#06b6d4",
      "--glow-purple":"rgba(124,58,237,0.55)",
      "--glow-cyan":  "rgba(6,182,212,0.45)",
    }
  },
  {
    id: "cyan",
    label: "Cyan",
    preview: "#06b6d4",
    colors: { accent: "#06b6d4" },
    vars: {
      "--accent":     "#06b6d4",
      "--accent-2":   "#22d3ee",
      "--accent-bg":  "rgba(6,182,212,0.15)",
      "--accent-bd":  "rgba(6,182,212,0.40)",
      "--cyan":       "#a855f7",
      "--glow-purple":"rgba(6,182,212,0.55)",
      "--glow-cyan":  "rgba(168,85,247,0.45)",
    }
  },
  {
    id: "rose",
    label: "Rose",
    preview: "#f43f5e",
    colors: { accent: "#f43f5e" },
    vars: {
      "--accent":     "#f43f5e",
      "--accent-2":   "#fb7185",
      "--accent-bg":  "rgba(244,63,94,0.15)",
      "--accent-bd":  "rgba(244,63,94,0.40)",
      "--cyan":       "#06b6d4",
      "--glow-purple":"rgba(244,63,94,0.55)",
      "--glow-cyan":  "rgba(6,182,212,0.45)",
    }
  },
  {
    id: "emerald",
    label: "Emerald",
    preview: "#10b981",
    colors: { accent: "#10b981" },
    vars: {
      "--accent":     "#10b981",
      "--accent-2":   "#34d399",
      "--accent-bg":  "rgba(16,185,129,0.15)",
      "--accent-bd":  "rgba(16,185,129,0.40)",
      "--cyan":       "#06b6d4",
      "--glow-purple":"rgba(16,185,129,0.55)",
      "--glow-cyan":  "rgba(6,182,212,0.45)",
    }
  },
  {
    id: "amber",
    label: "Amber",
    preview: "#f59e0b",
    colors: { accent: "#f59e0b" },
    vars: {
      "--accent":     "#f59e0b",
      "--accent-2":   "#fbbf24",
      "--accent-bg":  "rgba(245,158,11,0.15)",
      "--accent-bd":  "rgba(245,158,11,0.40)",
      "--cyan":       "#06b6d4",
      "--glow-purple":"rgba(245,158,11,0.55)",
      "--glow-cyan":  "rgba(6,182,212,0.45)",
    }
  },
  {
    id: "pink",
    label: "Pink",
    preview: "#ec4899",
    colors: { accent: "#ec4899" },
    vars: {
      "--accent":     "#ec4899",
      "--accent-2":   "#f472b6",
      "--accent-bg":  "rgba(236,72,153,0.15)",
      "--accent-bd":  "rgba(236,72,153,0.40)",
      "--cyan":       "#06b6d4",
      "--glow-purple":"rgba(236,72,153,0.55)",
      "--glow-cyan":  "rgba(6,182,212,0.45)",
    }
  },
];

const ThemeContext = createContext(null);

function applyColorTheme(themeId) {
  const theme = COLOR_THEMES.find(t => t.id === themeId) || COLOR_THEMES[0];
  Object.entries(theme.vars).forEach(([k, v]) => {
    document.documentElement.style.setProperty(k, v);
  });
}

export function ThemeProvider({ children }) {
  // 'dark' | 'light' | 'midnight'
  const [mode, setMode] = useState(() => localStorage.getItem("nexus_theme") || "dark");
  const [colorTheme, setColorThemeState] = useState(() => localStorage.getItem("nexus_color_theme") || "violet");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("nexus_theme", mode);
  }, [mode]);

  useEffect(() => {
    applyColorTheme(colorTheme);
    localStorage.setItem("nexus_color_theme", colorTheme);
  }, [colorTheme]);

  // MODE_IDS that are "base themes" (not accent colours)
  const BASE_THEMES = ["dark", "light", "midnight"];

  /**
   * Unified setTheme — accepts any id:
   *   'light' | 'dark' | 'midnight'  → sets the CSS data-theme
   *   colour id (violet, cyan, …)    → sets the accent-colour overrides
   */
  const setTheme = (id) => {
    if (BASE_THEMES.includes(id)) {
      setMode(id);
    } else {
      setColorThemeState(id);
    }
  };

  // Expose theme as an object so SettingsModal can use theme.id
  const themeObject = { id: mode };

  // Convert array → keyed object for SettingsModal's Object.entries(themes)
  const themes = COLOR_THEMES.reduce((acc, t) => {
    acc[t.id] = t;
    return acc;
  }, {
    // Also include base themes so the filter works correctly
    light:    { id: "light",    label: "Light",    colors: { accent: "#7c3aed" } },
    dark:     { id: "dark",     label: "Dark",     colors: { accent: "#7c3aed" } },
    midnight: { id: "midnight", label: "Midnight", colors: { accent: "#000000" } },
  });

  const toggle   = () => setMode(m => m === "dark" ? "light" : "dark");
  const setDark  = () => setMode("dark");
  const setLight = () => setMode("light");
  const setColorTheme = (id) => setColorThemeState(id);

  return (
    <ThemeContext.Provider value={{
      // Object form (used by SettingsModal)
      theme: themeObject,
      themes,
      setTheme,
      // Legacy string form (used elsewhere)
      mode,
      toggle,
      setDark,
      setLight,
      colorTheme,
      setColorTheme,
      COLOR_THEMES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
