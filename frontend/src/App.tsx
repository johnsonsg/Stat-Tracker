import { Box, Typography } from "@mui/material";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import GameTracker from "@/pages/GameTracker";
import Players from "@/pages/Players";
import Profile from "@/pages/Profile";
import RosterSchedule from "@/pages/RosterSchedule";
import Team from "@/pages/Team";
import MiniVariantDrawer from "@/components/MiniVariantDrawer";
import { SignInPage, SignUpPage } from "@/pages/Auth";
import OrganizationSettings from "@/pages/OrganizationSettings";
import AutoSelectOrganization from "@/components/AutoSelectOrganization";
import { TeamDataProvider } from "@/state/teamDataContext";
import { useTeamData } from "@/state/useTeamData";
import "./App.css";

type AppShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

type TeamDrawerProps = {
  children: React.ReactNode;
};

function TeamDrawer({ children }: TeamDrawerProps) {
  const { teamData } = useTeamData();
  const teamName = teamData?.teamName ?? null;

  return (
    <MiniVariantDrawer teamName={teamName}>
      {children}
    </MiniVariantDrawer>
  );
}

function AppShell({ title, description, children }: AppShellProps) {
  return (
    <TeamDrawer>
      <Box sx={{ width: "100%", maxWidth: "100%" }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {description}
          </Typography>
        )}
        {children}
      </Box>
    </TeamDrawer>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SignedOut>
        <Routes>
          <Route path="/sign-in/*" element={<SignInPage />} />
          <Route path="/sign-up/*" element={<SignUpPage />} />
          <Route path="*" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </SignedOut>
      <SignedIn>
        <AutoSelectOrganization />
        <TeamDataProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <AppShell title="Dashboard" description="Quick stats and recent activity.">
                  <Dashboard />
                </AppShell>
              }
            />
            <Route
              path="/organization/*"
              element={
                <TeamDrawer>
                  <OrganizationSettings />
                </TeamDrawer>
              }
            />
            <Route
              path="/games"
              element={
                <AppShell
                  title="Live Game Tracker"
                  description="Track plays in real time with MUI X."
                >
                  <GameTracker />
                </AppShell>
              }
            />
            <Route
              path="/games/:gameId"
              element={
                <AppShell
                  title="Live Game Tracker"
                  description="Track plays in real time with MUI X."
                >
                  <GameTracker />
                </AppShell>
              }
            />
            <Route
              path="/players"
              element={
                <AppShell title="Player Stats" description="Stat totals by game.">
                  <Players />
                </AppShell>
              }
            />
            <Route
              path="/roster"
              element={
                <AppShell title="Roster & Schedule" description="Roster and schedule from team data.">
                  <RosterSchedule />
                </AppShell>
              }
            />
            <Route
              path="/team"
              element={
                <AppShell title="Team Management" description="Edit team info, roster, and schedule.">
                  <Team />
                </AppShell>
              }
            />
            <Route
              path="/profile"
              element={
                <AppShell title="User Profile" description="Manage your account settings.">
                  <Profile />
                </AppShell>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </TeamDataProvider>
      </SignedIn>
    </BrowserRouter>
  );
}

export default App;
