"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Container,
  Box,
  CircularProgress,
} from "@mui/material";
import { Link, useRouter } from "../../../../i18n/routing";
import { ArrowLeft } from "lucide-react";
import { API_URL } from "../../../../config/api";
import { apiFetch } from "../../../../lib/api-fetch";
import { persistAuthSession } from "../../../../lib/auth-token";
import { resolveApiError } from "../../../../lib/api-error-message";

interface LoginFormData {
  login: string;
  password: string;
}

export default function LoginPage() {
  const t = useTranslations("Auth.Login");
  const tCommon = useTranslations("Auth");
  const tRaw = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await apiFetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        enqueueSnackbar(
          resolveApiError(errorData, t("errors.defaultError"), tRaw),
          { variant: "error" },
        );
        return;
      }

      const authData = await response.json();
      persistAuthSession(authData);

      router.push("/dashboard");
      router.refresh();
    } catch {
      enqueueSnackbar(tRaw("Common.errors.networkError"), { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      className="min-h-screen flex flex-col items-center justify-center py-6 sm:py-10 px-4"
      sx={{ marginTop: { xs: -2, sm: -4, md: -6 } }}
    >
      <Box className="w-full mb-4 sm:mb-6 flex justify-start">
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowLeft size={18} className="sm:w-5 sm:h-5" />}
          color="inherit"
          className="normal-case hover:bg-transparent hover:text-primary px-0 text-sm sm:text-base"
        >
          {tCommon("backToHome")}
        </Button>
      </Box>

      <Paper className="p-5 sm:p-6 md:p-8 w-full rounded-2xl">
        <Typography className="mb-5 sm:mb-6 text-center font-bold text-xl sm:text-2xl md:text-3xl">
          {t("title")}
        </Typography>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-3.5 sm:gap-4 mt-3 sm:mt-4"
        >
          <TextField
            label={t("emailLabel")}
            fullWidth
            {...register("login", { required: t("errors.required") })}
            error={!!errors.login}
            helperText={errors.login?.message as string}
            disabled={isLoading}
            size="medium"
            InputProps={{ className: "text-sm sm:text-base" }}
          />

          <TextField
            label={t("passwordLabel")}
            type="password"
            fullWidth
            {...register("password", {
              required: t("errors.passwordRequired"),
            })}
            error={!!errors.password}
            helperText={errors.password?.message as string}
            disabled={isLoading}
            size="medium"
            InputProps={{ className: "text-sm sm:text-base" }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            className="mt-2 py-2.5 sm:py-3 text-sm sm:text-base"
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={22} className="sm:w-6 sm:h-6" color="inherit" />
            ) : (
              t("submitButton")
            )}
          </Button>
        </form>

        <Box className="mt-4 text-center">
          <Typography variant="body2" color="text.secondary" className="text-xs sm:text-sm">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              {t("registerLink")}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
