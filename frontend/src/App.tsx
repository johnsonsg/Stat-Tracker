import { Box, Typography } from "@mui/material";
import GameTracker from "@/pages/GameTracker";
import MiniVariantDrawer from "@/components/MiniVariantDrawer";
import "./App.css";

function App() {
  return (
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
  );
}

export default App;
