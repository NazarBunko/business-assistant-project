"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
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
  FormGroup,
  FormControlLabel,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  IconButton,
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
  Calculator,
  Trash2,
} from "lucide-react";
import { API_URL } from "../../../../config/api";
import { getApiErrorMessage } from "../../../../lib/api-error-message";

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
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [salarySummary, setSalarySummary] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTrans, setNewTrans] = useState({
    amount: "",
    type: "EXPENSE",
    category: "",
    description: "",
  });

  const [taxAvailableMonths, setTaxAvailableMonths] = useState<string[]>([]);
  const [taxSelectedMonths, setTaxSelectedMonths] = useState<string[]>([]);
  const [taxResult, setTaxResult] = useState<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    taxAmount: number;
    taxRate: number;
    periodLabel: string;
    esvAmount?: number;
    incomeTaxAmount?: number;
  } | null>(null);
  const [taxCalculating, setTaxCalculating] = useState(false);
  const [taxPaying, setTaxPaying] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState(false);

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
        `${API_URL}/transactions?companyId=${companyId}&page=${page}&archived=${isArchived}`
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
      const res = await fetch(`${API_URL}/company/${companyId}`);
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

  const fetchSalarySummary = async () => {
    try {
      const res = await fetch(`${API_URL}/company/employees/salary-summary`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSalarySummary(data.totalMonthlySalary ?? 0);
      }
    } catch {
      setSalarySummary(null);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!isLoading) fetchSalarySummary();
  }, [isLoading]);

  useEffect(() => {
    if (tab === 0) fetchTransactions(false);
    if (tab === 1) fetchTransactions(true);
  }, [tab, page]);

  const fetchTaxAvailableMonths = async () => {
    try {
      const res = await fetch(`${API_URL}/company/tax/available-months`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setTaxAvailableMonths(Array.isArray(data) ? data : []);
      }
    } catch {
      setTaxAvailableMonths([]);
    }
  };

  useEffect(() => {
    if (tab === 0) fetchTaxAvailableMonths();
  }, [tab]);

  const formatMonthLabel = (ym: string) => {
    const [y = 0, m = 1] = ym.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("uk-UA", { month: "long", year: "numeric" });
  };

  const handleTaxMonthToggle = (month: string) => {
    setTaxSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((x) => x !== month) : [...prev, month].sort()
    );
    setTaxResult(null);
  };

  const handleCalculateTax = async () => {
    if (taxSelectedMonths.length === 0) return;
    setTaxCalculating(true);
    setTaxResult(null);
    try {
      const res = await fetch(`${API_URL}/company/tax/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ months: taxSelectedMonths }),
      });
      if (res.ok) {
        const data = await res.json();
        setTaxResult(data);
      }
    } catch {
      setTaxResult(null);
    } finally {
      setTaxCalculating(false);
    }
  };

  const handlePayTax = async () => {
    if (!taxResult || taxResult.taxAmount <= 0) return;
    setTaxPaying(true);
    try {
      const res = await fetch(`${API_URL}/company/tax/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          amount: taxResult.taxAmount,
          periodLabel: taxResult.periodLabel,
          months: taxSelectedMonths,
        }),
      });
      if (res.ok) {
        setTaxResult(null);
        setTaxSelectedMonths([]);
        fetchTransactions(false);
        fetchSettings();
        enqueueSnackbar(t("tax.paySuccess"), { variant: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        enqueueSnackbar(getApiErrorMessage(data.message, t) || data.message || t("tax.payError"), { variant: "error" });
      }
    } catch {
      enqueueSnackbar(t("tax.payError"), { variant: "error" });
    } finally {
      setTaxPaying(false);
    }
  };

  const currentMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };
  const canPayTaxForSelectedMonths = taxSelectedMonths.length > 0 && !taxSelectedMonths.includes(currentMonthStr());

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    setDeletingTransaction(true);
    try {
      const res = await fetch(`${API_URL}/transactions/${transactionToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setTransactionToDelete(null);
        fetchTransactions(tab === 1);
        fetchSettings();
        enqueueSnackbar(t("table.deleteSuccess"), { variant: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        enqueueSnackbar(getApiErrorMessage(data.message, t) || data.message || t("table.deleteError"), { variant: "error" });
      }
    } catch {
      enqueueSnackbar(t("table.deleteError"), { variant: "error" });
    } finally {
      setDeletingTransaction(false);
    }
  };

  const handleArchive = async () => {
    await fetch(`${API_URL}/transactions/archive`, {
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
    await fetch(`${API_URL}/transactions?companyId=${companyId}`, {
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
    await fetch(`${API_URL}/transactions/generate-recurring`, {
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
        `${API_URL}/company/${companyId}/settings`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(companySettings),
        }
      );
      if (res.ok) {
        enqueueSnackbar(t("alerts.saved"), { variant: "success" });
        fetchSettings();
      } else {
        const data = await res.json().catch(() => ({}));
        enqueueSnackbar(data.message || t("alerts.loadError"), { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("alerts.loadError"), { variant: "error" });
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
          {salarySummary != null && salarySummary > 0 && (
            <Chip
              label={`${t("salarySummary")}: ${salarySummary} ₴`}
              variant="outlined"
              className="font-medium text-base"
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
                <>
                  <Paper variant="outlined" className="p-4! rounded-xl">
                    <Typography variant="h6" className="font-bold flex items-center gap-2! mb-1!">
                      <Calculator size={20} /> {t("tax.title")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" className="mb-3!">
                      {t("tax.subtitle")}
                    </Typography>
                    {taxAvailableMonths.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        {t("tax.noMonths")}
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="subtitle2" className="mb-2!">
                          {t("tax.selectMonths")}
                        </Typography>
                        <FormGroup row className="gap-2! mb-3!">
                          {taxAvailableMonths.map((ym) => (
                            <FormControlLabel
                              key={ym}
                              control={
                                <Checkbox
                                  size="small"
                                  checked={taxSelectedMonths.includes(ym)}
                                  onChange={() => handleTaxMonthToggle(ym)}
                                />
                              }
                              label={formatMonthLabel(ym)}
                            />
                          ))}
                        </FormGroup>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={handleCalculateTax}
                          disabled={taxCalculating || taxSelectedMonths.length === 0}
                          startIcon={taxCalculating ? <CircularProgress size={16} /> : <Calculator size={16} />}
                        >
                          {taxCalculating ? "..." : t("tax.calculate")}
                        </Button>
                        {taxResult && (
                          <Box className="mt-4! p-3! bg-gray-50 rounded-lg">
                            <Typography variant="subtitle2">{t("tax.period")}: {taxResult.periodLabel}</Typography>
                            <Typography variant="body2">{t("tax.totalIncome")}: {taxResult.totalIncome} ₴</Typography>
                            <Typography variant="body2">{t("tax.totalExpenses")}: {taxResult.totalExpenses} ₴</Typography>
                            <Typography variant="body2" className="font-medium">{t("tax.netProfit")}: {taxResult.netProfit} ₴</Typography>
                            {taxResult.esvAmount != null && (
                              <Typography variant="body2">{t("tax.esvAmount")}: {taxResult.esvAmount} ₴</Typography>
                            )}
                            {taxResult.incomeTaxAmount != null && (
                              <Typography variant="body2">{t("tax.incomeTaxAmount")} ({taxResult.taxRate}%): {taxResult.incomeTaxAmount} ₴</Typography>
                            )}
                            {taxResult.esvAmount == null && <Typography variant="body2">{t("tax.taxRate")}: {taxResult.taxRate}%</Typography>}
                            <Typography variant="h6" className="font-bold mt-2!">{t("tax.taxAmount")}: {taxResult.taxAmount} ₴</Typography>
                            {!canPayTaxForSelectedMonths && taxSelectedMonths.length > 0 && (
                              <Typography variant="caption" color="text.secondary" className="block mt-1!">
                                {t("tax.cannotPayCurrentMonth")}
                              </Typography>
                            )}
                            <Button
                              variant="contained"
                              size="small"
                              className="mt-2! bg-black"
                              onClick={handlePayTax}
                              disabled={taxPaying || taxResult.taxAmount <= 0 || !canPayTaxForSelectedMonths}
                            >
                              {taxPaying ? "..." : t("tax.pay")}
                            </Button>
                          </Box>
                        )}
                      </>
                    )}
                  </Paper>
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
                </>
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
                      {tab === 0 && <TableCell align="right">{t("table.delete")}</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={tab === 0 ? 7 : 6}
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
                          {tab === 0 && (
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setTransactionToDelete(transaction)}
                                title={t("table.delete")}
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Dialog open={!!transactionToDelete} onClose={() => setTransactionToDelete(null)}>
                <DialogTitle>{t("table.deleteTitle")}</DialogTitle>
                <DialogContent>
                  <DialogContentText>
                    {t("table.deleteConfirm")}
                  </DialogContentText>
                </DialogContent>
                <DialogActions>
                  <Button onClick={() => setTransactionToDelete(null)}>{t("buttons.cancel")}</Button>
                  <Button color="error" variant="contained" onClick={handleDeleteTransaction} disabled={deletingTransaction}>
                    {deletingTransaction ? "..." : t("table.deleteConfirmButton")}
                  </Button>
                </DialogActions>
              </Dialog>

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
                        placeholder="0"
                        value={companySettings.rentAmount === 0 ? "" : companySettings.rentAmount}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            rentAmount: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label={t("settings.utilitiesLabel")}
                        type="number"
                        placeholder="0"
                        value={companySettings.utilitiesAmount === 0 ? "" : companySettings.utilitiesAmount}
                        onChange={(e) =>
                          setCompanySettings({
                            ...companySettings,
                            utilitiesAmount: Number(e.target.value) || 0,
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
