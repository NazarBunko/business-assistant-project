"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from "@mui/material";
import { UserX, Pencil, Banknote, History, Gift } from "lucide-react";
import { API_URL } from "../../../../config/api";
import { getApiErrorMessage } from "../../../../lib/api-error-message";

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  jobTitle: string | null;
  monthlySalary: number | null;
  includeInAutoPay: boolean;
  lastSalaryPaidAt: string | null;
}

interface SalaryPaymentItem {
  id: string;
  amount: number;
  type: string;
  paidAt: string;
}

export default function EmployeesPage() {
  const t = useTranslations("Employees");
  const tCommon = useTranslations("Common.errors");
  const tRaw = useTranslations();
  const { enqueueSnackbar } = useSnackbar();

  const [list, setList] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<Employee | null>(null);
  const [removing, setRemoving] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ jobTitle: "", monthlySalary: "" as string | number, includeInAutoPay: false });
  const [updating, setUpdating] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filterAutoPayOnly, setFilterAutoPayOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "salaryAsc" | "salaryDesc">("name");
  const [salarySummary, setSalarySummary] = useState<number | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [historyList, setHistoryList] = useState<SalaryPaymentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [bonusTarget, setBonusTarget] = useState<Employee | null>(null);
  const [bonusAmount, setBonusAmount] = useState("");
  const [bonusSubmitting, setBonusSubmitting] = useState(false);
  const [employeeToPay, setEmployeeToPay] = useState<Employee | null>(null);

  const showError = useCallback(
    (message: string) => {
      enqueueSnackbar(getApiErrorMessage(message, tRaw), {
        variant: "error",
      });
    },
    [enqueueSnackbar, tRaw]
  );

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/company/employees`, {
        credentials: "include",
      });
      if (!res.ok) {
        if (res.status === 403) {
          showError("Forbidden");
        } else {
          const data = await res.json().catch(() => ({}));
          showError(data.message || t("removeError"));
        }
        setList([]);
        return;
      }
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch {
      showError(tCommon("networkError"));
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [showError, t, tCommon]);

  const fetchSalarySummary = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (raw) {
      try {
        const u = JSON.parse(raw);
        setUserRole(u?.role ?? null);
      } catch {
        setUserRole(null);
      }
    }
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!loading && list.length >= 0) fetchSalarySummary();
  }, [loading, list.length, fetchSalarySummary]);

  const canEdit = userRole === "OWNER" || userRole === "ADMIN";

  const filteredAndSortedList = useMemo(() => {
    const result = filterAutoPayOnly
      ? list.filter((e) => e.includeInAutoPay)
      : [...list];
    if (sortBy === "name") {
      result.sort((a, b) => a.fullName.localeCompare(b.fullName));
    } else if (sortBy === "salaryAsc") {
      result.sort(
        (a, b) => (a.monthlySalary ?? 0) - (b.monthlySalary ?? 0)
      );
    } else {
      result.sort(
        (a, b) => (b.monthlySalary ?? 0) - (a.monthlySalary ?? 0)
      );
    }
    return result;
  }, [list, filterAutoPayOnly, sortBy]);

  const handleHistoryOpen = useCallback(
    async (employee: Employee) => {
      setHistoryEmployee(employee);
      setHistoryLoading(true);
      setHistoryList([]);
      try {
        const res = await fetch(
          `${API_URL}/company/employees/${employee.id}/salary-history`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setHistoryList(Array.isArray(data) ? data : []);
        } else {
          showError(t("payError"));
        }
      } catch {
        showError(tCommon("networkError"));
      } finally {
        setHistoryLoading(false);
      }
    },
    [showError, t, tCommon]
  );
  const handleHistoryClose = () => setHistoryEmployee(null);

  const handleBonusOpen = (employee: Employee) => {
    setBonusTarget(employee);
    setBonusAmount("");
  };
  const handleBonusClose = () => {
    if (!bonusSubmitting) setBonusTarget(null);
  };
  const handleBonusSubmit = async () => {
    if (!bonusTarget) return;
    const amount = Number(bonusAmount);
    if (isNaN(amount) || amount <= 0) {
      showError(t("bonusError"));
      return;
    }
    setBonusSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/company/employees/${bonusTarget.id}/pay-bonus`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || t("bonusError"));
        return;
      }
      setBonusTarget(null);
      enqueueSnackbar(t("bonusSuccess"), { variant: "success" });
      await fetchEmployees();
      fetchSalarySummary();
    } catch {
      showError(t("bonusError"));
    } finally {
      setBonusSubmitting(false);
    }
  };

  const handleRemoveClick = (employee: Employee) => setRemoveTarget(employee);
  const handleRemoveClose = () => {
    if (!removing) setRemoveTarget(null);
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(
        `${API_URL}/company/employees/${removeTarget.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || t("removeError"));
        return;
      }
      setRemoveTarget(null);
      enqueueSnackbar(t("removeSuccess"), { variant: "success" });
      await fetchEmployees();
    } catch {
      showError(t("removeError"));
    } finally {
      setRemoving(false);
    }
  };

  const handleEditOpen = (employee: Employee) => {
    setEditTarget(employee);
    setEditForm({
      jobTitle: employee.jobTitle ?? "",
      monthlySalary: employee.monthlySalary ?? "",
      includeInAutoPay: employee.includeInAutoPay,
    });
  };
  const handleEditClose = () => {
    if (!updating) setEditTarget(null);
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setUpdating(true);
    try {
      const payload: { jobTitle?: string; monthlySalary?: number | null; includeInAutoPay?: boolean } = {
        jobTitle: editForm.jobTitle || undefined,
        monthlySalary: editForm.monthlySalary === "" ? null : Number(editForm.monthlySalary),
        includeInAutoPay: editForm.includeInAutoPay,
      };
      if (payload.monthlySalary !== null && (isNaN(payload.monthlySalary as number) || (payload.monthlySalary as number) < 0)) {
        showError(t("updateError"));
        return;
      }
      const res = await fetch(`${API_URL}/company/employees/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || t("updateError"));
        return;
      }
      setEditTarget(null);
      enqueueSnackbar(t("updateSuccess"), { variant: "success" });
      await fetchEmployees();
    } catch {
      showError(t("updateError"));
    } finally {
      setUpdating(false);
    }
  };

  const handleAutoPayToggle = async (employee: Employee) => {
    if (!employee.monthlySalary || employee.monthlySalary <= 0) return;
    try {
      const res = await fetch(`${API_URL}/company/employees/${employee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ includeInAutoPay: !employee.includeInAutoPay }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || t("updateError"));
        return;
      }
      enqueueSnackbar(t("updateSuccess"), { variant: "success" });
      await fetchEmployees();
    } catch {
      showError(t("updateError"));
    }
  };

  const handlePay = async (employee: Employee): Promise<boolean> => {
    if (!employee.monthlySalary || employee.monthlySalary <= 0) {
      showError(t("noSalarySet"));
      return false;
    }
    setPayingId(employee.id);
    try {
      const res = await fetch(
        `${API_URL}/company/employees/${employee.id}/pay-salary`,
        { method: "POST", credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || t("payError"));
        return false;
      }
      enqueueSnackbar(t("paySuccess"), { variant: "success" });
      await fetchEmployees();
      return true;
    } catch {
      showError(t("payError"));
      return false;
    } finally {
      setPayingId(null);
    }
  };

  const onConfirmPay = async () => {
    if (!employeeToPay) return;
    const ok = await handlePay(employeeToPay);
    if (ok) setEmployeeToPay(null);
  };

  const formatLastPaid = (dateStr: string | null) => {
    if (!dateStr) return t("never");
    const d = new Date(dateStr);
    return d.toLocaleDateString();
  };

  const columnsCount = canEdit ? 8 : 5;

  return (
    <div className="max-w-7xl mx-auto p-6! space-y-6!">
      <Typography variant="h4" className="font-bold text-gray-800" sx={{ marginBottom: 3 }}>
        {t("title")}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ marginBottom: 4 }}>
        {t("subtitle")}
      </Typography>

      {salarySummary != null && salarySummary > 0 && (
        <Paper className="rounded-xl p-4 mb-4 bg-gray-50 border">
          <Typography variant="subtitle1" color="text.secondary">
            {t("summaryTitle")}
          </Typography>
          <Typography variant="h6" className="font-bold">
            {salarySummary} ₴
          </Typography>
        </Paper>
      )}

      <Paper className="rounded-2xl overflow-hidden">
        <div className="p-6">
          {!loading && list.length > 0 && (
            <Box className="flex flex-wrap items-center gap-4 mb-4">
              <FormControl size="small" className="min-w-[180px]">
                <InputLabel>{t("sortBy")}</InputLabel>
                <Select
                  value={sortBy}
                  label={t("sortBy")}
                  onChange={(e) =>
                    setSortBy(e.target.value as "name" | "salaryAsc" | "salaryDesc")
                  }
                >
                  <MenuItem value="name">{t("sortByName")}</MenuItem>
                  <MenuItem value="salaryAsc">{t("sortBySalaryAsc")}</MenuItem>
                  <MenuItem value="salaryDesc">{t("sortBySalaryDesc")}</MenuItem>
                </Select>
              </FormControl>
              <div className="flex items-center">
                <Checkbox
                  checked={filterAutoPayOnly}
                  onChange={(e) => setFilterAutoPayOnly(e.target.checked)}
                  size="small"
                />
                <Typography variant="body2">{t("filterAutoPayOnly")}</Typography>
              </div>
            </Box>
          )}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <CircularProgress />
            </div>
          ) : (
            <TableContainer component={Paper} elevation={0} className="border rounded-xl">
              <Table>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="px-6 py-4">{t("fullName")}</TableCell>
                    <TableCell className="px-6 py-4">{t("email")}</TableCell>
                    <TableCell className="px-6 py-4">{t("phone")}</TableCell>
                    <TableCell className="px-6 py-4">{t("jobTitle")}</TableCell>
                    <TableCell className="px-6 py-4">{t("salary")}</TableCell>
                    {canEdit && (
                      <>
                        <TableCell className="px-6 py-4">{t("autoPay")}</TableCell>
                        <TableCell className="px-6 py-4">{t("lastPaid")}</TableCell>
                        <TableCell className="px-6 py-4" align="right" />
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAndSortedList.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columnsCount}
                        align="center"
                        className="py-8 text-gray-500"
                      >
                        {filterAutoPayOnly ? t("listEmpty") : t("listEmpty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedList.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell className="px-6 py-3">{row.fullName}</TableCell>
                        <TableCell className="px-6 py-3">{row.email}</TableCell>
                        <TableCell className="px-6 py-3">{row.phone}</TableCell>
                        <TableCell className="px-6 py-3">{row.jobTitle ?? "—"}</TableCell>
                        <TableCell className="px-6 py-3">
                          {row.monthlySalary != null && row.monthlySalary > 0
                            ? `${row.monthlySalary} ₴`
                            : "—"}
                        </TableCell>
                        {canEdit && (
                          <>
                            <TableCell className="px-6 py-3">
                              {row.monthlySalary != null && row.monthlySalary > 0 ? (
                                <Checkbox
                                  checked={row.includeInAutoPay}
                                  onChange={() => handleAutoPayToggle(row)}
                                  size="small"
                                />
                              ) : "—"}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-gray-500 text-sm">
                              {formatLastPaid(row.lastSalaryPaidAt)}
                            </TableCell>
                            <TableCell className="px-6 py-3" align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleHistoryOpen(row)}
                                title={t("history")}
                              >
                                <History size={16} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleEditOpen(row)}
                                title={t("edit")}
                              >
                                <Pencil size={16} />
                              </IconButton>
                              {canEdit && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleBonusOpen(row)}
                                  title={t("payBonus")}
                                >
                                  <Gift size={16} />
                                </IconButton>
                              )}
                              {row.monthlySalary != null && row.monthlySalary > 0 && (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => setEmployeeToPay(row)}
                                  disabled={!!payingId}
                                  title={t("pay")}
                                >
                                  {payingId === row.id ? (
                                    <CircularProgress size={16} />
                                  ) : (
                                    <Banknote size={16} />
                                  )}
                                </IconButton>
                              )}
                              {row.role !== "OWNER" && (
                                <IconButton
                                  color="error"
                                  size="small"
                                  onClick={() => handleRemoveClick(row)}
                                  title={t("remove")}
                                >
                                  <UserX size={18} />
                                </IconButton>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </div>
      </Paper>

      <Dialog open={!!removeTarget} onClose={handleRemoveClose}>
        <DialogTitle>{t("remove")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("removeConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveClose} disabled={removing}>
            {t("cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleRemoveConfirm}
            disabled={removing}
          >
            {removing ? t("submitting") : t("remove")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!employeeToPay} onClose={() => setEmployeeToPay(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t("payConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {employeeToPay &&
              t("payConfirmMessage", {
                name: employeeToPay.fullName,
                amount: employeeToPay.monthlySalary ?? 0,
              })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmployeeToPay(null)} disabled={!!payingId}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={onConfirmPay}
            disabled={!!payingId || !employeeToPay?.monthlySalary || employeeToPay.monthlySalary <= 0}
          >
            {payingId ? t("submitting") : t("pay")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!editTarget} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t("editEmployee")}</DialogTitle>
        <DialogContent className="flex flex-col gap-4">
          <Box/>
          <TextField
            label={t("jobTitle")}
            fullWidth
            value={editForm.jobTitle}
            onChange={(e) => setEditForm((f) => ({ ...f, jobTitle: e.target.value }))}
            placeholder={t("jobTitlePlaceholder")}
          />
          <TextField
            label={t("salary")}
            type="number"
            fullWidth
            inputProps={{ min: 0, step: 100 }}
            value={editForm.monthlySalary}
            onChange={(e) => setEditForm((f) => ({ ...f, monthlySalary: e.target.value }))}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              checked={editForm.includeInAutoPay}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, includeInAutoPay: e.target.checked }))
              }
              disabled={editForm.monthlySalary === "" || Number(editForm.monthlySalary) <= 0}
            />
            <Typography variant="body2">{t("autoPay")}</Typography>
          </div>
        </DialogContent>
        <DialogActions sx={{ gap: 1 }}>
          <Button variant="outlined" onClick={handleEditClose} disabled={updating}>
            {t("cancel")}
          </Button>
          <Button variant="contained" onClick={handleEditSave} disabled={updating}>
            {updating ? t("submitting") : t("save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!historyEmployee} onClose={handleHistoryClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t("history")}
          {historyEmployee && ` — ${historyEmployee.fullName}`}
        </DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <div className="flex justify-center py-6">
              <CircularProgress />
            </div>
          ) : historyList.length === 0 ? (
            <Typography color="text.secondary">{t("historyEmpty")}</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t("date")}</TableCell>
                    <TableCell>{t("amount")}</TableCell>
                    <TableCell>{t("typeLabel")}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {historyList.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.paidAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{item.amount} ₴</TableCell>
                      <TableCell>
                        {item.type === "BONUS"
                          ? t("paymentTypeBonus")
                          : t("paymentTypeSalary")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHistoryClose}>{t("cancel")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!bonusTarget} onClose={handleBonusClose} maxWidth="xs" fullWidth>
        <DialogTitle>{t("payBonus")}</DialogTitle>
        <DialogContent className="pt-4">
          {bonusTarget && (
            <Typography variant="body2" color="text.secondary" className="mb-2">
              {bonusTarget.fullName}
            </Typography>
          )}
          <TextField
            label={t("bonusAmount")}
            type="number"
            fullWidth
            inputProps={{ min: 1, step: 100 }}
            value={bonusAmount}
            onChange={(e) => setBonusAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBonusClose} disabled={bonusSubmitting}>
            {t("cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={handleBonusSubmit}
            disabled={bonusSubmitting || !bonusAmount}
          >
            {bonusSubmitting ? t("submitting") : t("payBonus")}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
