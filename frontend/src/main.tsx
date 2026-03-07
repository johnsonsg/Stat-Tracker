import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import AppThemeProvider from "@/theme/ThemeProvider";

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={clerkPublishableKey}>
    <AppThemeProvider>
      <App />
    </AppThemeProvider>
  </ClerkProvider>
);