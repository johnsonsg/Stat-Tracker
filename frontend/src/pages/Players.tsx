import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useAuth } from "@clerk/clerk-react";
import { useTeamData } from "@/state/useTeamData";

type GameSummary = {
  _id: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  status: string;
};

type PlayerGameStat = {
  _id: string;
  playerId: string;
  passing?: number;
  rushing?: number;
  receiving?: number;
  tackles?: number;
  sacks?: number;
  interceptions?: number;
  tds?: number;
};

export default function Players() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { getToken } = useAuth();
  const { teamData } = useTeamData();
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [stats, setStats] = useState<PlayerGameStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "passing" | "rushing" | "receiving" | "tackles" | "defense" | "special" | "points"
  >("passing");

  const playersById = useMemo(
    () => new Map((teamData?.players ?? []).map((player) => [player.id, player])),
    [teamData]
  );

  const getNumber = (stat: PlayerGameStat, key: string) => {
    const value = (stat as Record<string, unknown>)[key];
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  };

  const getFirstNumber = (stat: PlayerGameStat, keys: string[]) => {
    for (const key of keys) {
      const value = getNumber(stat, key);
      if (value) {
        return value;
      }
    }
    return 0;
  };

  const round1 = (value: number) => Math.round(value * 10) / 10;

  const safeDiv = (num: number, denom: number) => (denom ? num / denom : 0);

  const qbRating = (comp: number, att: number, yds: number, td: number, ints: number) => {
    if (!att) {
      return 0;
    }
    const a = Math.max(0, Math.min(2.375, ((comp / att) - 0.3) * 5));
    const b = Math.max(0, Math.min(2.375, ((yds / att) - 3) * 0.25));
    const c = Math.max(0, Math.min(2.375, (td / att) * 20));
    const d = Math.max(0, Math.min(2.375, 2.375 - (ints / att) * 25));
    return round1(((a + b + c + d) / 6) * 100);
  };

  const baseColumns: GridColDef[] = [
    { field: "number", headerName: "#", width: 60, minWidth: 60, align: "left", headerAlign: "left" },
    { field: "athlete", headerName: "Athlete", width: 220, minWidth: 220, align: "left", headerAlign: "left" }
  ];

  const statCol = (field: string, headerName: string): GridColDef => ({
    field,
    headerName,
    type: "number",
    flex: 1,
    minWidth: 75,
    align: "left",
    headerAlign: "left"
  });

  const percentCol = (field: string, headerName: string): GridColDef => ({
    field,
    headerName,
    flex: 1,
    minWidth: 100,
    align: "left",
    headerAlign: "left",
    valueFormatter: ({ value }) => `${round1(Number(value ?? 0))}%`
  });

  const avgCol = (field: string, headerName: string): GridColDef => ({
    field,
    headerName,
    flex: 1,
    minWidth: 100,
    align: "left",
    headerAlign: "left",
    valueFormatter: ({ value }) => round1(Number(value ?? 0)).toFixed(1)
  });

  const categories = useMemo(
    () => ({
      passing: {
        label: "Passing",
        columns: [
          ...baseColumns,
          statCol("comp", "C"),
          statCol("att", "Att"),
          statCol("yds", "Yds"),
          percentCol("compPct", "C%"),
          avgCol("avg", "Avg"),
          statCol("td", "TD"),
          statCol("int", "INT"),
          statCol("lng", "Lng"),
          avgCol("qbr", "QB Rate")
        ],
        minWidth: 980,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const comp = getFirstNumber(stat, ["passingCompletions", "completions"]);
            const att = getFirstNumber(stat, ["passingAttempts", "attempts"]);
            const yds = stat.passing ?? 0;
            const td = getFirstNumber(stat, ["passingTouchdowns", "passingTds"]);
            const ints =
              getFirstNumber(stat, ["passingInterceptions"]) || (stat.interceptions ?? 0);
            const lng = getFirstNumber(stat, ["passingLong", "passingLng"]);

            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              comp,
              att,
              yds,
              compPct: round1(safeDiv(comp, att) * 100),
              avg: round1(safeDiv(yds, att)),
              td,
              int: ints,
              lng,
              qbr: qbRating(comp, att, yds, td, ints)
            };
          })
      },
      rushing: {
        label: "Rushing",
        columns: [
          ...baseColumns,
          statCol("car", "Car"),
          statCol("yds", "Yds"),
          avgCol("avg", "Avg"),
          statCol("lng", "Lng"),
          statCol("hundred", "100+"),
          statCol("td", "TD")
        ],
        minWidth: 720,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const car = getFirstNumber(stat, ["rushingCarries", "rushingAttempts", "carries"]);
            const yds = stat.rushing ?? 0;
            const lng = getFirstNumber(stat, ["rushingLong", "rushingLng"]);
            const td = getFirstNumber(stat, ["rushingTouchdowns", "rushingTds"]);
            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              car,
              yds,
              avg: round1(safeDiv(yds, car)),
              lng,
              hundred: yds >= 100 ? 1 : 0,
              td
            };
          })
      },
      receiving: {
        label: "Receiving",
        columns: [
          ...baseColumns,
          statCol("rec", "Rec"),
          statCol("yds", "Yds"),
          avgCol("avg", "Avg"),
          statCol("lng", "Lng"),
          statCol("td", "TD")
        ],
        minWidth: 640,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const rec = getFirstNumber(stat, ["receptions", "receivingReceptions"]);
            const yds = stat.receiving ?? 0;
            const lng = getFirstNumber(stat, ["receivingLong", "receivingLng"]);
            const td = getFirstNumber(stat, ["receivingTouchdowns", "receivingTds"]);
            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              rec,
              yds,
              avg: round1(safeDiv(yds, rec)),
              lng,
              td
            };
          })
      },
      tackles: {
        label: "Tackles",
        columns: [
          ...baseColumns,
          statCol("solo", "Solo"),
          statCol("asst", "Asst"),
          statCol("total", "Tot Tckls"),
          statCol("tfl", "TFL")
        ],
        minWidth: 560,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const solo = getFirstNumber(stat, ["tacklesSolo", "soloTackles"]);
            const asst = getFirstNumber(stat, ["tacklesAssist", "assistTackles"]);
            const tfl = getFirstNumber(stat, ["tacklesForLoss", "tfl"]);
            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              solo,
              asst,
              total: solo + asst,
              tfl
            };
          })
      },
      defense: {
        label: "Defense",
        columns: [
          ...baseColumns,
          statCol("int", "INT"),
          statCol("intYds", "Int Yds"),
          avgCol("intAvg", "Avg"),
          statCol("pd", "PD"),
          statCol("fr", "Fmb Rec"),
          statCol("frYds", "FR Yds"),
          statCol("caus", "Caus"),
          statCol("blkPnts", "Blk Pnts"),
          statCol("blkFgs", "Blk FGs")
        ],
        minWidth: 980,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const ints = stat.interceptions ?? 0;
            const intYds = getFirstNumber(stat, ["interceptionYards", "intYards"]);
            const pd = getFirstNumber(stat, ["passesDefended", "pd"]);
            const fr = getFirstNumber(stat, ["fumblesRecovered", "fumbleRecoveries"]);
            const frYds = getFirstNumber(stat, ["fumbleReturnYards", "frYards"]);
            const caus = getFirstNumber(stat, ["forcedFumbles", "causedFumbles"]);
            const blkPnts = getFirstNumber(stat, ["blockedPunts", "blockedPunt"]);
            const blkFgs = getFirstNumber(stat, ["blockedFieldGoals", "blockedFg"]);
            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              int: ints,
              intYds,
              intAvg: round1(safeDiv(intYds, ints)),
              pd,
              fr,
              frYds,
              caus,
              blkPnts,
              blkFgs
            };
          })
      },
      special: {
        label: "Special Teams",
        columns: [
          ...baseColumns,
          statCol("ko", "KO"),
          statCol("koYds", "Yds"),
          avgCol("koAvg", "Avg"),
          statCol("koLng", "Lng"),
          statCol("p", "P"),
          statCol("pYds", "Yds"),
          avgCol("pAvg", "Avg"),
          statCol("pLng", "Lng"),
          statCol("in20", "In 20"),
          statCol("kr", "KR"),
          statCol("krYds", "KR Yds"),
          statCol("pr", "PR"),
          statCol("prYds", "PR Yds")
        ],
        minWidth: 1240,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const ko = getFirstNumber(stat, ["kickoffs", "kickoffCount"]);
            const koYds = getFirstNumber(stat, ["kickoffYards"]);
            const koLng = getFirstNumber(stat, ["kickoffLong", "kickoffLng"]);
            const p = getFirstNumber(stat, ["punts", "puntCount"]);
            const pYds = getFirstNumber(stat, ["puntYards"]);
            const pLng = getFirstNumber(stat, ["puntLong", "puntLng"]);
            const in20 = getFirstNumber(stat, ["puntsInside20", "in20"]);
            const kr = getFirstNumber(stat, ["kickReturns", "kickoffReturns"]);
            const krYds = getFirstNumber(stat, ["kickReturnYards"]);
            const pr = getFirstNumber(stat, ["puntReturns"]);
            const prYds = getFirstNumber(stat, ["puntReturnYards"]);
            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              ko,
              koYds,
              koAvg: round1(safeDiv(koYds, ko)),
              koLng,
              p,
              pYds,
              pAvg: round1(safeDiv(pYds, p)),
              pLng,
              in20,
              kr,
              krYds,
              pr,
              prYds
            };
          })
      },
      points: {
        label: "Points",
        columns: [
          ...baseColumns,
          statCol("tds", "TDs"),
          statCol("tdPts", "TD Pts"),
          statCol("conv", "Conv"),
          statCol("s", "S"),
          statCol("kickPts", "Kick Pts"),
          statCol("totPts", "Tot Pts")
        ],
        minWidth: 700,
        buildRows: () =>
          stats.map((stat) => {
            const player = playersById.get(stat.playerId);
            const tds = stat.tds ?? 0;
            const tdPts = tds * 6;
            const conv = getFirstNumber(stat, ["conversions"]);
            const s = getFirstNumber(stat, ["safeties"]);
            const kickPts = getFirstNumber(stat, ["kickPoints", "kickingPoints"]);
            return {
              id: stat._id,
              number: player?.number ?? "",
              athlete: player?.name ?? stat.playerId,
              tds,
              tdPts,
              conv,
              s,
              kickPts,
              totPts: tdPts + conv + s + kickPts
            };
          })
      }
    }),
    [playersById, stats]
  );

  const activeCategory = categories[activeTab];

  useEffect(() => {
    let isMounted = true;
    const loadGames = async () => {
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
      }
    };

    void loadGames();
    return () => {
      isMounted = false;
    };
  }, [getToken]);

  useEffect(() => {
    let isMounted = true;
    const loadStats = async () => {
      if (!selectedGameId) {
        setStats([]);
        return;
      }

      setLoading(true);
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("Missing session token");
        }
        const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
        const response = await fetch(
          `${apiBase}/api/stats/player-game?gameId=${selectedGameId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load player stats");
        }
        const data = (await response.json()) as PlayerGameStat[];
        if (isMounted) {
          setStats(data);
        }
      } catch (err) {
        if (isMounted) {
          const message = err instanceof Error ? err.message : "Failed to load player stats";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadStats();
    return () => {
      isMounted = false;
    };
  }, [getToken, selectedGameId]);

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Player stats by game
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select a tracked game to review stat totals. Roster lives in Roster & Schedule.
            </Typography>
          </Box>
          <FormControl fullWidth size="small">
            <InputLabel id="players-game-select">Game</InputLabel>
            <Select
              labelId="players-game-select"
              label="Game"
              value={selectedGameId}
              onChange={(event) => setSelectedGameId(event.target.value)}
            >
              {games.map((game) => (
                <MenuItem key={game._id} value={game._id}>
                  {game.homeTeam} vs {game.awayTeam} ·
                  {new Date(game.gameDate).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      <Paper elevation={1} sx={{ p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_event, value) => setActiveTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ mb: 2 }}
        >
          {(
            [
              "passing",
              "rushing",
              "receiving",
              "tackles",
              "defense",
              "special",
              "points"
            ] as const
          ).map((key) => (
            <Tab key={key} value={key} label={categories[key].label} />
          ))}
        </Tabs>
        <Box sx={{ width: "100%", overflowX: "auto", height: 460 }}>
          <DataGrid
            rows={activeCategory.buildRows()}
            columns={activeCategory.columns}
            loading={loading}
            hideFooter
            disableRowSelectionOnClick
            density={isSmall ? "compact" : "standard"}
            slots={{
              noRowsOverlay: () => (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No stats yet for this game.
                </Typography>
              )
            }}
            sx={{
              border: 0,
              width: "100%",
              minWidth: activeCategory.minWidth
            }}
          />
        </Box>
      </Paper>
    </Stack>
  );
}
