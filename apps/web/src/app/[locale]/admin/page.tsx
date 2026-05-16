"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { CircularProgress, Container } from "@mui/material";

export default function AdminIndexPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.globalRole === "ADMIN") {
          router.push(`/${locale}/admin/dashboard`);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    router.push(`/${locale}/admin/login`);
  }, [router, locale]);

  return (
    <Container className="min-h-screen flex items-center justify-center">
      <CircularProgress />
    </Container>
  );
}
