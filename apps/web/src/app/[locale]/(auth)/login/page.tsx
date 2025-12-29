"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import {
  Button,
  TextField,
  Paper,
  Typography,
  Container,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Link, useRouter } from "../../../../i18n/routing";
import { ArrowLeft } from "lucide-react";

interface LoginFormData {
  login: string;
  password: string;
}

export default function LoginPage() {
  const t = useTranslations("Auth.Login");
  const tCommon = useTranslations("Auth");
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError(null);

    try {
      const response = await fetch("http://localhost:3001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("errors.defaultError"));
      }

      const user = await response.json();
      console.log("Login successful:", user);

      localStorage.setItem("user", JSON.stringify(user));

      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      setServerError(t("errors.invalidCredentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      className="min-h-screen flex flex-col items-center justify-center py-10"
      sx={{ marginTop: -6 }}
    >
      <Box className="w-full mb-6 flex justify-start">
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowLeft size={20} />}
          color="inherit"
          className="normal-case hover:bg-transparent hover:text-primary px-0"
        >
          {tCommon("backToHome")}
        </Button>
      </Box>

      <Paper className="p-8 w-full">
        <Typography variant="h5" className="mb-6 text-center font-bold">
          {t("title")}
        </Typography>

        {serverError && (
          <Alert severity="error" className="mb-4">
            {serverError}
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 mt-4"
        >
          <TextField
            label={t("emailLabel")}
            fullWidth
            {...register("login", { required: t("errors.required") })}
            error={!!errors.login}
            helperText={errors.login?.message}
            disabled={isLoading}
          />

          <TextField
            label={t("passwordLabel")}
            type="password"
            fullWidth
            {...register("password", {
              required: t("errors.passwordRequired"),
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            className="mt-2 py-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t("submitButton")
            )}
          </Button>
        </form>

        <Box className="mt-4 text-center">
          <Typography variant="body2" color="text.secondary">
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
