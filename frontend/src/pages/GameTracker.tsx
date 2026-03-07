import { Alert, CircularProgress, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import StatEntryPage from "@/features/stat-entry/StatEntryPage";
import OnboardingWizard from "@/features/onboarding/OnboardingWizard";
import { useTeamData } from "@/state/useTeamData";

export default function GameTracker() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { teamData, loading, error, setTeamData, refresh } = useTeamData();

  if (loading || !teamData) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <CircularProgress />
      </Stack>
    );
  }

  if (teamData.players.length === 0) {
    return (
      <OnboardingWizard
        teamData={teamData}
        onTeamDataUpdate={setTeamData}
        onComplete={() => setTeamData({ ...teamData })}
        onRefresh={refresh}
      />
    );
  }

  return (
    <StatEntryPage
      gameId={gameId ?? null}
      roster={teamData.players}
      schedule={teamData.schedule}
      teamName={teamData.teamName}
      onSelectGame={(id) => {
        navigate(`/games/${id}`);
      }}
    />
  );
}