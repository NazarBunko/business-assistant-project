"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  AppBar,
  Toolbar,
  Button,
  Container,
  Typography,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { Link, usePathname, useRouter } from "../../../i18n/routing";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCircle,
  LogOut,
  Globe,
  Menu,
} from "lucide-react";
import { API_URL } from "../../../config/api";
import { apiFetch } from "../../../lib/api-fetch";
import { clearAuthSession } from "../../../lib/auth-token";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("employees"), href: "/employees", icon: Users },
    { label: t("chat"), href: "/chat", icon: MessageSquare },
    { label: t("profile"), href: "/profile", icon: UserCircle },
  ];

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (error) {
      console.error("Помилка при виході:", error);
    } finally {
      clearAuthSession();
      router.replace("/");
      router.refresh();
    }
  };

  const toggleLanguage = () => {
    const nextLocale = locale === "uk" ? "en" : "uk";
    router.replace(pathname, { locale: nextLocale });
  };

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
              href="/dashboard"
              className="no-underline flex items-center gap-2 group min-w-0"
            >
              <div className="h-8 w-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-base shadow-md group-hover:bg-primary transition-colors flex-shrink-0">
                BA
              </div>
              <Typography className="font-bold text-black leading-none text-sm truncate">
                Business Assistant
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
                href="/dashboard"
                className="no-underline flex items-center gap-2 group"
              >
                <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-primary transition-colors">
                  BA
                </div>
                <Typography className="font-bold text-black leading-none">
                  Business Assistant
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
                    color={isActive ? "primary" : "inherit"}
                    className={`
                      rounded-full px-4 py-2 text-sm font-medium transition-all min-w-0
                      ${isActive ? "shadow-md" : "hover:bg-gray-200/50 text-gray-600"}
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
                startIcon={<Globe size={18} />}
                className="min-w-[60px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {locale.toUpperCase()}
              </Button>

              <Button
                onClick={handleLogout}
                color="error"
                variant="text"
                className="font-medium hover:bg-red-50 rounded-lg min-w-0 px-3"
              >
                <LogOut size={18} className="mr-2" />
                {t("logout")}
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
            <div className="h-10 w-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
              BA
            </div>
            <Typography className="font-bold text-black text-base">
              Business Assistant
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
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
                  sx={{ mb: 1 }}
                >
                  <ListItemIcon
                    className={isActive ? "text-white" : "text-gray-600"}
                    sx={{ minWidth: 40 }}
                  >
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItem>
              );
            })}
          </List>

          <Divider className="my-4" />

          <List>
            <ListItem
              onClick={() => {
                toggleLanguage();
                setDrawerOpen(false);
              }}
              className="rounded-xl hover:bg-gray-100 cursor-pointer"
            >
              <ListItemIcon className="text-gray-600" sx={{ minWidth: 40 }}>
                <Globe size={20} />
              </ListItemIcon>
              <ListItemText primary={`${t("language")}: ${locale.toUpperCase()}`} />
            </ListItem>

            <ListItem
              onClick={() => {
                handleLogout();
                setDrawerOpen(false);
              }}
              className="rounded-xl hover:bg-red-50 text-red-600 cursor-pointer"
            >
              <ListItemIcon className="text-red-600" sx={{ minWidth: 40 }}>
                <LogOut size={20} />
              </ListItemIcon>
              <ListItemText primary={t("logout")} />
            </ListItem>
          </List>
        </div>
      </Drawer>

      <main className="p-3 sm:p-4 md:p-6">
        <Container maxWidth="xl">{children}</Container>
      </main>
    </div>
  );
}
