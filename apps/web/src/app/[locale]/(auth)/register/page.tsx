"use client";

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
} from "@mui/material";
import { Link, useRouter } from "../../../../i18n/routing";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const t = useTranslations("Auth.Register");
  const tCommon = useTranslations("Auth");
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data: any) => {
    setServerError("");

    try {
      const response = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("errors.defaultError"));
      }

      const result = await response.json();
      console.log("Success:", result);

      router.push("/login");
    } catch (err: any) {
      setServerError(err.message);
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
          className="flex flex-col gap-4 mt-3"
        >
          <TextField
            label={t("companyName")}
            fullWidth
            {...register("companyName", { required: t("errors.required") })}
            error={!!errors.companyName}
            helperText={errors.companyName?.message as string}
          />

          <TextField
            label={t("fullName")}
            fullWidth
            {...register("fullName", { required: t("errors.required") })}
            error={!!errors.fullName}
            helperText={errors.fullName?.message as string}
          />

          <TextField
            label={t("email")}
            type="email"
            fullWidth
            {...register("email", { required: t("errors.required") })}
            error={!!errors.email}
            helperText={errors.email?.message as string}
          />

          <TextField
            label={t("phone")}
            fullWidth
            {...register("phone", { required: t("errors.required") })}
            error={!!errors.phone}
            helperText={errors.phone?.message as string}
          />

          <TextField
            label={t("password")}
            type="password"
            fullWidth
            {...register("password", {
              required: t("errors.required"),
              minLength: { value: 6, message: t("errors.minLength") },
            })}
            error={!!errors.password}
            helperText={errors.password?.message as string}
          />

          <TextField
            label={t("confirmPassword")}
            type="password"
            fullWidth
            {...register("confirmPassword", {
              required: t("errors.required"),
              validate: (val: string) => {
                if (watch("password") != val) {
                  return t("errors.passwordsMismatch");
                }
              },
            })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message as string}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            className="mt-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("submitting") : t("submitButton")}
          </Button>
        </form>

        <Box className="mt-4 text-center">
          <Typography variant="body2" color="text.secondary">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="text-primary font-medium hover:underline"
            >
              {t("loginLink")}
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
}
