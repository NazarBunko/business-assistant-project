"use client";

import { useTranslations } from "next-intl";
import { Typography } from "@mui/material";

export default function DashboardPage() {
  const t = useTranslations("Navigation");

  return (
    <div>
      <Typography variant="h4" className="font-bold mb-6 text-gray-800">
        {t("dashboard")}
      </Typography>
    </div>
  );
}
