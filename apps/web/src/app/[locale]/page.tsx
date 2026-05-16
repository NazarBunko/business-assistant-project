"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Button,
  Typography,
  Container,
  Box,
  AppBar,
  Toolbar,
  Paper,
  IconButton,
  Grid,
} from "@mui/material";
import {
  TrendingUp,
  ShieldCheck,
  Users,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Zap,
  Check,
  Globe,
} from "lucide-react";
import { Link, usePathname, useRouter } from "../../i18n/routing";

function Header() {
  const t = useTranslations("HomePage.header");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === "uk" ? "en" : "uk";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <AppBar
      position="sticky"
      color="default"
      elevation={0}
      className="bg-white/80 backdrop-blur-md border-b border-gray-100"
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters className="justify-between py-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 sm:h-9 sm:w-9 bg-black text-white rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-md">
              BA
            </div>
            <Typography
              variant="h6"
              component="div"
              className="font-bold text-black leading-none whitespace-nowrap text-sm sm:text-base md:text-lg"
            >
              {t("title")}
            </Typography>
          </div>

          <div className="flex items-center gap-2">
            <Button
              component={Link}
              href="/login"
              variant="text"
              color="inherit"
              className="font-medium hover:bg-gray-100 rounded-lg hidden sm:flex text-sm"
            >
              {t("login")}
            </Button>

            <Button
              component={Link}
              href="/register"
              variant="contained"
              color="primary"
              className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              {t("register")}
            </Button>

            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

            <Button
              onClick={toggleLanguage}
              color="inherit"
              startIcon={<Globe size={16} className="sm:w-[18px] sm:h-[18px]" />}
              className="min-w-[60px] sm:min-w-[80px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors px-2 sm:px-3 text-xs sm:text-sm"
            >
              {locale.toUpperCase()}
            </Button>
          </div>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

function HeroSection() {
  const t = useTranslations("HomePage.hero");

  return (
    <Box className="py-12 sm:py-16 md:py-20 lg:py-32 bg-linear-to-b from-gray-50 to-white overflow-hidden relative">
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 4, sm: 5, md: 6 }} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }} className="text-center md:text-left">
            <Typography
              component="h1"
              className="font-extrabold text-gray-900 mb-4 sm:mb-6 leading-tight"
              sx={{
                fontSize: {
                  xs: "1.875rem",
                  sm: "2.25rem",
                  md: "3rem",
                  lg: "3.75rem",
                },
              }}
            >
              {t("title_part1")} <br />
              <span className="text-primary">{t("title_part2")}</span>
            </Typography>
            <Typography
              color="text.secondary"
              className="mb-6 sm:mb-8 font-normal leading-relaxed"
              sx={{ fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" } }}
            >
              {t("subtitle")}
            </Typography>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start mt-3">
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />}
                className="py-2.5 sm:py-3 px-6 sm:px-8 text-base sm:text-lg rounded-full"
              >
                {t("startBtn")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                className="py-2.5 sm:py-3 px-6 sm:px-8 text-base sm:text-lg rounded-full"
              >
                {t("learnMoreBtn")}
              </Button>
            </div>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center md:justify-start text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                {t("badgeFree")}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                {t("badgeNoCard")}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <div className="relative w-full h-[280px] sm:h-[320px] md:h-[380px] flex items-center justify-center perspective-[1000px]">
              {/* Animated glow backgrounds */}
              <div className="absolute -top-10 -right-10 w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

              {/* 3D Rotating Icon */}
              <div
                className="relative preserve-3d"
                style={{
                  animation: "rotate3d 12s linear infinite",
                  transformStyle: "preserve-3d",
                }}
              >
                {/* Main Icon */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl shadow-2xl">
                  <BarChart3 size={60} className="text-white sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-[100px] lg:h-[100px]" strokeWidth={1.5} />
                </div>
              </div>

              <style jsx>{`
                @keyframes rotate3d {
                  0% {
                    transform: rotateY(0deg) rotateX(10deg);
                  }
                  50% {
                    transform: rotateY(180deg) rotateX(-10deg);
                  }
                  100% {
                    transform: rotateY(360deg) rotateX(10deg);
                  }
                }

                @keyframes blob {
                  0%,
                  100% {
                    transform: translate(0px, 0px) scale(1);
                  }
                  33% {
                    transform: translate(30px, -50px) scale(1.1);
                  }
                  66% {
                    transform: translate(-20px, 20px) scale(0.9);
                  }
                }

                .animate-blob {
                  animation: blob 7s infinite;
                }

                .animation-delay-2000 {
                  animation-delay: 2s;
                }

                .perspective-1000px {
                  perspective: 1000px;
                }

                .preserve-3d {
                  transform-style: preserve-3d;
                }
              `}</style>
            </div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

type FeatureItem = string;

function Rotating3DIcon({ Icon, color, badge }: { Icon: any; color: string; badge?: { icon: any; bgColor: string; label: string; value: string } }) {
  return (
    <div className="relative w-full h-[320px] sm:h-[380px] md:h-[450px] flex items-center justify-center perspective-[1000px]">
      {/* Animated glow background */}
      <div
        className={`absolute inset-0 ${color} opacity-10 rounded-full blur-3xl animate-pulse`}
        style={{ animationDuration: "3s" }}
      ></div>

      {/* 3D Rotating Icon Container */}
      <div
        className="relative preserve-3d"
        style={{
          animation: "rotate3d 12s linear infinite",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Main Icon */}
        <div className={`${color} p-8 sm:p-10 md:p-12 rounded-2xl sm:rounded-3xl shadow-2xl`}>
          <Icon size={80} className="text-white sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-[120px] lg:h-[120px]" strokeWidth={1.5} />
        </div>
      </div>

      {/* Stat badge - only show if badge prop is provided */}
      {badge && (
        <Paper
          elevation={8}
          className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 md:bottom-10 md:right-10 p-3 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl flex items-center gap-2 sm:gap-3 md:gap-4 bg-white/95 backdrop-blur shadow-2xl border border-gray-100"
          style={{
            animation: "bounce 3s ease-in-out infinite",
          }}
        >
          <div className={`${badge.bgColor} p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl`}>
            <badge.icon size={18} className="text-white sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <Typography
              variant="caption"
              display="block"
              className="text-gray-500 font-semibold uppercase tracking-wide text-[8px] sm:text-[9px] md:text-[10px]"
            >
              {badge.label}
            </Typography>
            <Typography
              className="font-bold text-gray-900 leading-none text-sm sm:text-base md:text-lg"
            >
              {badge.value}
            </Typography>
          </div>
        </Paper>
      )}

      <style jsx>{`
        @keyframes rotate3d {
          0% {
            transform: rotateY(0deg) rotateX(10deg);
          }
          50% {
            transform: rotateY(180deg) rotateX(-10deg);
          }
          100% {
            transform: rotateY(360deg) rotateX(10deg);
          }
        }

        .perspective-1000px {
          perspective: 1000px;
        }

        .preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}

function FeatureSection({
  reversed,
  title,
  text,
  icon: Icon,
  color,
  items,
  badge,
}: {
  reversed?: boolean;
  title: string;
  text: string;
  icon: any;
  color: string;
  items: FeatureItem[];
  badge?: { icon: any; bgColor: string; label: string; value: string };
}) {
  return (
    <Box className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, sm: 5, md: 6, lg: 8 }}
          alignItems="center"
          direction={reversed ? "row-reverse" : "row"}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <div className="flex flex-col gap-4 sm:gap-5 md:gap-6">
              <div
                className={`h-12 w-12 sm:h-13 sm:w-13 md:h-14 md:w-14 rounded-xl sm:rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}
              >
                <Icon size={24} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
              </div>

              <Typography
                className="font-bold text-gray-900 leading-tight text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
              >
                {title}
              </Typography>

              <Typography
                color="text.secondary"
                className="text-base sm:text-lg md:text-xl leading-relaxed"
              >
                {text}
              </Typography>

              <div className="mt-2 sm:mt-3 md:mt-4 flex flex-col gap-3 sm:gap-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-start gap-2 sm:gap-3 group">
                    <div className="mt-0.5 sm:mt-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                      <Check size={12} className="text-green-600 sm:w-3.5 sm:h-3.5" />
                    </div>
                    <Typography
                      className="font-medium text-gray-700 text-sm sm:text-base md:text-lg"
                    >
                      {item}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Rotating3DIcon Icon={Icon} color={color} badge={badge} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

function Footer() {
  const t = useTranslations("HomePage.footer");
  const currentYear = new Date().getFullYear();

  return (
    <Box className="bg-[#0f172a] text-white py-10 sm:py-12 md:py-16 border-t border-gray-800">
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 6, sm: 7, md: 8 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <div className="flex items-center gap-2 mb-4 sm:mb-5 md:mb-6">
              <div className="h-7 w-7 sm:h-8 sm:w-8 bg-white text-black rounded flex items-center justify-center font-bold text-sm sm:text-base">
                BA
              </div>
              <Typography className="font-bold text-base sm:text-lg">
                Business Assistant
              </Typography>
            </div>
            <Typography
              className="text-gray-400 mb-4 sm:mb-5 md:mb-6 leading-relaxed text-sm sm:text-base"
            >
              {t("description")}
            </Typography>
            <div className="flex gap-3 sm:gap-4 mt-1!">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <IconButton
                  key={i}
                  size="small"
                  sx={{ color: "white" }}
                  className="bg-gray-800 hover:bg-primary transition-colors p-2"
                >
                  <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
                </IconButton>
              ))}
            </div>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Typography className="font-bold mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base">
              {t("columns.product.title")}
            </Typography>
            <ul className="space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm mt-1!">
              {["features", "pricing", "integrations", "updates"].map((key) => (
                <li
                  key={key}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  {t(`columns.product.links.${key}`)}
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 6, sm: 6, md: 2 }}>
            <Typography className="font-bold mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base">
              {t("columns.company.title")}
            </Typography>
            <ul className="space-y-2 sm:space-y-3 text-gray-400 text-xs sm:text-sm mt-1!">
              {["about", "careers", "blog", "contacts"].map((key) => (
                <li
                  key={key}
                  className="hover:text-white cursor-pointer transition-colors"
                >
                  {t(`columns.company.links.${key}`)}
                </li>
              ))}
            </ul>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography className="font-bold mb-4 sm:mb-5 md:mb-6 text-sm sm:text-base">
              {t("columns.subscribe.title")}
            </Typography>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-1!">
              <input
                type="email"
                placeholder={t("columns.subscribe.placeholder")}
                className="bg-gray-800/50 border border-gray-700 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                className="rounded-lg font-bold py-2.5 sm:py-3 px-4 sm:px-6 text-sm sm:text-base whitespace-nowrap"
              >
                {t("columns.subscribe.button")}
              </Button>
            </div>
          </Grid>
        </Grid>

        <div className="border-t border-gray-800 mt-10 sm:mt-12 md:mt-16 pt-6 sm:pt-7 md:pt-8 flex flex-col md:flex-row justify-between items-center text-xs sm:text-sm text-gray-500 gap-3 sm:gap-4">
          <Typography variant="caption" className="text-xs sm:text-sm">
            © {currentYear} {t("copyright")}
          </Typography>
          <div className="flex gap-4 sm:gap-6">
            <span className="cursor-pointer hover:text-white transition-colors">
              {t("privacy")}
            </span>
            <span className="cursor-pointer hover:text-white transition-colors">
              {t("terms")}
            </span>
          </div>
        </div>
      </Container>
    </Box>
  );
}

export default function HomePage() {
  const t = useTranslations("HomePage");

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <HeroSection />

      <FeatureSection
        reversed
        title={t("features.analytics.title")}
        text={t("features.analytics.description")}
        icon={TrendingUp}
        color="bg-blue-600"
        items={["0", "1", "2"].map((key) =>
          t(`features.analytics.items.${key}`)
        )}
        badge={{
          icon: TrendingUp,
          bgColor: "bg-green-600",
          label: t("badges.efficiency"),
          value: "+125%"
        }}
      />

      <FeatureSection
        title={t("features.team.title")}
        text={t("features.team.description")}
        icon={Users}
        color="bg-purple-600"
        items={["0", "1", "2"].map((key) => t(`features.team.items.${key}`))}
        badge={{
          icon: CheckCircle2,
          bgColor: "bg-purple-600",
          label: t("badges.convenience"),
          value: "10/10"
        }}
      />

      <FeatureSection
        reversed
        title={t("features.security.title")}
        text={t("features.security.description")}
        icon={ShieldCheck}
        color="bg-green-600"
        items={["0", "1", "2"].map((key) =>
          t(`features.security.items.${key}`)
        )}
        badge={{
          icon: ShieldCheck,
          bgColor: "bg-green-600",
          label: t("badges.protection"),
          value: "99.9%"
        }}
      />

      <FeatureSection
        title={t("features.automation.title")}
        text={t("features.automation.description")}
        icon={Zap}
        color="bg-orange-600"
        items={["0", "1", "2"].map((key) =>
          t(`features.automation.items.${key}`)
        )}
        badge={{
          icon: Zap,
          bgColor: "bg-orange-600",
          label: t("badges.speed"),
          value: "3x"
        }}
      />

      <Box className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white text-center relative overflow-hidden">
        <Container maxWidth="md" className="relative z-10 px-4">
          <div className="inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-primary/10 mb-6 sm:mb-7 md:mb-8 backdrop-blur-sm border border-primary/20 shadow-xl">
            <Zap size={32} className="text-primary fill-primary sm:w-9 sm:h-9 md:w-10 md:h-10" />
          </div>

          <Typography
            className="font-extrabold text-gray-900 mb-4 sm:mb-5 md:mb-6 leading-tight"
            sx={{
              fontSize: {
                xs: "1.5rem",
                sm: "1.875rem",
                md: "2.25rem",
                lg: "3rem",
              },
            }}
          >
            {t.rich("cta.title", {
              br: () => <br />,
            })}
          </Typography>

          <Typography
            className="mb-8 sm:mb-9 md:mb-10 text-gray-600 mx-auto font-normal leading-relaxed mt-3! max-w-lg"
            sx={{ fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" } }}
          >
            {t("cta.description")}
          </Typography>

          <Button
            component={Link}
            href="/register"
            variant="contained"
            color="primary"
            size="large"
            className="py-3 sm:py-3.5 md:py-4 px-8 sm:px-10 md:px-12 rounded-full font-bold text-base sm:text-lg shadow-xl hover:scale-105 transition-transform duration-300 mt-5!"
          >
            {t("cta.button")}
          </Button>

          <Typography
            variant="caption"
            display="block"
            className="text-gray-500 mt-2! text-xs sm:text-sm"
          >
            {t("cta.caption")}
          </Typography>
        </Container>
      </Box>

      <Footer />
    </main>
  );
}
