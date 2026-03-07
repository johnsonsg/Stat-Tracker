import { Box, Button, Stack, Typography } from "@mui/material";
import { UserProfile, useClerk } from "@clerk/clerk-react";

export default function Profile() {
  const { signOut } = useClerk();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Account settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Update your profile, security preferences, and connected accounts.
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden"
        }}
      >
        <UserProfile routing="path" path="/profile" />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Session
        </Typography>
        <Button variant="outlined" color="error" onClick={() => signOut()}>
          Log out
        </Button>
      </Box>
    </Stack>
  );
}
