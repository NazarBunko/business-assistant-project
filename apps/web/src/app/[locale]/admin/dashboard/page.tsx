"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  AppBar,
  Toolbar,
  Box,
  CircularProgress,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Shield,
  Users,
  Building2,
  MessageSquare,
  LogOut,
  UserCheck,
  AlertCircle,
  LayoutDashboard,
  Globe,
  Menu,
} from "lucide-react";
import { API_URL } from "../../../../config/api";
import { useSnackbar } from "notistack";
import Link from "next/link";

interface Stats {
  totalCompanies: number;
  totalUsers: number;
  totalActiveUsers: number;
  totalBlockedUsers: number;
  totalTransactions: number;
  openTickets: number;
  companiesThisMonth: number;
  usersThisMonth: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleLanguage = () => {
    const nextLocale = locale === "uk" ? "en" : "uk";
    const newPath = pathname.replace(`/${locale}/`, `/${nextLocale}/`);
    router.push(newPath);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/dashboard/stats`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        enqueueSnackbar("Failed to load statistics", { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Network error", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push(`/${locale}/admin/login`);
  };

  const navItems = [
    { label: "Dashboard", href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { label: "Users", href: `/${locale}/admin/users`, icon: Users },
    { label: "Support", href: `/${locale}/admin/support`, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        className="bg-white border-b border-gray-200 z-50"
      >
        <Container maxWidth="xl">
          {/* Mobile header */}
          <Toolbar
            disableGutters
            className="items-center justify-between h-14 px-2"
            sx={{ display: { xs: "flex", md: "none" }, minHeight: 56 }}
          >
            <IconButton
              onClick={() => setDrawerOpen(true)}
              size="small"
              aria-label="Open menu"
            >
              <Menu size={24} />
            </IconButton>

            <Link
              href={`/${locale}/admin/dashboard`}
              className="no-underline flex items-center gap-2 group min-w-0"
            >
              <div className="h-8 w-8 bg-black text-white rounded-lg flex items-center justify-center shadow-md group-hover:bg-gray-800 transition-colors flex-shrink-0">
                <Shield size={18} />
              </div>
              <Typography className="font-bold text-black leading-none text-sm truncate">
                Admin Panel
              </Typography>
            </Link>

            <div className="w-10 flex-shrink-0" aria-hidden />
          </Toolbar>

          {/* Desktop header — original layout */}
          <Toolbar
            disableGutters
            className="items-center justify-between h-16"
            sx={{ display: { xs: "none", md: "flex" }, minHeight: 64 }}
          >
            <div className="flex-1 flex justify-start">
              <Link
                href={`/${locale}/admin/dashboard`}
                className="no-underline flex items-center gap-2 group"
              >
                <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center shadow-md group-hover:bg-gray-800 transition-colors">
                  <Shield size={20} />
                </div>
                <Typography className="font-bold text-black leading-none hidden sm:block">
                  Admin Panel
                </Typography>
              </Link>
            </div>

            <div className="flex items-center gap-1 md:gap-2 bg-gray-100/50 p-1.5 rounded-full border border-gray-100">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    variant={isActive ? "contained" : "text"}
                    className={`
                      rounded-full px-4 py-2 text-sm font-medium transition-all min-w-0
                      ${isActive ? "bg-black text-white shadow-md hover:bg-gray-800" : "hover:bg-gray-200/50 text-gray-600"}
                    `}
                    startIcon={<Icon size={18} />}
                  >
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            <div className="flex-1 flex justify-end items-center gap-3">
              <Button
                onClick={toggleLanguage}
                color="inherit"
                variant="text"
                startIcon={<Globe size={18} />}
                className="font-medium hover:bg-gray-100 rounded-lg min-w-0 px-3"
              >
                {locale.toUpperCase()}
              </Button>

              <Button
                onClick={handleLogout}
                color="error"
                variant="text"
                className="font-medium hover:bg-red-50 rounded-lg min-w-0 px-3"
              >
                <LogOut size={18} className="sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        className="md:hidden"
      >
        <div className="w-64 p-4">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b">
            <div className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center shadow-md">
              <Shield size={24} />
            </div>
            <Typography className="font-bold text-black text-base">
              Admin Panel
            </Typography>
          </div>

          <List className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <ListItem
                  key={item.href}
                  component={Link}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`rounded-xl transition-all ${
                    isActive
                      ? "bg-black text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  sx={{ mb: 1 }}
                >
                  <ListItemIcon className={isActive ? "text-white" : "text-gray-600"}>
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              );
            })}
          </List>

          <Divider className="my-4" />

          <List>
            <ListItemButton
              onClick={() => {
                toggleLanguage();
                setDrawerOpen(false);
              }}
              className="rounded-xl hover:bg-gray-100"
            >
              <ListItemIcon className="text-gray-600">
                <Globe size={20} />
              </ListItemIcon>
              <ListItemText primary={`Language: ${locale.toUpperCase()}`} />
            </ListItemButton>

            <ListItemButton
              onClick={() => {
                handleLogout();
                setDrawerOpen(false);
              }}
              className="rounded-xl hover:bg-red-50 text-red-600"
            >
              <ListItemIcon className="text-red-600">
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItemButton>
          </List>
        </div>
      </Drawer>

      <main className="p-3 sm:p-4 md:p-6">
        <Container maxWidth="xl">
          <div className="mb-6 sm:mb-7 md:mb-8">
            <Typography className="font-bold text-gray-900 mb-2 sm:mb-3 text-2xl sm:text-3xl md:text-4xl">
              Dashboard
            </Typography>
            <Typography className="text-gray-500 text-sm sm:text-base">
              Monitor your platform's key metrics and performance
            </Typography>
          </div>

          {loading ? (
            <Box className="flex justify-center items-center h-48 sm:h-56 md:h-64">
              <CircularProgress className="text-gray-900" />
            </Box>
          ) : stats ? (
            <>
              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }} className="mb-6 sm:mb-7 md:mb-8">
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Paper className="p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
                    <Box className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                      <Box className="flex-1 min-w-0">
                        <Typography className="text-gray-500 mb-1 sm:mb-2 text-xs sm:text-sm">
                          Total Companies
                        </Typography>
                        <Typography className="font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl">
                          {stats.totalCompanies}
                        </Typography>
                      </Box>
                      <div className="bg-blue-50 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                        <Building2 size={24} className="text-blue-600 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                    </Box>
                    <Typography className="text-green-600 font-medium text-xs sm:text-sm">
                      +{stats.companiesThisMonth} this month
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Paper className="p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
                    <Box className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                      <Box className="flex-1 min-w-0">
                        <Typography className="text-gray-500 mb-1 sm:mb-2 text-xs sm:text-sm">
                          Total Users
                        </Typography>
                        <Typography className="font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl">
                          {stats.totalUsers}
                        </Typography>
                      </Box>
                      <div className="bg-green-50 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                        <Users size={24} className="text-green-600 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                    </Box>
                    <Typography className="text-green-600 font-medium text-xs sm:text-sm">
                      +{stats.usersThisMonth} this month
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Paper className="p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
                    <Box className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                      <Box className="flex-1 min-w-0">
                        <Typography className="text-gray-500 mb-1 sm:mb-2 text-xs sm:text-sm">
                          Active Users
                        </Typography>
                        <Typography className="font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl">
                          {stats.totalActiveUsers}
                        </Typography>
                      </Box>
                      <div className="bg-emerald-50 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                        <UserCheck size={24} className="text-emerald-600 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                    </Box>
                    <Typography className="text-gray-500 font-medium text-xs sm:text-sm">
                      {stats.totalBlockedUsers} blocked
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Paper className="p-4 sm:p-5 md:p-7 rounded-xl sm:rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
                    <Box className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
                      <Box className="flex-1 min-w-0">
                        <Typography className="text-gray-500 mb-1 sm:mb-2 text-xs sm:text-sm">
                          Open Tickets
                        </Typography>
                        <Typography className="font-bold text-gray-900 text-2xl sm:text-3xl md:text-4xl">
                          {stats.openTickets}
                        </Typography>
                      </Box>
                      <div className="bg-orange-50 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
                        <AlertCircle size={24} className="text-orange-600 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                      </div>
                    </Box>
                    <Typography className="text-orange-600 font-medium text-xs sm:text-sm">
                      Requires attention
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Paper className="p-4 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl border border-gray-200">
                    <Typography className="font-bold text-gray-900 mb-4 sm:mb-5 md:mb-6 text-lg sm:text-xl">
                      Platform Activity
                    </Typography>
                    <div className="space-y-3 sm:space-y-4">
                      <Box className="flex justify-between items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 bg-gray-50 rounded-lg sm:rounded-xl">
                        <Typography className="text-gray-700 font-medium text-sm sm:text-base">
                          Total Transactions
                        </Typography>
                        <Typography className="font-bold text-gray-900 tabular-nums shrink-0 text-base sm:text-lg md:text-xl">
                          {stats.totalTransactions.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box className="flex justify-between items-center gap-4 sm:gap-6 p-3 sm:p-4 md:p-5 bg-gray-50 rounded-lg sm:rounded-xl">
                        <Typography className="text-gray-700 font-medium text-sm sm:text-base">
                          Avg Users per Company
                        </Typography>
                        <Typography className="font-bold text-gray-900 tabular-nums shrink-0 text-base sm:text-lg md:text-xl">
                          {stats.totalCompanies > 0
                            ? (stats.totalUsers / stats.totalCompanies).toFixed(1)
                            : "0"}
                        </Typography>
                      </Box>
                      <Box className="flex justify-between items-center gap-3 sm:gap-4 p-3 sm:p-4 md:p-5 bg-green-50 rounded-lg sm:rounded-xl">
                        <Typography className="text-gray-700 font-medium text-sm sm:text-base">
                          Active Rate
                        </Typography>
                        <Typography className="font-bold text-green-600 tabular-nums shrink-0 text-base sm:text-lg md:text-xl">
                          {stats.totalUsers > 0
                            ? ((stats.totalActiveUsers / stats.totalUsers) * 100).toFixed(1)
                            : "0"}%
                        </Typography>
                      </Box>
                    </div>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Paper className="p-4 sm:p-5 md:p-8 rounded-xl sm:rounded-2xl border border-gray-200">
                    <Typography className="font-bold text-gray-900 mb-6 sm:mb-7 md:mb-8 text-lg sm:text-xl">
                      Quick Actions
                    </Typography>
                    <div className="flex flex-col gap-3 sm:gap-4 mt-2">
                      <Button
                        fullWidth
                        component={Link}
                        href={`/${locale}/admin/users`}
                        variant="outlined"
                        startIcon={<Users size={18} className="sm:w-5 sm:h-5" />}
                        className="justify-start border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-black rounded-lg sm:rounded-xl normal-case py-3 sm:py-4 text-sm sm:text-base font-medium"
                      >
                        Manage Users
                      </Button>
                      <Button
                        fullWidth
                        component={Link}
                        href={`/${locale}/admin/support`}
                        variant="outlined"
                        startIcon={<MessageSquare size={18} className="sm:w-5 sm:h-5" />}
                        className="justify-start border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-black rounded-lg sm:rounded-xl normal-case py-3 sm:py-4 text-sm sm:text-base font-medium"
                      >
                        View Support Tickets
                      </Button>
                    </div>
                  </Paper>
                </Grid>
              </Grid>
            </>
          ) : (
            <Typography variant="body1" className="text-center text-gray-600 py-10">
              Failed to load statistics
            </Typography>
          )}
        </Container>
      </main>
    </div>
  );
}
