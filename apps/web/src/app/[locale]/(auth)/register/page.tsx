"use client";

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
  Tabs,
  Tab,
} from "@mui/material";
import { Link, useRouter } from "../../../../i18n/routing";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { API_URL } from "../../../../config/api";
import { apiFetch } from "../../../../lib/api-fetch";
import { persistAuthSession } from "../../../../lib/auth-token";
import { resolveApiError } from "../../../../lib/api-error-message";

type RegisterMode = "owner" | "employee";

export default function RegisterPage() {
  const t = useTranslations("Auth.Register");
  const tCommon = useTranslations("Auth");
  const tRaw = useTranslations();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [mode, setMode] = useState<RegisterMode>("owner");

  const ownerForm = useForm();
  const employeeForm = useForm();

  const showError = (payload: unknown) => {
    enqueueSnackbar(
      resolveApiError(payload, t("errors.defaultError"), tRaw),
      { variant: "error" },
    );
  };

  const onSubmitOwner = async (data: Record<string, string>) => {
    try {
      const response = await apiFetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: data.companyName,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        showError(errorData);
        return;
      }
      persistAuthSession(await response.json());
      router.push("/dashboard");
      router.refresh();
    } catch {
      enqueueSnackbar(tRaw("Common.errors.networkError"), { variant: "error" });
    }
  };

  const onSubmitEmployee = async (data: Record<string, string>) => {
    try {
      const response = await apiFetch(`${API_URL}/auth/register/employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: data.inviteCode,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        showError(errorData);
        return;
      }
      persistAuthSession(await response.json());
      router.push("/dashboard");
      router.refresh();
    } catch {
      enqueueSnackbar(tRaw("Common.errors.networkError"), { variant: "error" });
    }
  };

  return (
    <Container
      maxWidth="sm"
      className="min-h-screen flex flex-col items-center justify-center py-6 sm:py-10 px-4"
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
        <Typography className="mb-3 sm:mb-4 text-center font-bold text-xl sm:text-2xl md:text-3xl">
          {t("title")}
        </Typography>

        <Tabs
          value={mode}
          onChange={(_, v) => setMode(v as RegisterMode)}
          className="mb-3 sm:mb-4"
          variant="fullWidth"
        >
          <Tab label={t("tabOwner")} value="owner" className="text-xs sm:text-sm" />
          <Tab label={t("tabEmployee")} value="employee" className="text-xs sm:text-sm" />
        </Tabs>

        {mode === "owner" && (
          <form
            onSubmit={ownerForm.handleSubmit(onSubmitOwner)}
            className="flex flex-col gap-3 sm:gap-4 mt-2 sm:mt-3"
          >
            <TextField
              label={t("companyName")}
              fullWidth
              {...ownerForm.register("companyName", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.companyName}
              helperText={ownerForm.formState.errors.companyName?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("fullNameOwner")}
              fullWidth
              {...ownerForm.register("fullName", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.fullName}
              helperText={ownerForm.formState.errors.fullName?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("email")}
              type="email"
              fullWidth
              {...ownerForm.register("email", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.email}
              helperText={ownerForm.formState.errors.email?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("phone")}
              fullWidth
              {...ownerForm.register("phone", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.phone}
              helperText={ownerForm.formState.errors.phone?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("password")}
              type="password"
              fullWidth
              {...ownerForm.register("password", {
                required: t("errors.required"),
                minLength: { value: 6, message: t("errors.minLength") },
              })}
              error={!!ownerForm.formState.errors.password}
              helperText={ownerForm.formState.errors.password?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("confirmPassword")}
              type="password"
              fullWidth
              {...ownerForm.register("confirmPassword", {
                required: t("errors.required"),
                validate: (val: string) =>
                  ownerForm.watch("password") !== val ? t("errors.passwordsMismatch") : undefined,
              })}
              error={!!ownerForm.formState.errors.confirmPassword}
              helperText={ownerForm.formState.errors.confirmPassword?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              className="mt-2 py-2.5 sm:py-3 text-sm sm:text-base"
              disabled={ownerForm.formState.isSubmitting}
            >
              {ownerForm.formState.isSubmitting ? t("submitting") : t("submitButton")}
            </Button>
          </form>
        )}

        {mode === "employee" && (
          <form
            onSubmit={employeeForm.handleSubmit(onSubmitEmployee)}
            className="flex flex-col gap-3 sm:gap-4 mt-2 sm:mt-3"
          >
            <TextField
              label={t("inviteCode")}
              fullWidth
              inputProps={{ maxLength: 8, inputMode: "numeric" }}
              {...employeeForm.register("inviteCode", {
                required: t("errors.required"),
                pattern: {
                  value: /^\d{8}$/,
                  message: t("errors.inviteCodeInvalid"),
                },
              })}
              error={!!employeeForm.formState.errors.inviteCode}
              helperText={employeeForm.formState.errors.inviteCode?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("fullName")}
              fullWidth
              {...employeeForm.register("fullName", { required: t("errors.required") })}
              error={!!employeeForm.formState.errors.fullName}
              helperText={employeeForm.formState.errors.fullName?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("email")}
              type="email"
              fullWidth
              {...employeeForm.register("email", { required: t("errors.required") })}
              error={!!employeeForm.formState.errors.email}
              helperText={employeeForm.formState.errors.email?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("phone")}
              fullWidth
              {...employeeForm.register("phone", { required: t("errors.required") })}
              error={!!employeeForm.formState.errors.phone}
              helperText={employeeForm.formState.errors.phone?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("password")}
              type="password"
              fullWidth
              {...employeeForm.register("password", {
                required: t("errors.required"),
                minLength: { value: 6, message: t("errors.minLength") },
              })}
              error={!!employeeForm.formState.errors.password}
              helperText={employeeForm.formState.errors.password?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <TextField
              label={t("confirmPassword")}
              type="password"
              fullWidth
              {...employeeForm.register("confirmPassword", {
                required: t("errors.required"),
                validate: (val: string) =>
                  employeeForm.watch("password") !== val ? t("errors.passwordsMismatch") : undefined,
              })}
              error={!!employeeForm.formState.errors.confirmPassword}
              helperText={employeeForm.formState.errors.confirmPassword?.message as string}
              size="medium"
              InputProps={{ className: "text-sm sm:text-base" }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              className="mt-2 py-2.5 sm:py-3 text-sm sm:text-base"
              disabled={employeeForm.formState.isSubmitting}
            >
              {employeeForm.formState.isSubmitting ? t("submitting") : t("submitButtonEmployee")}
            </Button>
          </form>
        )}

        <Box className="mt-4 text-center">
          <Typography variant="body2" color="text.secondary" className="text-xs sm:text-sm">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("loginLink")}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
