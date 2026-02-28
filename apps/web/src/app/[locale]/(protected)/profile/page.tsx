"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Badge,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  User,
  Save,
  Lock,
  Building2,
  Phone,
  Mail,
  Briefcase,
} from "lucide-react";
import { API_URL } from "../../../../config/api";

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  jobTitle: string;
  role: string;
  company?: {
    name: string;
  };
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    jobTitle: "",
    password: "",
  });

  const [userReadOnly, setUserReadOnly] = useState<{
    role: string;
    companyName: string;
  }>({
    role: "",
    companyName: "",
  });

  const getUserId = () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.id;
        } catch (e) {
          return "demo-user";
        }
      }
    }
    return "demo-user";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      const userId = getUserId();
      try {
        const res = await fetch(
          `${API_URL}/user/profile?userId=${userId}`
        );
        if (res.ok) {
          const data: UserProfile = await res.json();
          setFormData({
            fullName: data.fullName || "",
            email: data.email || "",
            phone: data.phone || "",
            jobTitle: data.jobTitle || "",
            password: "",
          });
          setUserReadOnly({
            role: data.role,
            companyName: data.company?.name || t("notSpecified"),
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [t]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage("");
    const userId = getUserId();

    const payload: any = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const res = await fetch(
        `${API_URL}/user/profile?userId=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        setSuccessMessage(t("successMessage"));
        const oldUserStr = localStorage.getItem("user");
        if (oldUserStr) {
          const oldUser = JSON.parse(oldUserStr);
          localStorage.setItem(
            "user",
            JSON.stringify({ ...oldUser, name: formData.fullName })
          );
        }
        setFormData((prev) => ({ ...prev, password: "" }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-140px)]">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 -mt-5">
      <div className="mb-4">
        <Typography variant="h4" className="font-bold text-gray-900">
          {t("title")}
        </Typography>
        <Typography className="text-gray-500">{t("subtitle")}</Typography>
      </div>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper className="p-6 rounded-2xl border border-gray-200 text-center bg-white shadow-sm h-full">
              <div className="flex flex-col items-center">
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  color="success"
                >
                  <Avatar
                    sx={{ width: 120, height: 120 }}
                    className="bg-black text-4xl mb-4 shadow-xl"
                  >
                    {formData.fullName &&
                      formData.fullName.trim().length > 0 ? (
                      formData.fullName.charAt(0).toUpperCase()
                    ) : (
                      <User size={48} />
                    )}
                  </Avatar>
                </Badge>

                <Typography variant="h6" className="font-bold">
                  {formData.fullName || "User"}
                </Typography>
                <Typography variant="body2" className="text-gray-500 mb-4!">
                  {userReadOnly.role}
                </Typography>

                <Divider className="w-full my-4" />

                <div className="w-full text-left space-y-3">
                  <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                    <Building2 size={20} />
                    <div>
                      <Typography
                        variant="caption"
                        className="block text-gray-400"
                      >
                        {t("company")}
                      </Typography>
                      <Typography variant="body2" className="font-medium">
                        {userReadOnly.companyName}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Paper className="p-6 sm:p-8 rounded-2xl border border-gray-200 bg-white shadow-sm">
              {successMessage && (
                <Alert severity="success" className="mb-6 rounded-xl">
                  {successMessage}
                </Alert>
              )}

              <div className="space-y-6">
                <div>
                  <Typography
                    variant="h6"
                    className="font-bold mb-4! flex items-center gap-2"
                  >
                    <User size={20} /> {t("personalInfo")}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label={t("fields.fullName")}
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        variant="outlined"
                        className="bg-gray-50"
                        InputProps={{ className: "rounded-xl" }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label={t("fields.email")}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        variant="outlined"
                        className="bg-gray-50"
                        InputProps={{
                          className: "rounded-xl",
                          startAdornment: (
                            <Mail size={18} className="mr-2 text-gray-400" />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label={t("fields.phone")}
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        variant="outlined"
                        className="bg-gray-50"
                        InputProps={{
                          className: "rounded-xl",
                          startAdornment: (
                            <Phone size={18} className="mr-2 text-gray-400" />
                          ),
                        }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label={t("fields.jobTitle")}
                        name="jobTitle"
                        value={formData.jobTitle}
                        onChange={handleChange}
                        placeholder={t("fields.jobTitlePlaceholder")}
                        variant="outlined"
                        className="bg-gray-50"
                        InputProps={{
                          className: "rounded-xl",
                          startAdornment: (
                            <Briefcase
                              size={18}
                              className="mr-2 text-gray-400"
                            />
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </div>

                <Divider />

                <div>
                  <Typography
                    variant="h6"
                    className="font-bold mb-2! flex items-center gap-2 text-red-600"
                  >
                    <Lock size={20} /> {t("security")}
                  </Typography>
                  <Typography variant="body2" className="text-gray-500 mb-4!">
                    {t("fields.passwordHint")}
                  </Typography>
                  <TextField
                    fullWidth
                    label={t("fields.password")}
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    variant="outlined"
                    className="bg-gray-50"
                    InputProps={{ className: "rounded-xl" }}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isSaving}
                    startIcon={
                      isSaving ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Save size={20} />
                      )
                    }
                    className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-xl normal-case text-lg shadow-none"
                  >
                    {isSaving ? t("buttons.saving") : t("buttons.save")}
                  </Button>
                </div>
              </div>
            </Paper>
          </Grid>
        </Grid>
      </form>
    </div>
  );
}
