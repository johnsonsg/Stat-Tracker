import { createTheme } from "@mui/material/styles";

const typography = {
  fontFamily:
    "'Geist','Geist Fallback',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
};

export const lightTheme = createTheme({
  typography,
  palette: {
    mode: "light",
    primary: {
      main: "#2563eb",
    },
    secondary: {
      main: "#f97316",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    }
  }
});

export const darkTheme = createTheme({
  typography,
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6",
    },
    secondary: {
      main: "#f97316",
    },
    background: {
      default: "#0f172a",
      paper: "#1e293b",
    }
  }
});