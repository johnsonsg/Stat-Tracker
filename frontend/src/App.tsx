import { Box, Typography } from "@mui/material";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import GameTracker from "@/pages/GameTracker";
import MiniVariantDrawer from "@/components/MiniVariantDrawer";
import { SignInPage, SignUpPage } from "@/pages/Auth";
import OrganizationSettings from "@/pages/OrganizationSettings";
import AutoSelectOrganization from "@/components/AutoSelectOrganization";
import "./App.css";

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
        <Routes>
          <Route
            path="/organization/*"
            element={
              <MiniVariantDrawer team={{ schoolName: "Manchester", mascotName: "Lancers" }}>
                <OrganizationSettings />
              </MiniVariantDrawer>
            }
          />
          <Route
            path="/"
            element={
              <MiniVariantDrawer team={{ schoolName: "Manchester", mascotName: "Lancers" }}>
                <Box sx={{ maxWidth: 1080 }}>
                  <Typography variant="h4" gutterBottom>
                    Live Game Tracker
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Track plays in real time with MUI X.
                  </Typography>
                  <GameTracker />
                </Box>
              </MiniVariantDrawer>
            }
          />
          <Route
            path="/games/:gameId"
            element={
              <MiniVariantDrawer team={{ schoolName: "Manchester", mascotName: "Lancers" }}>
                <Box sx={{ maxWidth: 1080 }}>
                  <Typography variant="h4" gutterBottom>
                    Live Game Tracker
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Track plays in real time with MUI X.
                  </Typography>
                  <GameTracker />
                </Box>
              </MiniVariantDrawer>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SignedIn>
    </BrowserRouter>
  );
}

export default App;
