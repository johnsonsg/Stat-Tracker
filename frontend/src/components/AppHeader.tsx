import { useContext } from "react";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { Moon, Sun } from "lucide-react";
import { ColorModeContext } from "@/theme/ColorModeContext";

export default function AppHeader() {
  const { toggleTheme, themeMode } = useContext(ColorModeContext);

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{ backgroundColor: "transparent" }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          4th &nd One Stat Tracker
        </Typography>
        <Box>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card/40 text-foreground transition-colors hover:border-primary/30 hover:bg-card"
            aria-label={
              themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
          >
            {themeMode === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
