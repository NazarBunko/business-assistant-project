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
import { getApiErrorMessage } from "../../../../lib/api-error-message";

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

  const showError = (message: string) => {
    enqueueSnackbar(getApiErrorMessage(message, tRaw), { variant: "error" });
  };

  const onSubmitOwner = async (data: Record<string, string>) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        showError(errorData.message || t("errors.defaultError"));
        return;
      }
      const result = await response.json();
      localStorage.setItem("user", JSON.stringify(result));
      router.push("/dashboard");
      router.refresh();
    } catch {
      showError(tRaw("Common.errors.networkError"));
    }
  };

  const onSubmitEmployee = async (data: Record<string, string>) => {
    try {
      const response = await fetch(`${API_URL}/auth/register/employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: data.inviteCode,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          password: data.password,
        }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        showError(errorData.message || t("errors.defaultError"));
        return;
      }
      const result = await response.json();
      localStorage.setItem("user", JSON.stringify(result));
      router.push("/dashboard");
      router.refresh();
    } catch {
      showError(tRaw("Common.errors.networkError"));
    }
  };

  return (
    <Container
      maxWidth="sm"
      className="min-h-screen flex flex-col items-center justify-center py-10"
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
        <Typography variant="h5" className="mb-4 text-center font-bold">
          {t("title")}
        </Typography>

        <Tabs
          value={mode}
          onChange={(_, v) => setMode(v as RegisterMode)}
          className="mb-4"
          variant="fullWidth"
        >
          <Tab label={t("tabOwner")} value="owner" />
          <Tab label={t("tabEmployee")} value="employee" />
        </Tabs>

        {mode === "owner" && (
          <form
            onSubmit={ownerForm.handleSubmit(onSubmitOwner)}
            className="flex flex-col gap-4 mt-3"
          >
            <TextField
              label={t("companyName")}
              fullWidth
              {...ownerForm.register("companyName", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.companyName}
              helperText={ownerForm.formState.errors.companyName?.message as string}
            />
            <TextField
              label={t("fullNameOwner")}
              fullWidth
              {...ownerForm.register("fullName", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.fullName}
              helperText={ownerForm.formState.errors.fullName?.message as string}
            />
            <TextField
              label={t("email")}
              type="email"
              fullWidth
              {...ownerForm.register("email", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.email}
              helperText={ownerForm.formState.errors.email?.message as string}
            />
            <TextField
              label={t("phone")}
              fullWidth
              {...ownerForm.register("phone", { required: t("errors.required") })}
              error={!!ownerForm.formState.errors.phone}
              helperText={ownerForm.formState.errors.phone?.message as string}
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
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              className="mt-2"
              disabled={ownerForm.formState.isSubmitting}
            >
              {ownerForm.formState.isSubmitting ? t("submitting") : t("submitButton")}
            </Button>
          </form>
        )}

        {mode === "employee" && (
          <form
            onSubmit={employeeForm.handleSubmit(onSubmitEmployee)}
            className="flex flex-col gap-4 mt-3"
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
            />
            <TextField
              label={t("fullName")}
              fullWidth
              {...employeeForm.register("fullName", { required: t("errors.required") })}
              error={!!employeeForm.formState.errors.fullName}
              helperText={employeeForm.formState.errors.fullName?.message as string}
            />
            <TextField
              label={t("email")}
              type="email"
              fullWidth
              {...employeeForm.register("email", { required: t("errors.required") })}
              error={!!employeeForm.formState.errors.email}
              helperText={employeeForm.formState.errors.email?.message as string}
            />
            <TextField
              label={t("phone")}
              fullWidth
              {...employeeForm.register("phone", { required: t("errors.required") })}
              error={!!employeeForm.formState.errors.phone}
              helperText={employeeForm.formState.errors.phone?.message as string}
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
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              className="mt-2"
              disabled={employeeForm.formState.isSubmitting}
            >
              {employeeForm.formState.isSubmitting ? t("submitting") : t("submitButtonEmployee")}
            </Button>
          </form>
        )}

        <Box className="mt-4 text-center">
          <Typography variant="body2" color="text.secondary">
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
