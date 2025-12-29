"use client";

import { useTranslations, useLocale } from "next-intl";
import { AppBar, Toolbar, Button, Container, Typography } from "@mui/material";
import { Link, usePathname, useRouter } from "../../../i18n/routing";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  UserCircle,
  LogOut,
  Globe,
} from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Navigation");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: t("dashboard"), href: "/dashboard", icon: LayoutDashboard },
    { label: t("employees"), href: "/employees", icon: Users },
    { label: t("chat"), href: "/chat", icon: MessageSquare },
    { label: t("profile"), href: "/profile", icon: UserCircle },
  ];

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3001/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Помилка при виході:", error);
    } finally {
      localStorage.removeItem("user");

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
          <Toolbar
            disableGutters
            className="flex items-center justify-between h-16"
          >
            <div className="flex-1 flex justify-start">
              <Link
                href="/dashboard"
                className="no-underline flex items-center gap-2 group"
              >
                <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md group-hover:bg-primary transition-colors">
                  BA
                </div>
                <Typography className="font-bold text-black leading-none hidden sm:block">
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
                className="min-w-[60px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors hidden sm:flex"
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
                <span className="hidden sm:inline">{t("logout")}</span>
              </Button>
            </div>
          </Toolbar>
        </Container>
      </AppBar>

      <main className="p-6">
        <Container maxWidth="xl">{children}</Container>
      </main>
    </div>
  );
}
