"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  Plus,
  Archive,
  Settings,
  DollarSign,
  RefreshCw,
  FileText,
  Wallet,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category: string;
  description: string;
  date: string;
}

interface CompanySettings {
  inviteCode: string;
  revenueFrequency: string;
  taxGroup: string;
  rentAmount: number;
  utilitiesAmount: number;
  balance: number;
}

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const [tab, setTab] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTrans, setNewTrans] = useState({
    amount: "",
    type: "EXPENSE",
    category: "",
    description: "",
  });

  const getCompanyId = () => {
    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          return user.companyId || null;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const fetchTransactions = async (isArchived = false) => {
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      const res = await fetch(
        `http://localhost:3001/transactions?companyId=${companyId}&page=${page}&archived=${isArchived}`
      );
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.data || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSettings = async () => {
    const companyId = getCompanyId();

    if (!companyId) {
      setError(t("alerts.loadError"));
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/company/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        setCompanySettings(data);
      } else {
        setError(t("alerts.loadError"));
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (tab === 0) fetchTransactions(false);
    if (tab === 1) fetchTransactions(true);
  }, [tab, page]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleArchive = async () => {
    await fetch(`http://localhost:3001/transactions/archive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    setSelectedIds([]);
    fetchTransactions(tab === 1);
  };

  const handleCreateTransaction = async () => {
    const companyId = getCompanyId();
    if (!companyId) return;
    await fetch(`http://localhost:3001/transactions?companyId=${companyId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTrans, amount: Number(newTrans.amount) }),
    });
    setNewTrans({ amount: "", type: "EXPENSE", category: "", description: "" });
    fetchTransactions(false);
    fetchSettings();
  };

  const handleGenerateRecurring = async () => {
    const companyId = getCompanyId();
    if (!companyId) return;
    await fetch(`http://localhost:3001/transactions/generate-recurring`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId }),
    });
    fetchTransactions(false);
    fetchSettings();
  };

  const handleUpdateSettings = async () => {
    const companyId = getCompanyId();
    if (!companySettings || !companyId) return;
    try {
      const res = await fetch(
        `http://localhost:3001/company/${companyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companySettings),
        }
      );
      if (res.ok) {
        alert(t("alerts.saved"));
        fetchSettings();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center h-[50vh]! items-center">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6! space-y-6!">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4!">
          <Typography variant="h4" className="font-bold">
            {t("title")}
          </Typography>
          {companySettings && (
            <Chip
              icon={<Wallet size={16} />}
              label={`${t("balance")}: ${companySettings.balance} ₴`}
              className={`font-bold text-lg px-2! ${companySettings.balance >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            />
          )}
        </div>

        {companySettings?.inviteCode && (
          <Chip
            label={`${t("companyCode")}: ${companySettings.inviteCode}`}
            color="primary"
            variant="outlined"
            className="font-mono text-lg py-4!"
          />
        )}
      </div>

      {error && !companySettings && <Alert severity="error">{error}</Alert>}

      <Paper className="rounded-2xl overflow-hidden">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          className="bg-gray-50 border-b"
        >
          <Tab
            label={t("tabs.transactions")}
            icon={<DollarSign size={18} />}
            iconPosition="start"
          />
          <Tab
            label={t("tabs.archive")}
            icon={<Archive size={18} />}
            iconPosition="start"
          />
          <Tab
            label={t("tabs.settings")}
            icon={<Settings size={18} />}
            iconPosition="start"
          />
        </Tabs>

        <div className="p-6!">
          {(tab === 0 || tab === 1) && (
            <div className="space-y-4!">
              {tab === 0 && (
                <div className="flex gap-2! flex-wrap bg-gray-50 p-4! rounded-xl mb-4!">
                  <TextField
                    label={t("inputs.amount")}
                    size="small"
                    type="number"
                    value={newTrans.amount}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, amount: e.target.value })
                    }
                    className="bg-white"
                  />
                  <Select
                    size="small"
                    value={newTrans.type}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, type: e.target.value as any })
                    }
                    className="bg-white min-w-[120px]"
                  >
                    <MenuItem value="INCOME">{t("inputs.typeIncome")}</MenuItem>
                    <MenuItem value="EXPENSE">
                      {t("inputs.typeExpense")}
                    </MenuItem>
                  </Select>
                  <TextField
                    label={t("inputs.category")}
                    size="small"
                    value={newTrans.category}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, category: e.target.value })
                    }
                    className="bg-white"
                  />
                  <TextField
                    label={t("inputs.description")}
                    size="small"
                    value={newTrans.description}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, description: e.target.value })
                    }
                    className="bg-white flex-1"
                  />
                  <Button
                    variant="contained"
                    onClick={handleCreateTransaction}
                    startIcon={<Plus />}
                    className="bg-black"
                  >
                    {t("buttons.add")}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateRecurring}
                    startIcon={<RefreshCw />}
                  >
                    {t("buttons.autoPayments")}
                  </Button>
                </div>
              )}

              {selectedIds.length > 0 && tab === 0 && (
                <div className="bg-blue-50 p-2! rounded flex justify-between items-center px-4!">
                  <Typography variant="body2">
                    {selectedIds.length} {t("table.selected")}
                  </Typography>
                  <Button size="small" color="warning" onClick={handleArchive}>
                    {t("buttons.toArchive")}
                  </Button>
                </div>
              )}

              <TableContainer
                component={Paper}
                elevation={0}
                className="border"
              >
                <Table>
                  <TableHead className="bg-gray-100">
                    <TableRow>
                      <TableCell padding="checkbox">
                        {tab === 0 && <Checkbox disabled />}
                      </TableCell>
                      <TableCell>{t("table.date")}</TableCell>
                      <TableCell>{t("table.type")}</TableCell>
                      <TableCell>{t("table.category")}</TableCell>
                      <TableCell>{t("table.amount")}</TableCell>
                      <TableCell>{t("table.description")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          align="center"
                          className="py-8! text-gray-500"
                        >
                          {t("table.empty")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell padding="checkbox">
                            {tab === 0 && (
                              <Checkbox
                                checked={selectedIds.includes(transaction.id)}
                                onChange={() => handleSelect(transaction.id)}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                transaction.type === "INCOME"
                                  ? t("inputs.typeIncome")
                                  : t("inputs.typeExpense")
                              }
                              color={
                                transaction.type === "INCOME"
                                  ? "success"
                                  : "error"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell className="font-mono font-bold">
                            {transaction.amount} ₴
                          </TableCell>
                          <TableCell className="text-gray-500">
                            {transaction.description}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <div className="flex justify-center mt-4!">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => setPage(p)}
                />
              </div>
            </div>
          )}

          {tab === 2 && (
            <div className="max-w-2xl space-y-6!">
              {!companySettings ? (
                <Alert severity="warning">{t("alerts.loadError")}</Alert>
              ) : (
                <>
                  <Typography
                    variant="h6"
                    className="font-bold flex items-center gap-2!"
                  >
                    <FileText size={20} /> {t("settings.taxInfo")}
                  </Typography>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>{t("settings.taxType")}</InputLabel>
                        <Select
                          label={t("settings.taxType")}
                          value={companySettings.taxGroup}
                          onChange={(e) =>
                            setCompanySettings({
                              ...companySettings,
                              taxGroup: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="FOP_1">{t("enums.FOP_1")}</MenuItem>
                          <MenuItem value="FOP_2">{t("enums.FOP_2")}</MenuItem>
                          <MenuItem value="FOP_3_5PERCENT">
                            {t("enums.FOP_3_5PERCENT")}
                          </MenuItem>
                          <MenuItem value="FOP_3_3PERCENT">
                            {t("enums.FOP_3_3PERCENT")}
                          </MenuItem>
                          <MenuItem value="GENERAL">
                            {t("enums.GENERAL")}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel>
                          {t("settings.revenueFrequency")}
                        </InputLabel>
                        <Select
                          label={t("settings.revenueFrequency")}
                          value={companySettings.revenueFrequency}
                          onChange={(e) =>
                            setCompanySettings({
                              ...companySettings,
                              revenueFrequency: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="DAILY">{t("enums.DAILY")}</MenuItem>
                          <MenuItem value="MONTHLY">
                            {t("enums.MONTHLY")}
                          </MenuItem>
                          <MenuItem value="QUARTERLY">
                            {t("enums.QUARTERLY")}
                          </MenuItem>
                          <MenuItem value="YEARLY">
                            {t("enums.YEARLY")}
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  <Typography
                    variant="h6"
                    className="font-bold flex items-center gap-2!"
                  >
                    <RefreshCw size={20} /> {t("settings.autoPaymentsTitle")}
                  </Typography>
                  <Alert severity="info" className="mb-4!">
                    {t("alerts.autoPaymentsInfo")}
                  </Alert>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={t("settings.rentLabel")}
                        type="number"
                        value={companySettings.rentAmount}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            rentAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={t("settings.utilitiesLabel")}
                        type="number"
                        value={companySettings.utilitiesAmount}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            utilitiesAmount: Number(e.target.value),
                          })
                        }
                      />
                    </Grid>
                  </Grid>

                  <div className="pt-4!">
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleUpdateSettings}
                      className="bg-black"
                    >
                      {t("buttons.saveSettings")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
}
