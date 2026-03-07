import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AppBar as MuiAppBar,
  Box,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled, useTheme, type Theme } from "@mui/material/styles";
import {
  OrganizationSwitcher,
  useAuth,
  useOrganization,
  useOrganizationList
} from "@clerk/clerk-react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  LayoutDashboard,
  Menu,
  RefreshCw,
  Settings,
  User2,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { TeamProfile } from "@/types/Team";
import { socket } from "@/services/socket";

const drawerWidth = 260;

const openedMixin = (theme: Theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden" as const,
});

const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden" as const,
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(0, 2.5),
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open?: boolean }>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== "open" })<{
  open?: boolean;
}>(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

type MiniVariantDrawerProps = {
  children: ReactNode;
  team?: TeamProfile;
  teamName?: string | null;
};

export default function MiniVariantDrawer({ children, team, teamName }: MiniVariantDrawerProps) {
  const theme = useTheme();
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const { userMemberships, isLoaded } = useOrganizationList();
  const fallbackOrgName =
    organization?.name?.trim() ||
    userMemberships?.data?.[0]?.organization?.name?.trim() ||
    null;
  const displaySchool =
    teamName?.trim() ||
    fallbackOrgName ||
    team?.schoolName?.trim() ||
    "4th and 1 Stat Tracker";
  const displayMascot = team?.mascotName?.trim() || "";
  const teamInitial = displaySchool.slice(0, 1).toUpperCase();
  const showOrgSwitcher = isLoaded && (userMemberships?.data?.length ?? 0) > 1;
  const appBarSubtitle = teamName?.trim() || null;
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [teamDebug, setTeamDebug] = useState<{
    hasTenantSettings: boolean;
    playersCount: number;
    scheduleCount: number;
    teamName: string | null;
  } | null>(null);
  const [teamDebugLoading, setTeamDebugLoading] = useState(false);
  const [teamDebugCheckedAt, setTeamDebugCheckedAt] = useState<Date | null>(null);
  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  const loadTeamDebug = useCallback(async () => {
    try {
      setTeamDebugLoading(true);
      const token = await getToken();
      if (!token) {
        return;
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/team-data/debug`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as {
        hasTenantSettings: boolean;
        playersCount: number;
        scheduleCount: number;
        teamName: string | null;
      };
      setTeamDebug(data);
      setTeamDebugCheckedAt(new Date());
    } catch {
      setTeamDebug(null);
    } finally {
      setTeamDebugLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void loadTeamDebug();
  }, [loadTeamDebug]);


  const navItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={20} />, to: "/dashboard" },
    { label: "Game Tracker", icon: <Gamepad2 size={20} />, to: "/games" },
    { label: "Roster & Schedule", icon: <Users size={20} />, to: "/roster" },
    { label: "Team Management", icon: <Settings size={20} />, to: "/team" },
    { label: "Player Stats", icon: <Users size={20} />, to: "/players" },
    { label: "Profile", icon: <User2 size={20} />, to: "/profile" }
  ];

  const getTitle = (pathname: string) => {
    if (pathname.startsWith("/games")) {
      return "Game Tracker";
    }
    if (pathname.startsWith("/players")) {
      return "Player Stats";
    }
    if (pathname.startsWith("/roster")) {
      return "Roster & Schedule";
    }
    if (pathname.startsWith("/team")) {
      return "Team Management";
    }
    if (pathname.startsWith("/profile")) {
      return "Profile";
    }
    if (pathname.startsWith("/organization")) {
      return "Organization";
    }
    return "Dashboard";
  };

  const currentTitle = getTitle(location.pathname);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" color="default" open={open} elevation={0}>
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ marginRight: 1, ...(open && { display: "none" }) }}
          >
            <Menu size={20} />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {currentTitle}
            </Typography>
            {appBarSubtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {appBarSubtitle}
              </Typography>
            )}
          </Box>
          {showOrgSwitcher && (
            <OrganizationSwitcher
              hidePersonal
              appearance={{
                elements: {
                  rootBox: { display: "flex" },
                },
              }}
            />
          )}
          <Tooltip title={isConnected ? "Realtime socket connected" : "Realtime socket disconnected"}>
            <Chip
              size="small"
              label={isConnected ? "Connected" : "Offline"}
              color={isConnected ? "success" : "default"}
              variant={isConnected ? "filled" : "outlined"}
            />
          </Tooltip>
          {teamDebug && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip
                title={
                  teamDebug.hasTenantSettings
                    ? `Team data loaded: ${teamDebug.playersCount} players, ${teamDebug.scheduleCount} games`
                    : "No tenant-settings document found for this org"
                }
              >
                <Chip
                  size="small"
                  label={
                    teamDebug.hasTenantSettings
                      ? `Team ${teamDebug.playersCount}P/${teamDebug.scheduleCount}G`
                      : "Team Missing"
                  }
                  color={teamDebug.hasTenantSettings ? "success" : "warning"}
                  variant="outlined"
                />
              </Tooltip>
              <Tooltip
                title={
                  teamDebugCheckedAt
                    ? `Last checked: ${teamDebugCheckedAt.toLocaleTimeString()}`
                    : "Refresh team data status"
                }
              >
                <IconButton size="small" onClick={loadTeamDebug} disabled={teamDebugLoading}>
                  {teamDebugLoading ? <CircularProgress size={14} /> : <RefreshCw size={14} />}
                </IconButton>
              </Tooltip>
            </Box>
          )}
          <ThemeToggle />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flex: 1,
              minWidth: 0,
              opacity: open ? 1 : 0,
              transition: theme.transitions.create("opacity", {
                duration: theme.transitions.duration.shortest,
              }),
            }}
          >
            <Box
              aria-hidden
              sx={{
                display: "inline-flex",
                height: 28,
                width: 28,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.04em",
                flexShrink: 0,
              }}
            >
              {teamInitial}
            </Box>
            <Box sx={{ minWidth: 0, pr: 1 }}>
              <Typography
                variant="subtitle1"
                noWrap
                sx={{ fontWeight: 700, lineHeight: 1.15, fontSize: "1.25rem" }}
              >
                {displaySchool}
              </Typography>
              {displayMascot && (
                <Typography
                  variant="body2"
                  noWrap
                  sx={{
                    display: "block",
                    lineHeight: 1.2,
                    color: "text.secondary",
                    fontSize: "1rem",
                    fontWeight: 500,
                  }}
                >
                  {displayMascot}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton onClick={handleDrawerClose} aria-label="collapse drawer">
            {theme.direction === "rtl" ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.label}
              component={Link}
              to={item.to}
              selected={location.pathname.startsWith(item.to)}
              sx={{
                minHeight: 48,
                px: 2.5,
                justifyContent: open ? "initial" : "center",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : "auto",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} sx={{ opacity: open ? 1 : 0 }} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List>
          <ListItemButton
            component={Link}
            to="/organization"
            sx={{
              minHeight: 48,
              px: 2.5,
              justifyContent: open ? "initial" : "center",
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: open ? 2 : "auto",
                justifyContent: "center",
              }}
            >
              <Settings size={20} />
            </ListItemIcon>
            <ListItemText primary="Organization" sx={{ opacity: open ? 1 : 0 }} />
          </ListItemButton>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
}
