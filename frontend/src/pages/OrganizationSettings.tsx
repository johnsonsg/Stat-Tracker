import { Box, Paper, Typography } from "@mui/material";
import { OrganizationProfile } from "@clerk/clerk-react";

export default function OrganizationSettings() {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Paper elevation={1} sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Organization settings
        </Typography>
        <OrganizationProfile routing="path" path="/organization" />
      </Paper>
    </Box>
  );
}
