import { useMemo } from "react";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import { useAtom } from "jotai";
import { ColorModeContext } from "./ColorModeContext";
import { lightTheme, darkTheme } from "./theme";
import { themeModeAtom } from "@/state/themeModeAtom";

export default function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const theme = useMemo(() => {
    return themeMode === "dark" ? darkTheme : lightTheme;
  }, [themeMode]);

  return (
    <ColorModeContext.Provider value={{ themeMode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={(theme) => ({
            "button.bg-card\\/40": {
              backgroundColor: "transparent",
              color: theme.palette.text.primary,
              borderColor: "transparent",
              borderWidth: 0,
            },
            "button.bg-card\\/40:hover": {
              backgroundColor: "transparent",
              borderColor: "transparent",
              color: theme.palette.primary.main,
            },
            "a:hover": {
              color: "inherit",
            },
          })}
        />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}