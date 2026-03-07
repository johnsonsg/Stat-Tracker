import { Alert, CircularProgress, Stack, Typography } from "@mui/material";
import OnboardingWizard from "@/features/onboarding/OnboardingWizard";
import { useTeamData } from "@/state/useTeamData";

export default function Team() {
  const { teamData, loading, error, setTeamData, refresh } = useTeamData();

  if (loading || !teamData) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="info">
        <Typography variant="body2">
          Team data is shared with 4thand1. Updates here write to the same database and will be
          reflected there.
        </Typography>
      </Alert>
      <OnboardingWizard
        teamData={teamData}
        onTeamDataUpdate={setTeamData}
        onComplete={() => setTeamData({ ...teamData })}
        onRefresh={refresh}
      />
    </Stack>
  );
}
