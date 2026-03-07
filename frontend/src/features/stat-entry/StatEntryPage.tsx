import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import GameBar from "./components/GameBar";
import PlayTypeSelector from "./components/PlayTypeSelector";
import PlayerSelector from "./components/PlayerSelector";
import ResultSelector from "./components/ResultSelector";
import PlayTimeline from "./components/PlayTimeline";
import QuickRoster from "./components/QuickRoster";
import type { TeamPlayer } from "@/types/teamData";
import PlayConfirmationBanner from "./components/PlayConfirmationBanner";

type PlaySummary = {
  id: string;
  sequence: number;
  label: string;
  yards: number;
  note?: string;
  playType: string;
  players?: {
    passerId?: string;
    receiverId?: string;
    rusherId?: string;
    tacklerId?: string;
    kickerId?: string;
    returnerId?: string;
  };
  touchdown?: boolean;
  turnover?: boolean;
};

type StatEntryPageProps = {
  gameId: string | null;
  onSelectGame?: (gameId: string) => void;
  roster: TeamPlayer[];
};

type GameSummary = {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  status: string;
};

type SnackbarState = {
  message: string;
  severity: "success" | "error";
} | null;

type PendingPlay = {
  label: string;
  playType: string;
  yards: number;
  touchdown?: boolean;
  turnover?: boolean;
  players?: PlaySummary["players"];
  notes?: string;
  payload: {
    sport: string;
    quarter: number;
    clock: string;
    down?: number;
    distance?: number;
    yardLine?: number;
    playType: string;
    players?: PlaySummary["players"];
    yards?: number;
    touchdown?: boolean;
    turnover?: boolean;
    notes?: string;
  };
};

export default function StatEntryPage({ gameId, onSelectGame, roster }: StatEntryPageProps) {
  const { getToken } = useAuth();
  const [playType, setPlayType] = useState<string | undefined>();
  const [primaryPlayer, setPrimaryPlayer] = useState<TeamPlayer | null>(null);
  const [secondaryPlayer, setSecondaryPlayer] = useState<TeamPlayer | null>(null);
  const [plays, setPlays] = useState<PlaySummary[]>([]);
  const [lastPrimary, setLastPrimary] = useState<TeamPlayer | null>(null);
  const [lastSecondary, setLastSecondary] = useState<TeamPlayer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | "">(gameId ?? "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrors, setCreateErrors] = useState<{
    season?: string;
    homeTeam?: string;
    awayTeam?: string;
    gameDate?: string;
  }>({});
  const [createForm, setCreateForm] = useState({
    season: new Date().getFullYear(),
    homeTeam: "",
    awayTeam: "",
    gameDate: new Date().toISOString().slice(0, 10)
  });
  const [selectedPlay, setSelectedPlay] = useState<PlaySummary | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<"pending" | "saved" | null>(null);
  const [editForm, setEditForm] = useState({
    playType: "pass",
    primaryPlayerId: "",
    secondaryPlayerId: "",
    yards: 0,
    touchdown: false,
    turnover: false,
    notes: ""
  });
  const [pendingPlay, setPendingPlay] = useState<PendingPlay | null>(null);
  const pendingTimerRef = useRef<number | null>(null);
  const [gameState, setGameState] = useState({
    quarter: 1,
    clock: "12:00",
    down: 1,
    distance: 10,
    yardLine: 25
  });

  const quickPrimary = useMemo(() => (lastPrimary ? [lastPrimary] : []), [lastPrimary]);
  const quickSecondary = useMemo(() => (lastSecondary ? [lastSecondary] : []), [lastSecondary]);
  const rosterById = useMemo(() => new Map(roster.map((player) => [player.id, player])), [roster]);
  const playTypeOptions = ["pass", "run", "sack", "punt", "fg", "penalty", "turnover"];
  const activeGameId = gameId ?? (selectedGameId || null);

  const buildPlayLabel = useCallback(
    (play: Pick<PlaySummary, "playType" | "players">) => {
    const playType = play.playType.toUpperCase();
    const passer = play.players?.passerId ? rosterById.get(play.players.passerId) : null;
    const receiver = play.players?.receiverId ? rosterById.get(play.players.receiverId) : null;
    const rusher = play.players?.rusherId ? rosterById.get(play.players.rusherId) : null;
    const tackler = play.players?.tacklerId ? rosterById.get(play.players.tacklerId) : null;

    const formatPlayer = (playerId?: string | null) => {
      if (!playerId) {
        return "";
      }
      const player = rosterById.get(playerId);
      return player ? `#${player.number}` : playerId;
    };

    if (playType === "PASS") {
      const primary = passer ? `#${passer.number}` : formatPlayer(play.players?.passerId);
      const secondary = receiver ? `#${receiver.number}` : formatPlayer(play.players?.receiverId);
      return secondary ? `${playType} ${primary} -> ${secondary}` : `${playType} ${primary}`;
    }

    if (playType === "RUN" || playType === "SACK") {
      const primary = rusher ? `#${rusher.number}` : formatPlayer(play.players?.rusherId);
      return `${playType} ${primary}`.trim();
    }

    if (playType === "TURNOVER") {
      const primary = tackler ? `#${tackler.number}` : formatPlayer(play.players?.tacklerId);
      return `${playType} ${primary}`.trim();
    }

    return playType;
  },
  [rosterById]
  );

  const mapPlayToSummary = useCallback(
    (play: {
      _id: string;
      sequence: number;
      playType: string;
      yards?: number;
      notes?: string;
      players?: PlaySummary["players"];
      touchdown?: boolean;
      turnover?: boolean;
    }): PlaySummary => {
      const summary: PlaySummary = {
        id: play._id,
        sequence: play.sequence,
        playType: play.playType,
        yards: play.yards ?? 0,
        note: play.notes,
        players: play.players,
        touchdown: play.touchdown,
        turnover: play.turnover,
        label: ""
      };
      summary.label = buildPlayLabel(summary);
      return summary;
    },
    [buildPlayLabel]
  );

  const showSnackbar = useCallback((message: string, severity: "success" | "error") => {
    setSnackbar({ message, severity });
  }, []);

  const clearPendingTimer = useCallback(() => {
    if (pendingTimerRef.current) {
      window.clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
  }, []);

  const finalizePendingPlay = useCallback(
    async (play: PendingPlay) => {
      if (!activeGameId) {
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }

        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBase}/api/games/${activeGameId}/plays`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(play.payload)
        });

        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to record play");
        }

        const saved = (await response.json()) as {
          _id: string;
          sequence: number;
          playType: string;
          yards?: number;
          notes?: string;
          players?: PlaySummary["players"];
          touchdown?: boolean;
          turnover?: boolean;
        };
        const nextPlay = mapPlayToSummary(saved);
        setPlays((prev) => [nextPlay, ...prev]);
        setLastPrimary(primaryPlayer);
        setLastSecondary(secondaryPlayer);
        setGameState((prev) => {
          const nextDown = prev.down >= 4 || Boolean(play.touchdown) ? 1 : prev.down + 1;
          const nextDistance = nextDown === 1 ? 10 : prev.distance;
          const nextYardLine = Math.min(100, Math.max(0, prev.yardLine + play.yards));
          return { ...prev, down: nextDown, distance: nextDistance, yardLine: nextYardLine };
        });
        showSnackbar("Play recorded.", "success");
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to record play";
        setError(message);
        showSnackbar(message, "error");
      } finally {
        clearPendingTimer();
        setPendingPlay(null);
      }
    },
    [
      activeGameId,
      clearPendingTimer,
      getToken,
      mapPlayToSummary,
      primaryPlayer,
      secondaryPlayer,
      showSnackbar
    ]
  );

  const handleUndoPending = useCallback(() => {
    clearPendingTimer();
    setPendingPlay(null);
    showSnackbar("Play discarded.", "success");
  }, [clearPendingTimer, showSnackbar]);

  const handleEditPending = useCallback(() => {
    if (!pendingPlay) {
      return;
    }

    clearPendingTimer();
    setEditTarget("pending");
    setEditForm({
      playType: pendingPlay.playType,
      primaryPlayerId:
        pendingPlay.playType === "pass"
          ? pendingPlay.players?.passerId ?? ""
          : pendingPlay.playType === "run" || pendingPlay.playType === "sack"
          ? pendingPlay.players?.rusherId ?? ""
          : pendingPlay.players?.tacklerId ?? "",
      secondaryPlayerId: pendingPlay.players?.receiverId ?? "",
      yards: pendingPlay.yards,
      touchdown: Boolean(pendingPlay.touchdown),
      turnover: Boolean(pendingPlay.turnover),
      notes: pendingPlay.notes ?? ""
    });
    setIsEditOpen(true);
  }, [clearPendingTimer, pendingPlay]);

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  useEffect(() => {
    if (gameId) {
      setSelectedGameId(gameId);
    }
  }, [gameId]);

  useEffect(() => {
    let isMounted = true;
    const loadPlays = async () => {
      if (!activeGameId) {
        setPlays([]);
        setSelectedPlay(null);
        clearPendingTimer();
        setPendingPlay(null);
        return;
      }

      clearPendingTimer();
      setPendingPlay(null);
      setSelectedPlay(null);

      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBase}/api/games/${activeGameId}/plays`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load plays");
        }
        const data = (await response.json()) as Array<{
          _id: string;
          sequence: number;
          playType: string;
          yards?: number;
          notes?: string;
          players?: PlaySummary["players"];
          touchdown?: boolean;
          turnover?: boolean;
        }>;
        if (isMounted) {
          setPlays(data.map(mapPlayToSummary).reverse());
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load plays";
          setError(message);
          showSnackbar(message, "error");
        }
      }
    };

    void loadPlays();
    return () => {
      isMounted = false;
    };
  }, [activeGameId, clearPendingTimer, getToken, mapPlayToSummary, showSnackbar]);

  useEffect(() => {
    let isMounted = true;
    const loadGames = async () => {
      setGamesLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBase}/api/games`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load games");
        }
        const data = (await response.json()) as GameSummary[];
        if (isMounted) {
          setGames(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load games";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setGamesLoading(false);
        }
      }
    };

    void loadGames();
    return () => {
      isMounted = false;
    };
  }, [getToken]);

  const refreshGames = async () => {
    setGamesLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/games`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load games");
      }
      const data = (await response.json()) as GameSummary[];
      setGames(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load games";
      setError(message);
    } finally {
      setGamesLoading(false);
    }
  };

  const handleCreateGame = async () => {
    setError(null);
    const nextErrors: typeof createErrors = {};
    if (!createForm.season || Number.isNaN(Number(createForm.season))) {
      nextErrors.season = "Season is required.";
    }
    if (!createForm.homeTeam.trim()) {
      nextErrors.homeTeam = "Home team is required.";
    }
    if (!createForm.awayTeam.trim()) {
      nextErrors.awayTeam = "Away team is required.";
    }
    if (!createForm.gameDate) {
      nextErrors.gameDate = "Game date is required.";
    }
    setCreateErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      showSnackbar("Please fill out the required fields.", "error");
      return;
    }

    setIsCreating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }

      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          season: Number(createForm.season),
          homeTeam: createForm.homeTeam.trim(),
          awayTeam: createForm.awayTeam.trim(),
          gameDate: createForm.gameDate
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to create game");
      }

      const created = (await response.json()) as GameSummary;
      await refreshGames();
      setSelectedGameId(created._id);
      if (onSelectGame) {
        onSelectGame(created._id);
      }
      setIsCreateOpen(false);
      showSnackbar("Game created.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create game";
      setError(message);
      showSnackbar(message, "error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectPlay = (playId: string) => {
    const match = plays.find((play) => play.id === playId) ?? null;
    setSelectedPlay(match);
    if (!match) {
      return;
    }

    setEditTarget("saved");
    const playType = match.playType?.toLowerCase() ?? "pass";
    const primaryId =
      playType === "pass"
        ? match.players?.passerId
        : playType === "run" || playType === "sack"
        ? match.players?.rusherId
        : match.players?.tacklerId;

    setEditForm({
      playType,
      primaryPlayerId: primaryId ?? "",
      secondaryPlayerId: match.players?.receiverId ?? "",
      yards: match.yards ?? 0,
      touchdown: Boolean(match.touchdown),
      turnover: Boolean(match.turnover),
      notes: match.note ?? ""
    });
    setIsEditOpen(true);
  };

  const handleUpdatePlay = async () => {
    if (!activeGameId) {
      return;
    }

    const payloadPlayers: PlaySummary["players"] = {};
    if (editForm.playType === "pass") {
      if (editForm.primaryPlayerId) {
        payloadPlayers.passerId = editForm.primaryPlayerId;
      }
      if (editForm.secondaryPlayerId) {
        payloadPlayers.receiverId = editForm.secondaryPlayerId;
      }
    } else if (editForm.playType === "run" || editForm.playType === "sack") {
      if (editForm.primaryPlayerId) {
        payloadPlayers.rusherId = editForm.primaryPlayerId;
      }
    } else if (editForm.playType === "turnover") {
      if (editForm.primaryPlayerId) {
        payloadPlayers.tacklerId = editForm.primaryPlayerId;
      }
    }

    const payload = {
      playType: editForm.playType,
      players: Object.keys(payloadPlayers).length ? payloadPlayers : undefined,
      yards: editForm.yards,
      touchdown: editForm.touchdown,
      turnover: editForm.turnover,
      notes: editForm.notes || undefined
    };

    if (editTarget === "pending" && pendingPlay) {
      const label = buildPlayLabel({ playType: payload.playType, players: payload.players });
      const updatedPending: PendingPlay = {
        ...pendingPlay,
        label,
        playType: payload.playType,
        players: payload.players,
        yards: payload.yards ?? 0,
        touchdown: payload.touchdown,
        turnover: payload.turnover,
        notes: payload.notes,
        payload: {
          ...pendingPlay.payload,
          ...payload
        }
      };
      setPendingPlay(updatedPending);
      setIsEditOpen(false);
      await finalizePendingPlay(updatedPending);
      return;
    }

    if (!selectedPlay) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(
        `${apiBase}/api/games/${activeGameId}/plays/${selectedPlay.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update play");
      }

      const updated = (await response.json()) as {
        _id: string;
        sequence: number;
        playType: string;
        yards?: number;
        notes?: string;
        players?: PlaySummary["players"];
        touchdown?: boolean;
        turnover?: boolean;
      };
      const summary = mapPlayToSummary(updated);
      setPlays((prev) => prev.map((play) => (play.id === summary.id ? summary : play)));
      setSelectedPlay(summary);
      setIsEditOpen(false);
      showSnackbar("Play updated. Stats recalculated.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update play";
      setError(message);
      showSnackbar(message, "error");
    }
  };

  const handleSave = async (result: string) => {
    if (!playType || !primaryPlayer) {
      return;
    }
    if (!activeGameId) {
      setError("Select a game before recording plays.");
      showSnackbar("Select a game before recording plays.", "error");
      return;
    }
    if (pendingPlay) {
      showSnackbar("Finalize the pending play first.", "error");
      return;
    }

    setError(null);
    setIsSaving(true);

    const yards = result.startsWith("+") ? Number(result.replace("+", "")) : 0;
    const touchdown = result === "TD";
    const turnover = result === "INT" || result === "FUMBLE";

    const note = touchdown ? "Touchdown" : turnover ? "Turnover" : undefined;
    const playersPayload: Record<string, string> = {};

    if (playType === "PASS") {
      playersPayload.passerId = primaryPlayer.id;
      if (secondaryPlayer) {
        playersPayload.receiverId = secondaryPlayer.id;
      }
    } else if (playType === "RUN" || playType === "SACK") {
      playersPayload.rusherId = primaryPlayer.id;
    } else if (playType === "TURNOVER") {
      playersPayload.tacklerId = primaryPlayer.id;
    } else {
      playersPayload.rusherId = primaryPlayer.id;
    }

    const payload = {
      sport: "football",
      quarter: gameState.quarter,
      clock: gameState.clock,
      down: gameState.down,
      distance: gameState.distance,
      yardLine: gameState.yardLine,
      playType: playType.toLowerCase(),
      players: Object.keys(playersPayload).length ? playersPayload : undefined,
      yards,
      touchdown,
      turnover,
      notes: note
    };

    const label = buildPlayLabel({ playType: payload.playType, players: payload.players });
    const nextPending: PendingPlay = {
      label,
      playType: payload.playType,
      players: payload.players,
      yards,
      touchdown,
      turnover,
      notes: note,
      payload
    };

    setPendingPlay(nextPending);
    clearPendingTimer();
    pendingTimerRef.current = window.setTimeout(() => {
      void finalizePendingPlay(nextPending);
    }, 3000);
    setSecondaryPlayer(null);
    setIsSaving(false);
  };

  return (
    <Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "3fr 1fr" } }}>
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Active game
            </Typography>
            <FormControl fullWidth size="small">
              <InputLabel id="game-select-label">Game</InputLabel>
              <Select
                labelId="game-select-label"
                label="Game"
                value={selectedGameId}
                onChange={(event) => {
                  const nextId = event.target.value;
                  setSelectedGameId(nextId);
                  if (typeof nextId === "string" && nextId && onSelectGame) {
                    onSelectGame(nextId);
                  }
                }}
              >
                {gamesLoading && (
                  <MenuItem value="" disabled>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      Loading games...
                    </Box>
                  </MenuItem>
                )}
                {!gamesLoading && games.length === 0 && (
                  <MenuItem value="" disabled>
                    No games available
                  </MenuItem>
                )}
                {games.map((game) => (
                  <MenuItem key={game._id} value={game._id}>
                    {game.homeTeam} vs {game.awayTeam} · {new Date(game.gameDate).toLocaleDateString()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              onClick={() => {
                setCreateErrors({});
                setIsCreateOpen(true);
              }}
              sx={{ alignSelf: "flex-start" }}
            >
              Create Game
            </Button>
          </Stack>
        </Paper>
        <GameBar {...gameState} />

        <PlayTypeSelector selected={playType} onSelect={setPlayType} />

        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Primary player
            </Typography>
            <QuickRoster
              title="Recent"
              players={quickPrimary}
              onSelect={(player) => setPrimaryPlayer(player)}
            />
            <PlayerSelector
              title="Roster"
              players={roster}
              selected={primaryPlayer}
              onSelect={setPrimaryPlayer}
            />
          </Stack>
        </Paper>

        <Paper elevation={1} sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography variant="subtitle2" color="text.secondary">
              Secondary player
            </Typography>
            <QuickRoster
              title="Recent"
              players={quickSecondary}
              onSelect={(player) => setSecondaryPlayer(player)}
            />
            <PlayerSelector
              title="Roster"
              players={roster}
              selected={secondaryPlayer}
              onSelect={setSecondaryPlayer}
            />
          </Stack>
        </Paper>

        <Box
          sx={{
            opacity: isSaving || pendingPlay ? 0.6 : 1,
            pointerEvents: isSaving || pendingPlay ? "none" : "auto"
          }}
        >
          <ResultSelector onSelect={handleSave} />
        </Box>
      </Stack>

      <PlayTimeline plays={plays} selectedId={selectedPlay?.id ?? null} onSelect={handleSelectPlay} />

      <Dialog
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setCreateErrors({});
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create game</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Season"
              type="number"
              value={createForm.season}
              onChange={(event) => {
                setCreateForm((prev) => ({ ...prev, season: Number(event.target.value) }));
                setCreateErrors((prev) => ({ ...prev, season: undefined }));
              }}
              inputProps={{ min: 2000 }}
              error={Boolean(createErrors.season)}
              helperText={createErrors.season}
            />
            <TextField
              label="Home team"
              value={createForm.homeTeam}
              onChange={(event) => {
                setCreateForm((prev) => ({ ...prev, homeTeam: event.target.value }));
                setCreateErrors((prev) => ({ ...prev, homeTeam: undefined }));
              }}
              error={Boolean(createErrors.homeTeam)}
              helperText={createErrors.homeTeam}
            />
            <TextField
              label="Away team"
              value={createForm.awayTeam}
              onChange={(event) => {
                setCreateForm((prev) => ({ ...prev, awayTeam: event.target.value }));
                setCreateErrors((prev) => ({ ...prev, awayTeam: undefined }));
              }}
              error={Boolean(createErrors.awayTeam)}
              helperText={createErrors.awayTeam}
            />
            <TextField
              label="Game date"
              type="date"
              value={createForm.gameDate}
              onChange={(event) => {
                setCreateForm((prev) => ({ ...prev, gameDate: event.target.value }));
                setCreateErrors((prev) => ({ ...prev, gameDate: undefined }));
              }}
              InputLabelProps={{ shrink: true }}
              error={Boolean(createErrors.gameDate)}
              helperText={createErrors.gameDate}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateGame} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditTarget(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit play</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="edit-play-type">Play type</InputLabel>
              <Select
                labelId="edit-play-type"
                label="Play type"
                value={editForm.playType}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, playType: event.target.value }))
                }
              >
                {playTypeOptions.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type.toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="edit-primary">Primary player</InputLabel>
              <Select
                labelId="edit-primary"
                label="Primary player"
                value={editForm.primaryPlayerId}
                onChange={(event) =>
                  setEditForm((prev) => ({ ...prev, primaryPlayerId: event.target.value }))
                }
              >
                {roster.map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    #{player.number} {player.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {editForm.playType === "pass" && (
              <FormControl fullWidth size="small">
                <InputLabel id="edit-secondary">Secondary player</InputLabel>
                <Select
                  labelId="edit-secondary"
                  label="Secondary player"
                  value={editForm.secondaryPlayerId}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, secondaryPlayerId: event.target.value }))
                  }
                >
                  <MenuItem value="">None</MenuItem>
                  {roster.map((player) => (
                    <MenuItem key={player.id} value={player.id}>
                      #{player.number} {player.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="Yards"
              type="number"
              value={editForm.yards}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, yards: Number(event.target.value) }))
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.touchdown}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, touchdown: event.target.checked }))
                  }
                />
              }
              label="Touchdown"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.turnover}
                  onChange={(event) =>
                    setEditForm((prev) => ({ ...prev, turnover: event.target.checked }))
                  }
                />
              }
              label="Turnover"
            />
            <TextField
              label="Notes"
              value={editForm.notes}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, notes: event.target.value }))
              }
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsEditOpen(false);
              setEditTarget(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUpdatePlay}>
            Save changes
          </Button>
        </DialogActions>
      </Dialog>

      {snackbar ? (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar(null)}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      ) : null}

      <PlayConfirmationBanner
        play={
          pendingPlay
            ? {
                label: pendingPlay.label,
                yards: pendingPlay.yards,
                touchdown: pendingPlay.touchdown,
                turnover: pendingPlay.turnover
              }
            : null
        }
        onUndo={handleUndoPending}
        onEdit={handleEditPending}
      />
    </Box>
  );
}
