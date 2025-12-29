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
            <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-md">
              BA
            </div>
            <Typography
              variant="h6"
              component="div"
              className="font-bold text-black leading-none whitespace-nowrap"
            >
              {t("title")}
            </Typography>
          </div>

          <div className="flex items-center gap-3">
            <Button
              component={Link}
              href="/login"
              variant="text"
              color="inherit"
              className="font-medium hover:bg-gray-100 rounded-lg hidden sm:flex"
            >
              {t("login")}
            </Button>

            <Button
              component={Link}
              href="/register"
              variant="contained"
              color="primary"
              className="px-6 rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
            >
              {t("register")}
            </Button>

            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

            <Button
              onClick={toggleLanguage}
              color="inherit"
              startIcon={<Globe size={18} />}
              className="min-w-[80px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
    <Box className="py-20 lg:py-32 bg-linear-to-b from-gray-50 to-white overflow-hidden relative">
      <Container maxWidth="lg">
        <Grid container spacing={6} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }} className="text-center md:text-left">
            <Typography
              variant="h2"
              component="h1"
              className="font-extrabold text-gray-900 mb-6 leading-tight"
            >
              {t("title_part1")} <br />
              <span className="text-primary">{t("title_part2")}</span>
            </Typography>
            <Typography
              variant="h6"
              color="text.secondary"
              className="mb-8 font-normal leading-relaxed"
            >
              {t("subtitle")}
            </Typography>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mt-3">
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="large"
                endIcon={<ArrowRight />}
                className="py-3 px-8 text-lg rounded-full"
              >
                {t("startBtn")}
              </Button>
              <Button
                variant="outlined"
                size="large"
                className="py-3 px-8 text-lg rounded-full"
              >
                {t("learnMoreBtn")}
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-4 justify-center md:justify-start text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle2 size={16} className="text-green-500" />
                {t("badgeFree")}
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 size={16} className="text-green-500" />
                {t("badgeNoCard")}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <div className="relative">
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

              <Paper
                elevation={6}
                className="
                  relative rounded-2xl overflow-hidden bg-white p-4 border border-gray-100
                  transform 
                  rotate-2 
                  transition-all!
                  duration-800!
                  ease-out!
                  hover:rotate-0!
                  hover:scale-[1.02]!
                "
              >
                <div className="bg-gray-100 rounded-xl h-64 w-full flex items-center justify-center">
                  <BarChart3 size={64} className="text-gray-300" />
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </Paper>
            </div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

type FeatureItem = string;

function FeatureSection({
  reversed,
  title,
  text,
  icon: Icon,
  color,
  items,
}: {
  reversed?: boolean;
  title: string;
  text: string;
  icon: any;
  color: string;
  items: FeatureItem[];
}) {
  return (
    <Box className="py-24 bg-white">
      <Container maxWidth="lg">
        <Grid
          container
          spacing={8}
          alignItems="center"
          direction={reversed ? "row-reverse" : "row"}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <div className="flex flex-col gap-6">
              <div
                className={`h-14 w-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg`}
              >
                <Icon size={28} />
              </div>

              <Typography
                variant="h3"
                className="font-bold text-gray-900 leading-tight"
              >
                {title}
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                className="text-lg leading-relaxed"
              >
                {text}
              </Typography>

              <div className="mt-4 flex flex-col gap-4">
                {items.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 group">
                    <div className="mt-1 h-6 w-6 rounded-full bg-green-50 flex items-center justify-center shrink-0 group-hover:bg-green-100 transition-colors">
                      <Check size={14} className="text-green-600" />
                    </div>
                    <Typography
                      variant="body1"
                      className="font-medium text-gray-700"
                    >
                      {item}
                    </Typography>
                  </div>
                ))}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <div className="relative group">
              <div
                className={`absolute inset-0 ${color} opacity-5 rounded-3xl transform rotate-3 transition-transform duration-500 group-hover:rotate-6`}
              ></div>

              <Paper
                elevation={0}
                className="relative bg-gray-50 rounded-3xl p-8 border border-gray-100 h-[450px] flex items-center justify-center overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-br from-transparent to-white/50 opacity-50" />

                <Icon
                  size={140}
                  className="text-gray-200 group-hover:scale-110 transition-transform duration-700"
                />

                <Paper
                  elevation={8}
                  className="absolute bottom-10 right-10 p-5 rounded-2xl flex items-center gap-4 animate-bounce bg-white/90 backdrop-blur shadow-xl"
                  sx={{ animationDuration: "3s" }}
                >
                  <div className="bg-green-100 p-3 rounded-xl">
                    <TrendingUp size={24} className="text-green-600" />
                  </div>
                  <div>
                    <Typography
                      variant="caption"
                      display="block"
                      className="text-gray-500 font-semibold uppercase tracking-wide text-[10px]"
                    >
                      Ефективність
                    </Typography>
                    <Typography
                      variant="h6"
                      className="font-bold text-gray-900 leading-none"
                    >
                      +125%
                    </Typography>
                  </div>
                </Paper>
              </Paper>
            </div>
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
    <Box className="bg-[#0f172a] text-white py-16 border-t border-gray-800">
      <Container maxWidth="lg">
        <Grid container spacing={8}>
          <Grid size={{ xs: 12, md: 4 }}>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 bg-white text-black rounded flex items-center justify-center font-bold">
                BA
              </div>
              <Typography variant="h6" className="font-bold">
                Business Assistant
              </Typography>
            </div>
            <Typography
              variant="body2"
              className="text-gray-400 mb-6 leading-relaxed"
            >
              {t("description")}
            </Typography>
            <div className="flex gap-4 mt-1!">
              {[Facebook, Twitter, Linkedin, Instagram].map((Icon, i) => (
                <IconButton
                  key={i}
                  size="small"
                  sx={{ color: "white" }}
                  className="bg-gray-800 hover:bg-primary transition-colors"
                >
                  <Icon size={18} />
                </IconButton>
              ))}
            </div>
          </Grid>

          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle1" className="font-bold mb-6">
              {t("columns.product.title")}
            </Typography>
            <ul className="space-y-3 text-gray-400 text-sm mt-1!">
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

          <Grid size={{ xs: 6, md: 2 }}>
            <Typography variant="subtitle1" className="font-bold mb-6">
              {t("columns.company.title")}
            </Typography>
            <ul className="space-y-3 text-gray-400 text-sm mt-1!">
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
            <Typography variant="subtitle1" className="font-bold mb-6">
              {t("columns.subscribe.title")}
            </Typography>
            <div className="flex flex-row gap-3 mt-1!">
              <input
                type="email"
                placeholder={t("columns.subscribe.placeholder")}
                className="bg-gray-800/50 border border-gray-700 text-white px-4 py-3 rounded-lg w-full outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <Button
                variant="contained"
                color="primary"
                size="large"
                className="rounded-lg font-bold py-3"
              >
                {t("columns.subscribe.button")}
              </Button>
            </div>
          </Grid>
        </Grid>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <Typography variant="caption">
            © {currentYear} {t("copyright")}
          </Typography>
          <div className="flex gap-6 mt-4 md:mt-0">
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
        title={t("features.analytics.title")}
        text={t("features.analytics.description")}
        icon={TrendingUp}
        color="bg-blue-600"
        items={["0", "1", "2"].map((key) =>
          t(`features.analytics.items.${key}`)
        )}
      />

      <FeatureSection
        reversed
        title={t("features.team.title")}
        text={t("features.team.description")}
        icon={Users}
        color="bg-purple-600"
        items={["0", "1", "2"].map((key) => t(`features.team.items.${key}`))}
      />

      <FeatureSection
        title={t("features.security.title")}
        text={t("features.security.description")}
        icon={ShieldCheck}
        color="bg-green-600"
        items={["0", "1", "2"].map((key) =>
          t(`features.security.items.${key}`)
        )}
      />

      <Box className="py-24 bg-white text-center relative overflow-hidden">
        <Container maxWidth="md" className="relative z-10">
          <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-8 backdrop-blur-sm border border-primary/20 shadow-xl">
            <Zap size={40} className="text-primary fill-primary" />
          </div>

          <Typography
            variant="h2"
            className="font-extrabold text-gray-900 mb-6 leading-tight"
          >
            {t.rich("cta.title", {
              br: () => <br />,
            })}
          </Typography>

          <Typography
            variant="h6"
            className="mb-10 text-gray-600 mx-auto font-normal leading-relaxed mt-3!"
          >
            {t("cta.description")}
          </Typography>

          <Button
            component={Link}
            href="/register"
            variant="contained"
            color="primary"
            size="large"
            className="py-4 px-12 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-transform duration-300 mt-5!"
          >
            {t("cta.button")}
          </Button>

          <Typography
            variant="caption"
            display="block"
            className="text-gray-500 mt-2!"
          >
            {t("cta.caption")}
          </Typography>
        </Container>
      </Box>

      <Footer />
    </main>
  );
}
