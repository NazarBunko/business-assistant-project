"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import { Shield, LogIn, Globe } from "lucide-react";
import { API_URL } from "../../../../config/api";
import { useSnackbar } from "notistack";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const toggleLanguage = () => {
    const nextLocale = locale === "uk" ? "en" : "uk";
    const newPath = pathname.replace(`/${locale}/`, `/${nextLocale}/`);
    router.push(newPath);
  };

  useEffect(() => {
    const checkAuth = async () => {
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
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: formData.email, password: formData.password }),
        credentials: "include",
      });

      if (!response.ok) {
        enqueueSnackbar("Invalid credentials or access denied", { variant: "error" });
        setLoading(false);
        return;
      }

      const user = await response.json();

      if (user.globalRole !== "ADMIN") {
        // Logout if not admin
        await fetch(`${API_URL}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
        enqueueSnackbar("Admin access required", { variant: "error" });
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(user));
      router.push(`/${locale}/admin/dashboard`);
    } catch (error) {
      console.error(error);
      enqueueSnackbar("Network error", { variant: "error" });
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <CircularProgress className="text-gray-900" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Container maxWidth="sm">
        <div className="absolute top-4 right-4">
          <Button
            onClick={toggleLanguage}
            color="inherit"
            startIcon={<Globe size={18} />}
            className="min-w-[80px] font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {locale.toUpperCase()}
          </Button>
        </div>

        <Paper className="w-full p-8 rounded-2xl shadow-sm border border-gray-200">
          <Box className="flex flex-col items-center mb-8">
            <div className="bg-gray-900 text-white p-4 rounded-2xl mb-4">
              <Shield size={32} />
            </div>
            <Typography variant="h4" className="font-bold text-center text-gray-900 mb-2">
              Admin Panel
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-center">
              Administrator access only
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                variant="outlined"
                className="bg-white"
                InputProps={{ 
                  className: "rounded-xl",
                }}
              />
            </div>

            <div className="mb-6">
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                variant="outlined"
                className="bg-white"
                InputProps={{ 
                  className: "rounded-xl",
                }}
              />
            </div>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LogIn size={20} />}
              className="bg-black hover:bg-gray-800 text-white py-3 rounded-xl normal-case text-base shadow-none"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Paper>
      </Container>
    </div>
  );
}
