"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  MessageCircle,
  Send,
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
  const { enqueueSnackbar } = useSnackbar();
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

  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

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
      try {
        const res = await fetch(
          `${API_URL}/user/profile`,
          {
            credentials: "include",
          }
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

    const payload: any = { ...formData };
    if (!payload.password) delete payload.password;

    try {
      const res = await fetch(
        `${API_URL}/user/profile`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "include",
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

  const handleSendSupport = async () => {
    if (!supportMessage.trim()) {
      enqueueSnackbar(t("supportMessageRequired") || "Message is required", { variant: "warning" });
      return;
    }

    setSendingSupport(true);
    try {
      const res = await fetch(`${API_URL}/support/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: supportMessage }),
      });

      if (res.ok) {
        enqueueSnackbar(t("supportSent") || "Support request sent successfully", { variant: "success" });
        setSupportMessage("");
        setSupportDialogOpen(false);
      } else {
        const errorData = await res.json().catch(() => ({}));
        enqueueSnackbar(errorData.message || t("supportError") || "Failed to send support request", { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("supportError") || "Failed to send support request", { variant: "error" });
    } finally {
      setSendingSupport(false);
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

            <Paper
              className="p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 bg-white"
              sx={{ mt: 2.5 }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <MessageCircle size={22} /> {t("supportTitle")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mb: 2,
                  lineHeight: 1.7,
                  display: "block",
                }}
              >
                {t("supportDescription")}
              </Typography>
              <Button
                variant="outlined"
                size="large"
                startIcon={<MessageCircle size={20} />}
                onClick={() => setSupportDialogOpen(true)}
                className="border-2 border-black text-black hover:bg-gray-50 px-6 py-3 rounded-xl normal-case text-base shadow-none"
              >
                {t("supportButton")}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </form>

      <Dialog
        open={supportDialogOpen}
        onClose={() => !sendingSupport && setSupportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ className: "rounded-2xl" }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {t("supportDialogTitle")}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 0 }}>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 2,
              lineHeight: 1.7,
              display: "block",
            }}
          >
            {t("supportDialogDescription")}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            label={t("supportMessageLabel")}
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder={t("supportMessagePlaceholder")}
            variant="outlined"
            className="bg-gray-50"
            InputProps={{ className: "rounded-xl" }}
            inputProps={{ maxLength: 2000 }}
            helperText={`${supportMessage.length}/2000`}
          />
        </DialogContent>
        <DialogActions sx={{ px: 1.5, pt: 1.5, pb: 1.5 }}>
          <Button
            onClick={() => setSupportDialogOpen(false)}
            disabled={sendingSupport}
            className="normal-case"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            variant="contained"
            onClick={handleSendSupport}
            disabled={sendingSupport || !supportMessage.trim()}
            startIcon={
              sendingSupport ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Send size={18} />
              )
            }
            className="bg-black hover:bg-gray-800 text-white normal-case shadow-none"
          >
            {sendingSupport ? (t("sending") || "Sending...") : (t("send") || "Send")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
