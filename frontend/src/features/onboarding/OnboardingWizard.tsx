import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import type { TeamData, TeamPlayer, TeamScheduleGame } from "@/types/teamData";

type OnboardingWizardProps = {
  teamData: TeamData;
  onComplete: () => void;
  onTeamDataUpdate: (data: TeamData) => void;
  onRefresh?: () => void;
};

const steps = ["Team info", "Add players", "Add schedule"];

export default function OnboardingWizard({
  teamData,
  onComplete,
  onTeamDataUpdate,
  onRefresh
}: OnboardingWizardProps) {
  const { getToken } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [teamName, setTeamName] = useState(teamData.teamName ?? "");
  const [playerForm, setPlayerForm] = useState({ name: "", number: "", position: "" });
  const [scheduleForm, setScheduleForm] = useState({ opponent: "", dateTime: "", location: "" });
  const [error, setError] = useState<string | null>(null);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isAddingPlayer, setIsAddingPlayer] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [savingPlayerId, setSavingPlayerId] = useState<string | null>(null);
  const [removingPlayerId, setRemovingPlayerId] = useState<string | null>(null);
  const [editingPlayerForm, setEditingPlayerForm] = useState({ name: "", number: "", position: "" });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [savingScheduleId, setSavingScheduleId] = useState<string | null>(null);
  const [removingScheduleId, setRemovingScheduleId] = useState<string | null>(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingScheduleForm, setEditingScheduleForm] = useState({
    opponent: "",
    dateTime: "",
    location: ""
  });

  const [localTeamData, setLocalTeamData] = useState(teamData);

  useEffect(() => {
    setLocalTeamData(teamData);
    setTeamName(teamData.teamName ?? "");
  }, [teamData]);

  const updateTeamData = (updater: (prev: TeamData) => TeamData) => {
    setLocalTeamData((prev) => {
      const next = updater(prev);
      onTeamDataUpdate(next);
      return next;
    });
  };

  const isSaving =
    isSavingTeam ||
    isAddingPlayer ||
    isAddingSchedule ||
    Boolean(savingPlayerId) ||
    Boolean(removingPlayerId) ||
    Boolean(savingScheduleId) ||
    Boolean(removingScheduleId);

  const hasExistingTeamData = Boolean(
    teamData.teamName?.trim() || teamData.players.length > 0 || teamData.schedule.length > 0
  );
  const showWizard = !hasExistingTeamData;

  const canContinue = useMemo(() => {
    if (activeStep === 0) {
      return Boolean(teamName.trim());
    }
    return true;
  }, [activeStep, teamName]);

  const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

  const saveTeamName = async () => {
    setError(null);
    setIsSavingTeam(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team-data`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ teamName: teamName.trim() })
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to save team name");
      }
      const data = (await response.json()) as TeamData;
      updateTeamData(() => data);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save team name";
      setError(message);
      return false;
    } finally {
      setIsSavingTeam(false);
    }
  };

  const addPlayer = async () => {
    setError(null);
    if (!playerForm.name.trim() || !playerForm.number.trim() || !playerForm.position.trim()) {
      setError("Player name, number, and position are required.");
      return;
    }
    const tempId = crypto.randomUUID();
    const optimisticPlayer: TeamPlayer = { id: tempId, ...playerForm };
    updateTeamData((prev) => ({ ...prev, players: [...prev.players, optimisticPlayer] }));
    setIsAddingPlayer(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team/players`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(playerForm)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to add player");
      }
      const player = (await response.json()) as TeamPlayer;
      updateTeamData((prev) => ({
        ...prev,
        players: prev.players.map((item) => (item.id === tempId ? player : item))
      }));
      setPlayerForm({ name: "", number: "", position: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add player";
      setError(message);
      updateTeamData((prev) => ({
        ...prev,
        players: prev.players.filter((player) => player.id !== tempId)
      }));
    } finally {
      setIsAddingPlayer(false);
    }
  };

  const startEditPlayer = (player: TeamPlayer) => {
    setEditingPlayerId(player.id);
    setEditingPlayerForm({ name: player.name, number: player.number, position: player.position });
  };

  const savePlayerEdit = async () => {
    if (!editingPlayerId) {
      return;
    }
    setError(null);
    const previous = localTeamData.players.find((player) => player.id === editingPlayerId);
    if (previous) {
      updateTeamData((prev) => ({
        ...prev,
        players: prev.players.map((player) =>
          player.id === editingPlayerId ? { id: editingPlayerId, ...editingPlayerForm } : player
        )
      }));
    }
    setSavingPlayerId(editingPlayerId);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team/players/${editingPlayerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingPlayerForm)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update player");
      }
      const updated = (await response.json()) as TeamPlayer;
      updateTeamData((prev) => ({
        ...prev,
        players: prev.players.map((player) =>
          player.id === updated.id ? updated : player
        )
      }));
      setEditingPlayerId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update player";
      setError(message);
      if (previous) {
        updateTeamData((prev) => ({
          ...prev,
          players: prev.players.map((player) =>
            player.id === previous.id ? previous : player
          )
        }));
      }
    } finally {
      setSavingPlayerId(null);
    }
  };

  const removePlayer = async (playerId: string) => {
    setError(null);
    const previous = localTeamData.players.find((player) => player.id === playerId);
    updateTeamData((prev) => ({
      ...prev,
      players: prev.players.filter((player) => player.id !== playerId)
    }));
    setRemovingPlayerId(playerId);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team/players/${playerId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to remove player");
      }
      const players = (await response.json()) as TeamPlayer[];
      updateTeamData((prev) => ({ ...prev, players }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove player";
      setError(message);
      if (previous) {
        updateTeamData((prev) => ({ ...prev, players: [...prev.players, previous] }));
      }
    } finally {
      setRemovingPlayerId(null);
    }
  };

  const addScheduleGame = async () => {
    setError(null);
    if (!scheduleForm.opponent.trim() || !scheduleForm.dateTime.trim() || !scheduleForm.location.trim()) {
      setError("Opponent, date, and location are required.");
      return;
    }
    const tempId = crypto.randomUUID();
    const optimisticGame: TeamScheduleGame = { id: tempId, ...scheduleForm };
    updateTeamData((prev) => ({ ...prev, schedule: [...prev.schedule, optimisticGame] }));
    setIsAddingSchedule(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(scheduleForm)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to add schedule game");
      }
      const scheduleGame = (await response.json()) as TeamScheduleGame;
      updateTeamData((prev) => ({
        ...prev,
        schedule: prev.schedule.map((item) => (item.id === tempId ? scheduleGame : item))
      }));
      setScheduleForm({ opponent: "", dateTime: "", location: "" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add schedule game";
      setError(message);
      updateTeamData((prev) => ({
        ...prev,
        schedule: prev.schedule.filter((game) => game.id !== tempId)
      }));
    } finally {
      setIsAddingSchedule(false);
    }
  };

  const startEditSchedule = (game: TeamScheduleGame) => {
    setEditingScheduleId(game.id);
    setEditingScheduleForm({
      opponent: game.opponent,
      dateTime: game.dateTime,
      location: game.location
    });
  };

  const saveScheduleEdit = async () => {
    if (!editingScheduleId) {
      return;
    }
    setError(null);
    const previous = localTeamData.schedule.find((game) => game.id === editingScheduleId);
    if (previous) {
      updateTeamData((prev) => ({
        ...prev,
        schedule: prev.schedule.map((game) =>
          game.id === editingScheduleId ? { id: editingScheduleId, ...editingScheduleForm } : game
        )
      }));
    }
    setSavingScheduleId(editingScheduleId);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team/schedule/${editingScheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingScheduleForm)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update schedule game");
      }
      const updated = (await response.json()) as TeamScheduleGame;
      updateTeamData((prev) => ({
        ...prev,
        schedule: prev.schedule.map((game) =>
          game.id === updated.id ? updated : game
        )
      }));
      setEditingScheduleId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update schedule game";
      setError(message);
      if (previous) {
        updateTeamData((prev) => ({
          ...prev,
          schedule: prev.schedule.map((game) =>
            game.id === previous.id ? previous : game
          )
        }));
      }
    } finally {
      setSavingScheduleId(null);
    }
  };

  const removeScheduleGame = async (gameId: string) => {
    setError(null);
    const previous = localTeamData.schedule.find((game) => game.id === gameId);
    updateTeamData((prev) => ({
      ...prev,
      schedule: prev.schedule.filter((game) => game.id !== gameId)
    }));
    setRemovingScheduleId(gameId);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const response = await fetch(`${apiBase}/api/team/schedule/${gameId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to remove schedule game");
      }
      const schedule = (await response.json()) as TeamScheduleGame[];
      updateTeamData((prev) => ({ ...prev, schedule }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove schedule game";
      setError(message);
      if (previous) {
        updateTeamData((prev) => ({ ...prev, schedule: [...prev.schedule, previous] }));
      }
    } finally {
      setRemovingScheduleId(null);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const ok = await saveTeamName();
      if (!ok) {
        return;
      }
    }
    if (activeStep === steps.length - 1) {
      onComplete();
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const teamInfoSection = (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Team info</Typography>
        <TextField
          label="Team name"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
        />
        {showWizard && (
          <Button variant="outlined" onClick={saveTeamName} disabled={isSavingTeam}>
            {isSavingTeam ? "Saving..." : "Save team info"}
          </Button>
        )}
      </Stack>
    </Paper>
  );

  const playersSection = (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Add players</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Name"
            value={playerForm.name}
            onChange={(event) => setPlayerForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <TextField
            label="Number"
            value={playerForm.number}
            onChange={(event) => setPlayerForm((prev) => ({ ...prev, number: event.target.value }))}
          />
          <TextField
            label="Position"
            value={playerForm.position}
            onChange={(event) => setPlayerForm((prev) => ({ ...prev, position: event.target.value }))}
          />
          <Button variant="contained" onClick={addPlayer} disabled={isAddingPlayer}>
            {isAddingPlayer ? "Adding..." : "Add"}
          </Button>
        </Stack>
        <Divider />
        {localTeamData.players.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No players added yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {localTeamData.players.map((player) => (
              <Box key={player.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                {editingPlayerId === player.id ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ flex: 1 }}>
                    <TextField
                      label="Name"
                      size="small"
                      value={editingPlayerForm.name}
                      onChange={(event) =>
                        setEditingPlayerForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                    <TextField
                      label="Number"
                      size="small"
                      value={editingPlayerForm.number}
                      onChange={(event) =>
                        setEditingPlayerForm((prev) => ({ ...prev, number: event.target.value }))
                      }
                    />
                    <TextField
                      label="Position"
                      size="small"
                      value={editingPlayerForm.position}
                      onChange={(event) =>
                        setEditingPlayerForm((prev) => ({ ...prev, position: event.target.value }))
                      }
                    />
                  </Stack>
                ) : (
                  <Typography>
                    #{player.number} {player.name} · {player.position}
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  {editingPlayerId === player.id ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={savePlayerEdit}
                        disabled={savingPlayerId === player.id}
                      >
                        {savingPlayerId === player.id ? "Saving..." : "Save"}
                      </Button>
                      <Button size="small" onClick={() => setEditingPlayerId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="small" onClick={() => startEditPlayer(player)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removePlayer(player.id)}
                        disabled={removingPlayerId === player.id}
                      >
                        {removingPlayerId === player.id ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );

  const scheduleSection = (
    <Paper elevation={1} sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1">Add schedule</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Opponent"
            value={scheduleForm.opponent}
            onChange={(event) =>
              setScheduleForm((prev) => ({ ...prev, opponent: event.target.value }))
            }
          />
          <TextField
            label="Date & time"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={scheduleForm.dateTime}
            onChange={(event) =>
              setScheduleForm((prev) => ({ ...prev, dateTime: event.target.value }))
            }
          />
          <TextField
            label="Location"
            value={scheduleForm.location}
            onChange={(event) =>
              setScheduleForm((prev) => ({ ...prev, location: event.target.value }))
            }
          />
          <Button variant="contained" onClick={addScheduleGame} disabled={isAddingSchedule}>
            {isAddingSchedule ? "Adding..." : "Add"}
          </Button>
        </Stack>
        <Divider />
        {localTeamData.schedule.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No games scheduled yet.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {localTeamData.schedule.map((game) => (
              <Box key={game.id} sx={{ display: "flex", justifyContent: "space-between" }}>
                {editingScheduleId === game.id ? (
                  <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ flex: 1 }}>
                    <TextField
                      label="Opponent"
                      size="small"
                      value={editingScheduleForm.opponent}
                      onChange={(event) =>
                        setEditingScheduleForm((prev) => ({ ...prev, opponent: event.target.value }))
                      }
                    />
                    <TextField
                      label="Date & time"
                      type="datetime-local"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={editingScheduleForm.dateTime}
                      onChange={(event) =>
                        setEditingScheduleForm((prev) => ({ ...prev, dateTime: event.target.value }))
                      }
                    />
                    <TextField
                      label="Location"
                      size="small"
                      value={editingScheduleForm.location}
                      onChange={(event) =>
                        setEditingScheduleForm((prev) => ({ ...prev, location: event.target.value }))
                      }
                    />
                  </Stack>
                ) : (
                  <Typography>
                    {game.opponent} · {new Date(game.dateTime).toLocaleString()} · {game.location}
                  </Typography>
                )}
                <Stack direction="row" spacing={1}>
                  {editingScheduleId === game.id ? (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={saveScheduleEdit}
                        disabled={savingScheduleId === game.id}
                      >
                        {savingScheduleId === game.id ? "Saving..." : "Save"}
                      </Button>
                      <Button size="small" onClick={() => setEditingScheduleId(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="small" onClick={() => startEditSchedule(game)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => removeScheduleGame(game.id)}
                        disabled={removingScheduleId === game.id}
                      >
                        {removingScheduleId === game.id ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {hasExistingTeamData ? "Edit your team" : "Set up your team"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hasExistingTeamData
                  ? "Update team info, roster, and schedule as needed."
                  : "Add team info, roster, and schedule to start tracking games."}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              {isSaving && <Chip label="Saving..." color="primary" size="small" />}
              <Button variant="outlined" onClick={onRefresh} disabled={!onRefresh || isSaving}>
                Refresh
              </Button>
            </Stack>
          </Box>
          {showWizard && (
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </Stack>
      </Paper>

      {showWizard ? (
        <>
          {activeStep === 0 && teamInfoSection}
          {activeStep === 1 && playersSection}
          {activeStep === 2 && scheduleSection}
        </>
      ) : (
        <>
          {teamInfoSection}
          {playersSection}
          {scheduleSection}
        </>
      )}

      {showWizard && (
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Button
            disabled={activeStep === 0}
            onClick={() => setActiveStep((prev) => prev - 1)}
          >
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!canContinue || isSavingTeam}
          >
            {isSavingTeam ? "Saving..." : activeStep === steps.length - 1 ? "Finish" : "Continue"}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
