import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { useAuth } from "@clerk/clerk-react";
import { useTeamData } from "@/state/useTeamData";
import type { TeamPlayer, TeamScheduleGame } from "@/types/teamData";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { usePlayerFlags } from "@/state/playerFlags";
import { getSessionStorage } from "@/state/storage";

export default function RosterSchedule() {
  const groupTabStorageKey = "stat-tracker:roster-position-group";
  const groupTabStorage = useMemo(() => getSessionStorage(), []);
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const { teamData, loading, error, refresh } = useTeamData();
  const { getToken } = useAuth();
  const { flags, setFlag } = usePlayerFlags();
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editingScheduleForm, setEditingScheduleForm] = useState({
    opponent: "",
    dateTime: "",
    location: "",
    opponentLogo: ""
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const editLogoInputRef = useRef<HTMLInputElement | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [logoUrlMap, setLogoUrlMap] = useState<Record<string, string>>({});
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

  const teamAppBase = useMemo(
    () => (import.meta.env.VITE_TEAM_APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
    []
  );
  const isObjectId = useCallback((value: string) => /^[a-f\d]{24}$/i.test(value), []);

  const normalizeMediaUrl = useCallback(
    (value?: string | null) => {
      if (!value) {
        return null;
      }
      if (value.startsWith("http") || value.startsWith("data:")) {
        return value;
      }
      if (value.startsWith("//")) {
        return `https:${value}`;
      }
      if (value.startsWith("/")) {
        return `${teamAppBase}${value}`;
      }
      return `${teamAppBase}/${value}`;
    },
    [teamAppBase]
  );

  const resolveLogoSrc = useCallback(
    (value?: string | null) => {
      if (!value) {
        return null;
      }
      if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("//") || value.startsWith("/")) {
        return normalizeMediaUrl(value);
      }
      if (isObjectId(value)) {
        return logoUrlMap[value] ?? null;
      }
      return null;
    },
    [isObjectId, logoUrlMap, normalizeMediaUrl]
  );

  useEffect(() => {
    const preview = resolveLogoSrc(editingScheduleForm.opponentLogo);
    setEditLogoPreview(preview);
  }, [editingScheduleForm.opponentLogo, resolveLogoSrc]);

  const uploadOpponentLogo = useCallback(
    async (file: File, label: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const formData = new FormData();
      formData.append("file", file);
      if (label.trim()) {
        formData.append("alt", label.trim());
      }
      const response = await fetch(`${teamAppBase}/team-admin/api/media`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to upload opponent logo");
      }
      const data = (await response.json()) as { media?: { id?: string } };
      if (!data.media?.id) {
        throw new Error("Upload response missing media id");
      }
      return data.media.id;
    },
    [getToken, teamAppBase]
  );

  const missingLogoIds = useMemo(() => {
    const ids = schedule
      .map((game) => game.opponentLogo ?? "")
      .filter((value) => value && isObjectId(value)) as string[];
    return ids.filter((id) => !logoUrlMap[id]);
  }, [isObjectId, logoUrlMap, schedule]);

  useEffect(() => {
    if (missingLogoIds.length === 0) {
      return;
    }

    let isMounted = true;
    const loadLogos = async () => {
      const results = await Promise.all(
        missingLogoIds.map(async (id) => {
          try {
            const response = await fetch(`${teamAppBase}/api/media/${encodeURIComponent(id)}`);
            if (!response.ok) {
              return null;
            }
            const data = (await response.json()) as {
              url?: string;
              doc?: { url?: string };
              data?: { url?: string };
              media?: { url?: string };
            };
            const rawUrl = data.url ?? data.doc?.url ?? data.data?.url ?? data.media?.url;
            const resolved = normalizeMediaUrl(rawUrl);
            return resolved ? { id, url: resolved } : null;
          } catch {
            return null;
          }
        })
      );

      if (!isMounted) {
        return;
      }

      const next: Record<string, string> = {};
      results.forEach((item) => {
        if (item) {
          next[item.id] = item.url;
        }
      });
      if (Object.keys(next).length > 0) {
        setLogoUrlMap((prev) => ({ ...prev, ...next }));
      }
    };

    void loadLogos();
    return () => {
      isMounted = false;
    };
  }, [missingLogoIds, normalizeMediaUrl, teamAppBase]);

  const startEditSchedule = useCallback((game: TeamScheduleGame) => {
    setScheduleError(null);
    setEditingScheduleId(game.id);
    setEditingScheduleForm({
      opponent: game.opponent,
      dateTime: game.dateTime,
      location: game.location,
      opponentLogo: game.opponentLogo ?? ""
    });
  }, []);

  const closeEditSchedule = useCallback(() => {
    setEditingScheduleId(null);
    setEditingScheduleForm({ opponent: "", dateTime: "", location: "", opponentLogo: "" });
  }, []);

  const saveSchedule = useCallback(async () => {
    if (!editingScheduleId) {
      return;
    }
    setScheduleError(null);
    setIsScheduleSaving(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Missing session token");
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/team/schedule/${editingScheduleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          opponent: editingScheduleForm.opponent.trim(),
          dateTime: editingScheduleForm.dateTime,
          location: editingScheduleForm.location.trim(),
          opponentLogo: editingScheduleForm.opponentLogo.trim() || undefined
        })
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to update schedule game");
      }
      await refresh();
      closeEditSchedule();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update schedule game";
      setScheduleError(message);
    } finally {
      setIsScheduleSaving(false);
    }
  }, [closeEditSchedule, editingScheduleForm, editingScheduleId, getToken, refresh]);

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
    { field: "location", headerName: "Location", width: 160, minWidth: 160 },
    {
      field: "opponentLogo",
      headerName: "Logo",
      width: 110,
      minWidth: 110,
      renderCell: (params) => {
        const src = resolveLogoSrc(params.value as string | null | undefined);
        if (src) {
          return (
            <Box
              component="img"
              src={src}
              alt="Opponent logo"
              sx={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
            />
          );
        }
        return <Typography variant="caption">ID</Typography>;
      }
    },
    {
      field: "actions",
      headerName: "",
      width: 120,
      minWidth: 120,
      sortable: false,
      renderCell: (params) => (
        <Button size="small" onClick={() => startEditSchedule(params.row.raw)}>
          Edit
        </Button>
      )
    }
  ];

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      {scheduleError && <Alert severity="error">{scheduleError}</Alert>}
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
                location: game.location,
                opponentLogo: game.opponentLogo ?? "",
                raw: game
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

      <Dialog open={Boolean(editingScheduleId)} onClose={closeEditSchedule} maxWidth="sm" fullWidth>
        <DialogTitle>Edit schedule game</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Opponent"
              value={editingScheduleForm.opponent}
              onChange={(event) =>
                setEditingScheduleForm((prev) => ({ ...prev, opponent: event.target.value }))
              }
            />
            <input
              ref={editLogoInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) {
                  return;
                }
                setScheduleError(null);
                setIsUploadingLogo(true);
                try {
                  const id = await uploadOpponentLogo(file, editingScheduleForm.opponent);
                  setEditingScheduleForm((prev) => ({ ...prev, opponentLogo: id }));
                } catch (err) {
                  const message = err instanceof Error ? err.message : "Failed to upload logo";
                  setScheduleError(message);
                } finally {
                  setIsUploadingLogo(false);
                  if (editLogoInputRef.current) {
                    editLogoInputRef.current.value = "";
                  }
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={() => editLogoInputRef.current?.click()}
              disabled={isUploadingLogo}
            >
              {isUploadingLogo ? "Uploading..." : "Upload logo"}
            </Button>
            {editLogoPreview && (
              <Box
                component="img"
                src={editLogoPreview}
                alt="Opponent logo preview"
                sx={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }}
              />
            )}
            {editingScheduleForm.opponentLogo && (
              <Button
                size="small"
                onClick={() =>
                  setEditingScheduleForm((prev) => ({ ...prev, opponentLogo: "" }))
                }
              >
                Remove logo
              </Button>
            )}
            <TextField
              label="Date & time"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={editingScheduleForm.dateTime}
              onChange={(event) =>
                setEditingScheduleForm((prev) => ({ ...prev, dateTime: event.target.value }))
              }
            />
            <TextField
              label="Location"
              value={editingScheduleForm.location}
              onChange={(event) =>
                setEditingScheduleForm((prev) => ({ ...prev, location: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditSchedule}>Cancel</Button>
          <Button variant="contained" onClick={saveSchedule} disabled={isScheduleSaving}>
            {isScheduleSaving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
