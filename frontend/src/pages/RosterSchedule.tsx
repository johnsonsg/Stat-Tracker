import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useTeamData } from "@/state/useTeamData";
import type { TeamPlayer } from "@/types/teamData";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { usePlayerFlags } from "@/state/playerFlags";
import { getSessionStorage } from "@/state/storage";

export default function RosterSchedule() {
  const groupTabStorageKey = "stat-tracker:roster-position-group";
  const groupTabStorage = useMemo(() => getSessionStorage(), []);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { teamData, loading, error } = useTeamData();
  const { flags, setFlag } = usePlayerFlags();
  const [groupTab, setGroupTab] = useState(() => {
    const stored = groupTabStorage.getItem(groupTabStorageKey);
    if (stored === "offense" || stored === "defense" || stored === "special" || stored === "all") {
      return stored;
    }
    return "all";
  });

  const players = useMemo(() => teamData?.players ?? [], [teamData]);
  const schedule = useMemo(() => teamData?.schedule ?? [], [teamData]);

  const normalizeGroup = useCallback((value: string) => value.trim().toLowerCase(), []);

  const matchesGroupValue = useCallback((player: TeamPlayer, tab: string) => {
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
  }, [normalizeGroup]);

  const filteredPlayers = useMemo(
    () => players.filter((player) => matchesGroupValue(player, groupTab)),
    [groupTab, matchesGroupValue, players]
  );

  const groupCounts = useMemo(() => {
    return {
      all: players.length,
      offense: players.filter((player) => matchesGroupValue(player, "offense")).length,
      defense: players.filter((player) => matchesGroupValue(player, "defense")).length,
      special: players.filter((player) => matchesGroupValue(player, "special")).length
    };
  }, [matchesGroupValue, players]);

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

  const renderFlag = (playerId: string, key: "primary" | "secondary" | "starter") => (
    <Checkbox
      size="small"
      checked={Boolean(flags[playerId]?.[key])}
      onChange={(event) => setFlag(playerId, key, event.target.checked)}
    />
  );

  useEffect(() => {
    groupTabStorage.setItem(groupTabStorageKey, groupTab);
  }, [groupTab, groupTabStorage]);

  if (loading || !teamData) {
    return (
      <Stack spacing={2} alignItems="center" sx={{ py: 6 }}>
        {error && <Alert severity="error">{error}</Alert>}
        <CircularProgress />
      </Stack>
    );
  }

  const rosterColumns: GridColDef[] = [
    {
      field: "primary",
      headerName: "Primary",
      width: 100,
      minWidth: 100,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => renderFlag(params.row.id, "primary")
    },
    {
      field: "secondary",
      headerName: "Secondary",
      width: 110,
      minWidth: 110,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => renderFlag(params.row.id, "secondary")
    },
    {
      field: "starter",
      headerName: "Starter",
      width: 100,
      minWidth: 100,
      align: "center",
      headerAlign: "center",
      sortable: false,
      renderCell: (params) => renderFlag(params.row.id, "starter")
    },
    { field: "number", headerName: "#", width: 90, minWidth: 90 },
    { field: "name", headerName: "Name", width: 240, minWidth: 240 },
    { field: "position", headerName: "Position", width: 140, minWidth: 140 }
  ];

  const scheduleColumns: GridColDef[] = [
    { field: "opponent", headerName: "Opponent", width: 220, minWidth: 220 },
    { field: "dateTime", headerName: "Date", width: 220, minWidth: 220 },
    { field: "location", headerName: "Location", width: 160, minWidth: 160 }
  ];

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Roster
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {players.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No players yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            <Tabs
              value={groupTab}
              onChange={(_, value) => setGroupTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab value="all" label={renderTabLabel("All", groupCounts.all)} />
              <Tab value="offense" label={renderTabLabel("Offense", groupCounts.offense)} />
              <Tab value="defense" label={renderTabLabel("Defense", groupCounts.defense)} />
              <Tab value="special" label={renderTabLabel("Special Teams", groupCounts.special)} />
            </Tabs>
            {filteredPlayers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No players in this group.
              </Typography>
            ) : (
              <Box sx={{ width: "100%", overflowX: "auto", height: 320 }}>
                <DataGrid
                  rows={filteredPlayers.map((player) => ({
                    id: player.id,
                    number: player.number,
                    name: player.name,
                    position: player.position
                  }))}
                  columns={rosterColumns}
                  hideFooter
                  disableRowSelectionOnClick
                  density={isSmall ? "compact" : "standard"}
                  sx={{ border: 0, width: "100%", minWidth: 470 }}
                />
              </Box>
            )}
          </Stack>
        )}
      </Paper>

      <Paper elevation={1} sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" gutterBottom>
            Schedule
          </Typography>
          <Chip size="small" label={`${schedule.length} games`} />
        </Box>
        <Divider sx={{ mb: 2 }} />
        {schedule.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No games on the schedule yet.
          </Typography>
        ) : (
          <Box sx={{ width: "100%", overflowX: "auto", height: 360 }}>
            <DataGrid
              rows={schedule.map((game) => ({
                id: game.id,
                opponent: game.opponent,
                dateTime: new Date(game.dateTime).toLocaleString(),
                location: game.location
              }))}
              columns={scheduleColumns}
              hideFooter
              disableRowSelectionOnClick
              density={isSmall ? "compact" : "standard"}
              sx={{ border: 0, width: "100%", minWidth: 600 }}
            />
          </Box>
        )}
      </Paper>
    </Stack>
  );
}
