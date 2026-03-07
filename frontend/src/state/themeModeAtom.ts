import { atomWithStorage, createJSONStorage } from "jotai/utils";
import type { PaletteMode } from "@mui/material/styles";
import { getBrowserStorage } from "@/state/storage";

export const themeModeAtom = atomWithStorage<PaletteMode>(
  "site.themeMode",
  "dark",
  createJSONStorage<PaletteMode>(() => getBrowserStorage())
);
