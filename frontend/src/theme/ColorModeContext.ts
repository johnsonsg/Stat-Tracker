import { createContext } from "react";
import type { PaletteMode } from "@mui/material/styles";

export const ColorModeContext = createContext<{
  themeMode: PaletteMode;
  toggleTheme: () => void;
}>({
  themeMode: "dark",
  toggleTheme: () => {},
});
