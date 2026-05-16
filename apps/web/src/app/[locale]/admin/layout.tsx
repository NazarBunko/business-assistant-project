"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { CircularProgress, Container } from "@mui/material";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (pathname.includes("/admin/login")) {
      setLoading(false);
      return;
    }

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.globalRole !== "ADMIN") {
        router.push(`/${locale}/admin/login`);
        return;
      }
      setLoading(false);
    } catch (e) {
      router.push(`/${locale}/admin/login`);
    }
  }, [router, pathname, locale]);

  if (loading && !pathname.includes("/admin/login")) {
    return (
      <Container className="min-h-screen flex items-center justify-center">
        <CircularProgress />
      </Container>
    );
  }

  return <>{children}</>;
}
