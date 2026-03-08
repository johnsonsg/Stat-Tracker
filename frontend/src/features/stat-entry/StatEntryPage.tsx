import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Popover,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { ChevronDown, Keyboard } from "lucide-react";
import GameBar from "./components/GameBar";
import PlayTypeSelector from "./components/PlayTypeSelector";
import PlayerSelector from "./components/PlayerSelector";
import ResultSelector from "./components/ResultSelector";
import PlayTimeline from "./components/PlayTimeline";
import type { TeamPlayer, TeamScheduleGame } from "@/types/teamData";
import PlayConfirmationBanner from "./components/PlayConfirmationBanner";
import Scoreboard from "@/components/Scoreboard";
import { socket } from "@/services/socket";
import { useHotkeys } from "react-hotkeys-hook";
import { usePlayerFlags } from "@/state/playerFlags";
import { getSessionStorage } from "@/state/storage";

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
  schedule: TeamScheduleGame[];
  teamName: string | null;
};

type GameSummary = {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  status: string;
  score?: {
    home?: number;
    away?: number;
  };
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

const PLAY_TYPE_HOTKEYS = {
  pass: "p",
  run: "r",
  sack: "s",
  turnover: "t",
  fg: "g",
  punt: "u",
  penalty: "n"
} as const;

const RESULT_HOTKEYS = {
  "+1": "1",
  "+3": "3",
  "+5": "5",
  "+10": "0",
  "+20": "2",
  INC: "c",
  TD: "d",
  INT: "i",
  FUMBLE: "f"
} as const;

export default function StatEntryPage({
  gameId,
  onSelectGame,
  roster,
  schedule,
  teamName
}: StatEntryPageProps) {
  const accordionStorageKey = "stat-tracker:stat-entry-accordions";
  const positionGroupStorageKey = "stat-tracker:stat-entry-position-group";
  const accordionStorage = useMemo(() => getSessionStorage(), []);
  const { getToken } = useAuth();
  const [playType, setPlayType] = useState<string | undefined>();
  const [primaryPlayer, setPrimaryPlayer] = useState<TeamPlayer | null>(null);
  const [secondaryPlayer, setSecondaryPlayer] = useState<TeamPlayer | null>(null);
  const [plays, setPlays] = useState<PlaySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [hasLoadedGames, setHasLoadedGames] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | "">(gameId ?? "");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isScheduleCreating, setIsScheduleCreating] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
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
  const [shortcutAnchor, setShortcutAnchor] = useState<HTMLElement | null>(null);
  const [activePlayerField, setActivePlayerField] = useState<"primary" | "secondary">("primary");
  const statEntryRef = useRef<HTMLDivElement | null>(null);
  const primarySelectorRef = useRef<HTMLDivElement | null>(null);
  const secondarySelectorRef = useRef<HTMLDivElement | null>(null);
  const autoCreateRef = useRef(false);
  const [gameState, setGameState] = useState({
    quarter: 1,
    clock: "12:00",
    down: 1,
    distance: 10,
    yardLine: 25
  });
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [isScoreUpdating, setIsScoreUpdating] = useState(false);
  const [positionGroupTab, setPositionGroupTab] = useState(() => {
    const stored = accordionStorage.getItem(positionGroupStorageKey);
    if (stored === "offense" || stored === "defense" || stored === "special" || stored === "all") {
      return stored;
    }
    return "all";
  });
  const [accordionState, setAccordionState] = useState(() => {
    const fallback = {
      scoreboard: true,
      primary: true,
      secondary: true,
      starters: true,
      unflagged: true
    };
    const raw = accordionStorage.getItem(accordionStorageKey);
    if (!raw) {
      return fallback;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<typeof fallback>;
      return {
        scoreboard: parsed.scoreboard ?? fallback.scoreboard,
        primary: parsed.primary ?? fallback.primary,
        secondary: parsed.secondary ?? fallback.secondary,
        starters: parsed.starters ?? fallback.starters,
        unflagged: parsed.unflagged ?? fallback.unflagged
      };
    } catch {
      return fallback;
    }
  });
  const { primaryIds, secondaryIds, starterIds } = usePlayerFlags();

  const rosterById = useMemo(() => new Map(roster.map((player) => [player.id, player])), [roster]);
  const primaryFlagged = useMemo(
    () => roster.filter((player) => primaryIds.includes(player.id)),
    [primaryIds, roster]
  );
  const secondaryFlagged = useMemo(
    () => roster.filter((player) => secondaryIds.includes(player.id)),
    [secondaryIds, roster]
  );
  const starterFlagged = useMemo(
    () => roster.filter((player) => starterIds.includes(player.id)),
    [starterIds, roster]
  );
  const primaryIdSet = useMemo(() => new Set(primaryIds), [primaryIds]);
  const starterIdSet = useMemo(() => new Set(starterIds), [starterIds]);

  const secondaryOnly = useMemo(
    () => secondaryFlagged.filter((player) => !primaryIdSet.has(player.id) && !starterIdSet.has(player.id)),
    [primaryIdSet, secondaryFlagged, starterIdSet]
  );

  const unflaggedRoster = useMemo(
    () =>
      roster.filter(
        (player) =>
          !primaryIdSet.has(player.id) &&
          !starterIdSet.has(player.id) &&
          !secondaryIds.includes(player.id)
      ),
    [primaryIdSet, roster, secondaryIds, starterIdSet]
  );

  const normalizeGroup = useCallback((value: string) => value.trim().toLowerCase(), []);

  const matchesGroup = useCallback(
    (player: TeamPlayer, tab: string) => {
      if (tab === "all") {
        return true;
      }
      const groups = player.positionGroup ?? [];
      return groups.some((group) => {
        const normalized = normalizeGroup(group);
        if (tab === "special") {
          return (
            normalized === "special" ||
            normalized === "special teams" ||
            normalized === "special-teams"
          );
        }
        return normalized === tab;
      });
    },
    [normalizeGroup]
  );

  const matchesPositionGroup = useCallback(
    (player: TeamPlayer) => matchesGroup(player, positionGroupTab),
    [matchesGroup, positionGroupTab]
  );

  const filterByGroup = useCallback(
    (list: TeamPlayer[]) => list.filter(matchesPositionGroup),
    [matchesPositionGroup]
  );

  const filteredStarterFlagged = useMemo(
    () => filterByGroup(starterFlagged),
    [filterByGroup, starterFlagged]
  );


  const groupCounts = useMemo(() => {
    return {
      all: roster.length,
      offense: roster.filter((player) => matchesGroup(player, "offense")).length,
      defense: roster.filter((player) => matchesGroup(player, "defense")).length,
      special: roster.filter((player) => matchesGroup(player, "special")).length
    };
  }, [matchesGroup, roster]);

  const primaryRoster = useMemo(
    () => filterByGroup(primaryFlagged),
    [filterByGroup, primaryFlagged]
  );

  const secondaryRoster = useMemo(
    () => filterByGroup(secondaryOnly),
    [filterByGroup, secondaryOnly]
  );

  const renderTabLabel = (label: string, count: number) => (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box component="span">{label}</Box>
      <Box
        component="span"
        sx={{
          px: 1,
          borderRadius: 999,
          bgcolor: "action.selected",
          fontSize: "0.75rem",
          fontWeight: 600
        }}
      >
        {count}
      </Box>
    </Box>
  );

  const handleAccordionChange = useCallback(
    (key: "scoreboard" | "primary" | "secondary" | "starters" | "unflagged") =>
      (_event: SyntheticEvent, expanded: boolean) => {
        setAccordionState((prev) => ({ ...prev, [key]: expanded }));
      },
    []
  );

  useEffect(() => {
    accordionStorage.setItem(accordionStorageKey, JSON.stringify(accordionState));
  }, [accordionState, accordionStorage]);

  useEffect(() => {
    accordionStorage.setItem(positionGroupStorageKey, positionGroupTab);
  }, [accordionStorage, positionGroupTab]);
  const playTypeOptions = [
    "pass",
    "incomplete",
    "run",
    "sack",
    "punt",
    "fg",
    "penalty",
    "turnover"
  ];
  const activeGameId = gameId ?? (selectedGameId || null);
  const isEditingDialogOpen = isEditOpen || isCreateOpen;
  const isShortcutOpen = Boolean(shortcutAnchor);
  const shortcutId = isShortcutOpen ? "stat-entry-shortcuts" : undefined;
  const isPrimaryActive = activePlayerField === "primary";
  const normalizedTeamName = teamName?.trim() ?? "";

  const toDateKey = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().slice(0, 10);
  };

  const normalizeText = (value: string) => value.trim().toLowerCase();

  const inferMatchup = (item: TeamScheduleGame) => {
    const location = item.location.toLowerCase();
    const isHome = location.includes("home");
    const isAway = location.includes("away");
    let homeTeam = normalizedTeamName || "Home";
    let awayTeam = item.opponent;
    if (isAway && !isHome) {
      homeTeam = item.opponent;
      awayTeam = normalizedTeamName || "Away";
    }
    return { homeTeam, awayTeam };
  };

  const formatLocationLabel = (value: string) => {
    const location = value.toLowerCase();
    if (location.includes("home")) {
      return "Home";
    }
    if (location.includes("away")) {
      return "Away";
    }
    return "TBD";
  };

  const formatScheduleDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString();
  };

  const scheduleMatches = useMemo(() => {
    const matches = new Map<string, GameSummary>();
    schedule.forEach((item) => {
      const match = games.find((game) => {
        if (toDateKey(game.gameDate) !== toDateKey(item.dateTime)) {
          return false;
        }
        const opponent = normalizeText(item.opponent);
        return (
          normalizeText(game.homeTeam) === opponent ||
          normalizeText(game.awayTeam) === opponent
        );
      });
      if (match) {
        matches.set(item.id, match);
      }
    });
    return matches;
  }, [games, schedule]);

  const sortedSchedule = useMemo(() => {
    return [...schedule].sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      if (Number.isNaN(dateA) || Number.isNaN(dateB)) {
        return 0;
      }
      return dateA - dateB;
    });
  }, [schedule]);

  const matchedGameIds = useMemo(() => {
    return new Set(Array.from(scheduleMatches.values()).map((game) => game._id));
  }, [scheduleMatches]);

  const selectedGame = useMemo(
    () => games.find((game) => game._id === selectedGameId) ?? null,
    [games, selectedGameId]
  );

  const resolveScore = useCallback((game: GameSummary | null) => {
    return {
      home: game?.score?.home ?? 0,
      away: game?.score?.away ?? 0
    };
  }, []);

  const resolveTeamSide = useCallback(
    (game: GameSummary | null) => {
      if (!game) {
        return "home" as const;
      }
      const team = normalizeText(normalizedTeamName);
      if (team && normalizeText(game.homeTeam) === team) {
        return "home" as const;
      }
      if (team && normalizeText(game.awayTeam) === team) {
        return "away" as const;
      }
      return "home" as const;
    },
    [normalizedTeamName]
  );

  const shouldIgnoreHotkey = (event?: KeyboardEvent) => {
    const target = event?.target as HTMLElement | null;
    if (!target) {
      return true;
    }
    const tagName = target.tagName;
    if (
      target.isContentEditable ||
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT"
    ) {
      return true;
    }
    const activeElement = document.activeElement as HTMLElement | null;
    if (!activeElement || !statEntryRef.current?.contains(activeElement)) {
      return true;
    }
    return false;
  };

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

    if (playType === "INCOMPLETE") {
      const primary = passer ? `#${passer.number}` : formatPlayer(play.players?.passerId);
      const secondary = receiver ? `#${receiver.number}` : formatPlayer(play.players?.receiverId);
      return secondary
        ? `PASS ${primary} -> INC (${secondary})`
        : `PASS ${primary} -> INC`;
    }

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
      const normalizeId = (value: unknown) => (value ? String(value) : "");
      const resolveNote = () => {
        if (play.notes) {
          return play.notes;
        }
        const playType = play.playType?.toLowerCase() ?? "";
        if (playType === "incomplete") {
          return "Incomplete";
        }
        if (play.touchdown) {
          return "Touchdown";
        }
        if (play.turnover) {
          return playType === "pass" ? "INT" : "Fumble";
        }
        return undefined;
      };
      const summary: PlaySummary = {
        id: normalizeId(play._id),
        sequence: play.sequence,
        playType: play.playType,
        yards: play.yards ?? 0,
        note: resolveNote(),
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

  const updateScore = useCallback(
    async (nextScore: { home: number; away: number }) => {
      if (!selectedGame) {
        return;
      }
      setIsScoreUpdating(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(`${apiBase}/api/games/${selectedGame._id}/score`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(nextScore)
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to update score");
        }
        const updated = (await response.json()) as GameSummary;
        setScore(resolveScore(updated));
        setGames((prev) => prev.map((game) => (game._id === updated._id ? updated : game)));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update score";
        setError(message);
        showSnackbar(message, "error");
      } finally {
        setIsScoreUpdating(false);
      }
    },
    [getToken, resolveScore, selectedGame, showSnackbar]
  );

  const handleAdjustScore = useCallback(
    async (team: "home" | "away", delta: number) => {
      const next = {
        home: score.home,
        away: score.away
      };
      next[team] = Math.max(0, next[team] + delta);
      await updateScore(next);
    },
    [score.away, score.home, updateScore]
  );

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
        if (!socket.connected) {
          setPlays((prev) => {
            if (prev.some((item) => item.id === nextPlay.id)) {
              return prev;
            }
            return [nextPlay, ...prev];
          });
        }
        if (play.touchdown) {
          const teamSide = resolveTeamSide(selectedGame);
          await handleAdjustScore(teamSide, 6);
        }
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
      handleAdjustScore,
      mapPlayToSummary,
      primaryPlayer,
      resolveTeamSide,
      selectedGame,
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
    setScore(resolveScore(selectedGame));
  }, [resolveScore, selectedGame]);

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
    if (!activeGameId) {
      return;
    }

    socket.emit("joinGame", activeGameId);

    const handleRecorded = (play: {
      _id: string;
      sequence: number;
      playType: string;
      yards?: number;
      notes?: string;
      players?: PlaySummary["players"];
      touchdown?: boolean;
      turnover?: boolean;
    }) => {
      const summary = mapPlayToSummary(play);
      setPlays((prev) => {
        if (prev.some((item) => item.id === summary.id)) {
          return prev;
        }
        return [summary, ...prev];
      });
    };

    const handleUpdated = (play: {
      _id: string;
      sequence: number;
      playType: string;
      yards?: number;
      notes?: string;
      players?: PlaySummary["players"];
      touchdown?: boolean;
      turnover?: boolean;
    }) => {
      const summary = mapPlayToSummary(play);
      setPlays((prev) => prev.map((item) => (item.id === summary.id ? summary : item)));
    };

    const handleDeleted = (play: { _id: string }) => {
      const deletedId = play?._id ? String(play._id) : "";
      setPlays((prev) => prev.filter((item) => item.id !== deletedId));
      if (selectedPlay?.id === deletedId) {
        setSelectedPlay(null);
      }
    };

    const handleGameStarted = () => {
      showSnackbar("Game started.", "success");
    };

    const handleGameFinished = () => {
      showSnackbar("Game finished.", "success");
    };

    const handleGameStatusChanged = (payload: { status?: string }) => {
      if (payload?.status) {
        showSnackbar(`Game status: ${payload.status}`, "success");
      }
    };

    socket.on("playRecorded", handleRecorded);
    socket.on("playUpdated", handleUpdated);
    socket.on("playDeleted", handleDeleted);
    socket.on("gameStarted", handleGameStarted);
    socket.on("gameFinished", handleGameFinished);
    socket.on("gameStatusChanged", handleGameStatusChanged);

    return () => {
      socket.off("playRecorded", handleRecorded);
      socket.off("playUpdated", handleUpdated);
      socket.off("playDeleted", handleDeleted);
      socket.off("gameStarted", handleGameStarted);
      socket.off("gameFinished", handleGameFinished);
      socket.off("gameStatusChanged", handleGameStatusChanged);
      socket.emit("leaveGame", activeGameId);
    };
  }, [activeGameId, mapPlayToSummary, selectedPlay, showSnackbar]);

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
          setHasLoadedGames(true);
        }
      }
    };

    void loadGames();
    return () => {
      isMounted = false;
    };
  }, [getToken]);

  const refreshGames = useCallback(async () => {
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
  }, [getToken]);


  const createGameFromSchedule = useCallback(async (item: TeamScheduleGame) => {
    if (!normalizedTeamName) {
      showSnackbar("Set your team name before creating a game.", "error");
      return;
    }

    const matchup = inferMatchup(item);
    const existing = games.find((game) => {
      if (toDateKey(game.gameDate) !== toDateKey(item.dateTime)) {
        return false;
      }
      return (
        normalizeText(game.homeTeam) === normalizeText(matchup.homeTeam) &&
        normalizeText(game.awayTeam) === normalizeText(matchup.awayTeam)
      );
    });

    if (existing) {
      setSelectedGameId(existing._id);
      if (onSelectGame) {
        onSelectGame(existing._id);
      }
      return;
    }

    setIsScheduleCreating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }

      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const seasonDate = new Date(item.dateTime);
      const season = Number.isNaN(seasonDate.getTime())
        ? new Date().getFullYear()
        : seasonDate.getFullYear();

      const response = await fetch(`${apiBase}/api/games`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          season,
          homeTeam: matchup.homeTeam,
          awayTeam: matchup.awayTeam,
          gameDate: item.dateTime,
          status: "scheduled"
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
      showSnackbar("Game created from schedule.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create game";
      setError(message);
      showSnackbar(message, "error");
    } finally {
      setIsScheduleCreating(false);
    }
  }, [games, getToken, inferMatchup, normalizeText, normalizedTeamName, onSelectGame, refreshGames, showSnackbar]);

  useEffect(() => {
    if (autoCreateRef.current) {
      return;
    }
    if (!hasLoadedGames || gamesLoading || games.length > 0) {
      return;
    }
    if (!normalizedTeamName) {
      return;
    }
    if (!selectedGameId && sortedSchedule.length > 0) {
      autoCreateRef.current = true;
      void createGameFromSchedule(sortedSchedule[0]);
    }
  }, [createGameFromSchedule, games.length, gamesLoading, hasLoadedGames, normalizedTeamName, selectedGameId, sortedSchedule]);

  const handleStartGame = async () => {
    if (!selectedGame) {
      return;
    }
    setIsStatusUpdating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/games/${selectedGame._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "live" })
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to start game");
      }
      await refreshGames();
      showSnackbar("Game marked live.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start game";
      setError(message);
      showSnackbar(message, "error");
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleEndGame = async () => {
    if (!selectedGame) {
      return;
    }
    setIsStatusUpdating(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/games/${selectedGame._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: "finished" })
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to end game");
      }
      await refreshGames();
      showSnackbar("Game marked finished.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to end game";
      setError(message);
      showSnackbar(message, "error");
    } finally {
      setIsStatusUpdating(false);
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
      playType === "pass" || playType === "incomplete"
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
    if (editForm.playType === "pass" || editForm.playType === "incomplete") {
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

  const handleSave = useCallback(async (result: string) => {
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

    if (result === "INC" && playType !== "PASS") {
      showSnackbar("Incomplete is only for pass plays.", "error");
      setIsSaving(false);
      return;
    }

    const yards = result.startsWith("+") ? Number(result.replace("+", "")) : 0;
    const touchdown = result === "TD";
    const turnover = result === "INT" || result === "FUMBLE";
    const isIncomplete = result === "INC";

    const note = touchdown
      ? "Touchdown"
      : result === "INT"
      ? "INT"
      : result === "FUMBLE"
      ? "Fumble"
      : isIncomplete
      ? "Incomplete"
      : undefined;
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
      playType: (isIncomplete ? "incomplete" : playType.toLowerCase()),
      players: Object.keys(playersPayload).length ? playersPayload : undefined,
      yards: isIncomplete ? 0 : yards,
      touchdown: isIncomplete ? false : touchdown,
      turnover: isIncomplete ? false : turnover,
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
  }, [
    activeGameId,
    buildPlayLabel,
    clearPendingTimer,
    finalizePendingPlay,
    gameState.clock,
    gameState.distance,
    gameState.down,
    gameState.quarter,
    gameState.yardLine,
    pendingPlay,
    playType,
    primaryPlayer,
    secondaryPlayer,
    showSnackbar
  ]);

  const selectPlayType = useCallback(
    (nextType: string) => {
      if (isEditingDialogOpen || pendingPlay) {
        return;
      }
      setPlayType(nextType.toUpperCase());
    },
    [isEditingDialogOpen, pendingPlay]
  );

  const triggerResult = useCallback(
    (result: string) => {
      if (isEditingDialogOpen || pendingPlay) {
        return;
      }
      if (!playType || !primaryPlayer) {
        showSnackbar("Select play type and primary player first.", "error");
        return;
      }
      void handleSave(result);
    },
    [handleSave, isEditingDialogOpen, pendingPlay, playType, primaryPlayer, showSnackbar]
  );

  const confirmPendingPlay = useCallback(() => {
    if (!pendingPlay) {
      return;
    }
    clearPendingTimer();
    void finalizePendingPlay(pendingPlay);
  }, [clearPendingTimer, finalizePendingPlay, pendingPlay]);

  const undoLastSavedPlay = useCallback(async () => {
    if (!activeGameId) {
      showSnackbar("Select a game before undoing a play.", "error");
      return;
    }
    if (plays.length === 0) {
      showSnackbar("No saved plays to undo.", "error");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/games/${activeGameId}/plays/latest`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to undo play");
      }

      const removed = (await response.json()) as { _id: string };
      setPlays((prev) => prev.filter((play) => play.id !== removed._id));
      if (selectedPlay?.id === removed._id) {
        setSelectedPlay(null);
      }
      showSnackbar("Last play removed.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to undo play";
      setError(message);
      showSnackbar(message, "error");
    }
  }, [activeGameId, getToken, plays.length, selectedPlay, showSnackbar]);

  useHotkeys(PLAY_TYPE_HOTKEYS.pass, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("pass");
  });
  useHotkeys(PLAY_TYPE_HOTKEYS.run, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("run");
  });
  useHotkeys(PLAY_TYPE_HOTKEYS.sack, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("sack");
  });
  useHotkeys(PLAY_TYPE_HOTKEYS.turnover, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("turnover");
  });
  useHotkeys(PLAY_TYPE_HOTKEYS.fg, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("fg");
  });
  useHotkeys(PLAY_TYPE_HOTKEYS.punt, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("punt");
  });
  useHotkeys(PLAY_TYPE_HOTKEYS.penalty, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    selectPlayType("penalty");
  });

  useHotkeys(RESULT_HOTKEYS["+1"], (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("+1");
  });
  useHotkeys(RESULT_HOTKEYS["+3"], (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("+3");
  });
  useHotkeys(RESULT_HOTKEYS["+5"], (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("+5");
  });
  useHotkeys(RESULT_HOTKEYS["+10"], (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("+10");
  });
  useHotkeys(RESULT_HOTKEYS["+20"], (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("+20");
  });
  useHotkeys(RESULT_HOTKEYS.INC, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("INC");
  });
  useHotkeys(RESULT_HOTKEYS.TD, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("TD");
  });
  useHotkeys(RESULT_HOTKEYS.INT, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("INT");
  });
  useHotkeys(RESULT_HOTKEYS.FUMBLE, (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    triggerResult("FUMBLE");
  });

  useHotkeys("space", (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    event?.preventDefault();
    confirmPendingPlay();
  });

  useHotkeys("tab", (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    event?.preventDefault();
    const nextField = activePlayerField === "primary" ? "secondary" : "primary";
    setActivePlayerField(nextField);
    const container =
      nextField === "primary" ? primarySelectorRef.current : secondarySelectorRef.current;
    const button = container?.querySelector("button");
    button?.focus();
  });

  useHotkeys("e", (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    if (pendingPlay) {
      handleEditPending();
    } else if (selectedPlay) {
      handleSelectPlay(selectedPlay.id);
    } else if (plays.length > 0) {
      handleSelectPlay(plays[0].id);
    }
  });

  useHotkeys("backspace", (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    event?.preventDefault();
    if (pendingPlay) {
      handleUndoPending();
      return;
    }
    void undoLastSavedPlay();
  });

  useHotkeys("esc", (event) => {
    if (isEditingDialogOpen || shouldIgnoreHotkey(event)) {
      return;
    }
    if (pendingPlay) {
      handleUndoPending();
    } else {
      showSnackbar("No pending play to cancel.", "error");
    }
  });

  return (
    <Box
      ref={statEntryRef}
      sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", lg: "3fr 1fr" } }}
    >
      <Stack spacing={3}>
        {error && <Alert severity="error">{error}</Alert>}
        <Accordion
          expanded={accordionState.scoreboard}
          onChange={handleAccordionChange("scoreboard")}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="subtitle2" color="text.secondary">
              Scoreboard
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Scoreboard
              homeLabel={selectedGame?.homeTeam ?? "Home"}
              awayLabel={selectedGame?.awayTeam ?? "Away"}
              homeScore={score.home}
              awayScore={score.away}
              onAdjustScore={handleAdjustScore}
              isUpdating={isScoreUpdating}
            />
          </AccordionDetails>
        </Accordion>
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
                  if (typeof nextId !== "string") {
                    return;
                  }
                  if (nextId.startsWith("schedule:")) {
                    const scheduleId = nextId.replace("schedule:", "");
                    const match = schedule.find((item) => item.id === scheduleId);
                    if (match) {
                      void createGameFromSchedule(match);
                    }
                    return;
                  }

                  setSelectedGameId(nextId);
                  if (nextId && onSelectGame) {
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
                {!gamesLoading && games.length === 0 && schedule.length === 0 && (
                  <MenuItem value="" disabled>
                    No games available
                  </MenuItem>
                )}
                {sortedSchedule.map((item) => {
                  const match = scheduleMatches.get(item.id);
                  const label = `vs ${item.opponent} · ${formatScheduleDate(item.dateTime)} · ${formatLocationLabel(item.location)}`;
                  if (match) {
                    const statusLabel =
                      match.status === "live"
                        ? "Live"
                        : match.status === "finished"
                        ? "Final"
                        : "Scheduled";
                    return (
                      <MenuItem key={`schedule-${item.id}`} value={match._id}>
                        {statusLabel}: {label}
                      </MenuItem>
                    );
                  }
                  return (
                    <MenuItem key={`schedule-${item.id}`} value={`schedule:${item.id}`}>
                      Scheduled: {label}
                    </MenuItem>
                  );
                })}
                {games
                  .filter((game) => !matchedGameIds.has(game._id))
                  .map((game) => (
                    <MenuItem key={game._id} value={game._id}>
                      {game.homeTeam} vs {game.awayTeam} · {new Date(game.gameDate).toLocaleDateString()} · {game.status}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              {schedule.length === 0 && (
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
              )}
              {selectedGame?.status === "scheduled" && (
                <Button
                  variant="outlined"
                  onClick={handleStartGame}
                  disabled={isStatusUpdating || isScheduleCreating}
                >
                  {isStatusUpdating ? "Starting..." : "Start Game"}
                </Button>
              )}
              {selectedGame?.status === "live" && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleEndGame}
                  disabled={isStatusUpdating || isScheduleCreating}
                >
                  {isStatusUpdating ? "Ending..." : "End Game"}
                </Button>
              )}
            </Stack>
          </Stack>
        </Paper>
        <GameBar {...gameState} />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Tooltip title="Keyboard shortcuts">
            <IconButton
              aria-describedby={shortcutId}
              size="small"
              onClick={(event) => setShortcutAnchor(event.currentTarget)}
            >
              <Keyboard size={18} />
            </IconButton>
          </Tooltip>
          <Popover
            id={shortcutId}
            open={isShortcutOpen}
            anchorEl={shortcutAnchor}
            onClose={() => setShortcutAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Box sx={{ p: 2, maxWidth: 320 }}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2">Play types</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {[
                      { label: "Pass", key: PLAY_TYPE_HOTKEYS.pass.toUpperCase() },
                      { label: "Run", key: PLAY_TYPE_HOTKEYS.run.toUpperCase() },
                      { label: "Sack", key: PLAY_TYPE_HOTKEYS.sack.toUpperCase() },
                      { label: "Turnover", key: PLAY_TYPE_HOTKEYS.turnover.toUpperCase() },
                      { label: "Field goal", key: PLAY_TYPE_HOTKEYS.fg.toUpperCase() },
                      { label: "Punt", key: PLAY_TYPE_HOTKEYS.punt.toUpperCase() },
                      { label: "Penalty", key: PLAY_TYPE_HOTKEYS.penalty.toUpperCase() }
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2
                        }}
                      >
                        <Typography variant="body2">{item.label}</Typography>
                        <Box
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            px: 1,
                            py: 0.25,
                            fontSize: "0.75rem",
                            fontFamily: "monospace"
                          }}
                        >
                          {item.key}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Results</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {[
                      { label: "+1", key: RESULT_HOTKEYS["+1"].toUpperCase() },
                      { label: "+3", key: RESULT_HOTKEYS["+3"].toUpperCase() },
                      { label: "+5", key: RESULT_HOTKEYS["+5"].toUpperCase() },
                      { label: "+10", key: RESULT_HOTKEYS["+10"].toUpperCase() },
                      { label: "+20", key: RESULT_HOTKEYS["+20"].toUpperCase() },
                      { label: "INC", key: RESULT_HOTKEYS.INC.toUpperCase() },
                      { label: "TD", key: RESULT_HOTKEYS.TD.toUpperCase() },
                      { label: "INT", key: RESULT_HOTKEYS.INT.toUpperCase() },
                      { label: "Fumble", key: RESULT_HOTKEYS.FUMBLE.toUpperCase() }
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2
                        }}
                      >
                        <Typography variant="body2">{item.label}</Typography>
                        <Box
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            px: 1,
                            py: 0.25,
                            fontSize: "0.75rem",
                            fontFamily: "monospace"
                          }}
                        >
                          {item.key}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle2">Actions</Typography>
                  <Stack spacing={0.75} sx={{ mt: 1 }}>
                    {[
                      { label: "Confirm play", key: "Space" },
                      { label: "Edit last play", key: "E" },
                      { label: "Undo last play", key: "Backspace" },
                      { label: "Cancel current entry", key: "Esc" },
                      { label: "Switch player selector", key: "Tab" }
                    ].map((item) => (
                      <Box
                        key={item.label}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 2
                        }}
                      >
                        <Typography variant="body2">{item.label}</Typography>
                        <Box
                          sx={{
                            border: 1,
                            borderColor: "divider",
                            borderRadius: 1,
                            px: 1,
                            py: 0.25,
                            fontSize: "0.75rem",
                            fontFamily: "monospace"
                          }}
                        >
                          {item.key}
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </Box>
          </Popover>
        </Box>

        <PlayTypeSelector selected={playType} onSelect={setPlayType} />

        <Paper elevation={1} sx={{ p: 1 }}>
          <Tabs
            value={positionGroupTab}
            onChange={(_, value) => setPositionGroupTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
          >
            <Tab value="all" label={renderTabLabel("All", groupCounts.all)} />
            <Tab value="offense" label={renderTabLabel("Offense", groupCounts.offense)} />
            <Tab value="defense" label={renderTabLabel("Defense", groupCounts.defense)} />
            <Tab value="special" label={renderTabLabel("Special Teams", groupCounts.special)} />
          </Tabs>
        </Paper>

        <Accordion
          expanded={accordionState.primary}
          onChange={handleAccordionChange("primary")}
          sx={{
            border: "1px solid",
            borderColor: isPrimaryActive ? "primary.main" : "divider"
          }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="subtitle2" color="text.secondary">
              Playmakers
            </Typography>
          </AccordionSummary>
          <AccordionDetails ref={primarySelectorRef}>
            <Stack spacing={2}>
              {primaryRoster.length > 0 ? (
                <PlayerSelector
                  title=""
                  players={primaryRoster}
                  selected={primaryPlayer}
                  onSelect={(player) => {
                    setActivePlayerField("primary");
                    setPrimaryPlayer(player);
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No players in this group.
                </Typography>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={accordionState.secondary}
          onChange={handleAccordionChange("secondary")}
          sx={{
            border: "1px solid",
            borderColor: isPrimaryActive ? "divider" : "primary.main"
          }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="subtitle2" color="text.secondary">
              Other Players
            </Typography>
          </AccordionSummary>
          <AccordionDetails ref={secondarySelectorRef}>
            <Stack spacing={2}>
              {secondaryRoster.length > 0 ? (
                <PlayerSelector
                  title=""
                  players={secondaryRoster}
                  selected={secondaryPlayer}
                  onSelect={(player) => {
                    setActivePlayerField("secondary");
                    setSecondaryPlayer(player);
                  }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No players in this group.
                </Typography>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={accordionState.starters}
          onChange={handleAccordionChange("starters")}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="subtitle2" color="text.secondary">
              Starters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {filteredStarterFlagged.length > 0 ? (
              <PlayerSelector
                title=""
                players={filteredStarterFlagged}
                onSelect={(player) => {
                  if (isPrimaryActive) {
                    setPrimaryPlayer(player);
                  } else {
                    setSecondaryPlayer(player);
                  }
                }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No starters in this group.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={accordionState.unflagged}
          onChange={handleAccordionChange("unflagged")}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <AccordionSummary expandIcon={<ChevronDown size={18} />}>
            <Typography variant="subtitle2" color="text.secondary">
              Roster (unflagged)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            {unflaggedRoster.length > 0 ? (
              <PlayerSelector
                title="Roster"
                players={unflaggedRoster}
                onSelect={(player) => {
                  if (isPrimaryActive) {
                    setPrimaryPlayer(player);
                  } else {
                    setSecondaryPlayer(player);
                  }
                }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary">
                No unflagged players.
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>

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
              error={Boolean(createErrors.gameDate)}
              helperText={createErrors.gameDate}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsCreateOpen(false);
              setCreateErrors({});
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateGame} disabled={isCreating}>
            {isCreating ? "Saving..." : "Create game"}
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
            {(editForm.playType === "pass" || editForm.playType === "incomplete") && (
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
