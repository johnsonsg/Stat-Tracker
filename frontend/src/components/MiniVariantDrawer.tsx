import { useState, type ReactNode } from "react";
import {
  AppBar as MuiAppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer as MuiDrawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import { styled, useTheme, type Theme } from "@mui/material/styles";
import { OrganizationSwitcher, useOrganizationList } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import type { TeamProfile } from "@/types/Team";

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
};

export default function MiniVariantDrawer({ children, team }: MiniVariantDrawerProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  const { userMemberships, isLoaded } = useOrganizationList();
  const displaySchool = team?.schoolName?.trim() || "Stat Tracker";
  const displayMascot = team?.mascotName?.trim() || "";
  const teamInitial = displaySchool.slice(0, 1).toUpperCase();
  const showOrgSwitcher = isLoaded && (userMemberships?.data?.length ?? 0) > 1;

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
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
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
          {[
            { label: "Dashboard", icon: <LayoutDashboard size={20} />, to: "/" },
            { label: "Game Tracker", icon: <Gamepad2 size={20} />, to: "/" },
            { label: "Players", icon: <Users size={20} />, to: "/" },
          ].map((item) => (
            <ListItemButton
              key={item.label}
              component={Link}
              to={item.to}
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
