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
  Eye,
  CheckCircle,
  Clock,
} from "lucide-react";
import { API_URL } from "../../../../config/api";
import { getApiErrorMessage } from "../../../../lib/api-error-message";

function toInvoiceNumber(value: unknown): number {
  if (value === "" || value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : 0;
}

function getInvoiceItemAmount(item: { quantity: unknown; unitPrice: unknown }): number {
  return toInvoiceNumber(item.quantity) * toInvoiceNumber(item.unitPrice);
}

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

  // Invoice states
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    paid: 0,
    overdue: 0,
    totalRevenue: 0,
    pendingAmount: 0,
  });
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("");
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [createInvoiceOpen, setCreateInvoiceOpen] = useState(false);
  const [viewInvoiceOpen, setViewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("");
  const [invoiceFormData, setInvoiceFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    dueDate: "",
    taxRate: "0",
    discount: "0",
    notes: "",
  });
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { description: "", quantity: "1", unitPrice: "0" },
  ]);

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
    try {
      const res = await fetch(
        `${API_URL}/transactions?page=${page}&archived=${isArchived}`,
        {
          credentials: "include",
        }
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
      const res = await fetch(`${API_URL}/company/${companyId}`, {
        credentials: "include",
      });
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
    if (tab === 1) fetchInvoices();
    if (tab === 2) fetchTransactions(true);
  }, [tab, page, invoicePage, invoiceStatusFilter]);

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
    if (tab === 1) {
      fetchInvoiceStats();
    }
  }, [tab]);

  // Invoice functions
  const fetchInvoices = async () => {
    try {
      const url = `${API_URL}/invoices?page=${invoicePage}${invoiceStatusFilter ? `&status=${invoiceStatusFilter}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.data);
        setInvoiceTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInvoiceStats = async () => {
    try {
      const res = await fetch(`${API_URL}/invoices/stats`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setInvoiceStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceFormData.clientName || invoiceItems.length === 0) {
      enqueueSnackbar(t("invoices.form.atLeastOneItem"), { variant: "error" });
      return;
    }

    const validItems = invoiceItems.filter(
      (item) =>
        item.description &&
        toInvoiceNumber(item.quantity) > 0 &&
        toInvoiceNumber(item.unitPrice) > 0
    );

    if (validItems.length === 0) {
      enqueueSnackbar(t("invoices.form.atLeastOneItem"), { variant: "error" });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceFormData,
          items: validItems.map((item) => ({
            description: item.description,
            quantity: toInvoiceNumber(item.quantity),
            unitPrice: toInvoiceNumber(item.unitPrice),
          })),
          taxRate: toInvoiceNumber(invoiceFormData.taxRate),
          discount: toInvoiceNumber(invoiceFormData.discount),
        }),
        credentials: "include",
      });

      if (res.ok) {
        enqueueSnackbar(t("invoices.messages.createSuccess"), { variant: "success" });
        setCreateInvoiceOpen(false);
        resetInvoiceForm();
        fetchInvoices();
        fetchInvoiceStats();
      } else {
        enqueueSnackbar(t("invoices.messages.createError"), { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("invoices.messages.createError"), { variant: "error" });
    }
  };

  const handleViewInvoice = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedInvoice(data);
        setViewInvoiceOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm(t("invoices.messages.deleteConfirm"))) return;

    try {
      const res = await fetch(`${API_URL}/invoices/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        enqueueSnackbar(t("invoices.messages.deleteSuccess"), { variant: "success" });
        fetchInvoices();
        fetchInvoiceStats();
      } else {
        enqueueSnackbar(t("invoices.messages.deleteError"), { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("invoices.messages.deleteError"), { variant: "error" });
    }
  };

  const handleUpdateInvoiceStatus = async (status: string) => {
    if (!selectedInvoice) return;

    try {
      const res = await fetch(
        `${API_URL}/invoices/${selectedInvoice.id}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
          credentials: "include",
        }
      );

      if (res.ok) {
        enqueueSnackbar(t("invoices.messages.updateSuccess"), { variant: "success" });
        setViewInvoiceOpen(false);
        fetchInvoices();
        fetchInvoiceStats();
      } else {
        enqueueSnackbar(t("invoices.messages.updateError"), { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("invoices.messages.updateError"), { variant: "error" });
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([
      ...invoiceItems,
      { description: "", quantity: "1", unitPrice: "0" },
    ]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const newItems = [...invoiceItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setInvoiceItems(newItems);
  };

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      clientAddress: "",
      dueDate: "",
      taxRate: "0",
      discount: "0",
      notes: "",
    });
    setInvoiceItems([{ description: "", quantity: "1", unitPrice: "0" }]);
  };

  const calculateInvoiceSubtotal = () => {
    return invoiceItems.reduce(
      (sum, item) => sum + getInvoiceItemAmount(item),
      0
    );
  };

  const calculateInvoiceTotal = () => {
    const subtotal = calculateInvoiceSubtotal();
    const taxRate = toInvoiceNumber(invoiceFormData.taxRate);
    const tax = subtotal * (taxRate / 100);
    const discount = toInvoiceNumber(invoiceFormData.discount);
    return subtotal + tax - discount;
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "success";
      case "SENT":
        return "info";
      case "OVERDUE":
        return "error";
      case "DRAFT":
        return "default";
      case "CANCELLED":
        return "default";
      default:
        return "default";
    }
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedInvoiceIds.length === 0 || !bulkStatus) return;

    try {
      await Promise.all(
        selectedInvoiceIds.map(id =>
          fetch(`${API_URL}/invoices/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkStatus }),
            credentials: "include",
          })
        )
      );

      enqueueSnackbar(t("invoices.messages.updateSuccess"), { variant: "success" });
      setBulkStatusDialogOpen(false);
      setSelectedInvoiceIds([]);
      setBulkStatus("");
      fetchInvoices();
      fetchInvoiceStats();
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("invoices.messages.updateError"), { variant: "error" });
    }
  };

  const handleQuickStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/invoices/${invoiceId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });

      if (res.ok) {
        enqueueSnackbar(t("invoices.messages.updateSuccess"), { variant: "success" });
        fetchInvoices();
        fetchInvoiceStats();
      } else {
        enqueueSnackbar(t("invoices.messages.updateError"), { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("invoices.messages.updateError"), { variant: "error" });
    }
  };

  const generateInvoicePDF = (invoice: any) => {
    // Create a simple HTML template for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .invoice-number { font-size: 24px; font-weight: bold; }
          .client-info { margin: 20px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .totals { margin-top: 20px; text-align: right; }
          .totals div { margin: 5px 0; }
          .total { font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="invoice-number">INVOICE ${invoice.invoiceNumber}</div>
          <div>Date: ${new Date(invoice.createdAt).toLocaleDateString()}</div>
          ${invoice.dueDate ? `<div>Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}</div>` : ''}
        </div>
        
        <div class="client-info">
          <strong>Bill To:</strong><br>
          ${invoice.clientName}<br>
          ${invoice.clientEmail || ''}<br>
          ${invoice.clientPhone || ''}<br>
          ${invoice.clientAddress || ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>Subtotal: $${invoice.subtotal.toFixed(2)}</div>
          ${invoice.taxAmount > 0 ? `<div>Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}</div>` : ''}
          ${invoice.discount > 0 ? `<div>Discount: -$${invoice.discount.toFixed(2)}</div>` : ''}
          <div class="total">Total: $${invoice.total.toFixed(2)}</div>
        </div>

        ${invoice.notes ? `<div style="margin-top: 30px;"><strong>Notes:</strong><br>${invoice.notes}</div>` : ''}
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

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
      credentials: "include",
      body: JSON.stringify({ ids: selectedIds }),
    });
    setSelectedIds([]);
    fetchTransactions(tab === 1);
  };

  const handleCreateTransaction = async () => {
    await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...newTrans, amount: Number(newTrans.amount) }),
    });
    setNewTrans({ amount: "", type: "EXPENSE", category: "", description: "" });
    fetchTransactions(false);
    fetchSettings();
  };

  const handleGenerateRecurring = async () => {
    await fetch(`${API_URL}/transactions/generate-recurring`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
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
          credentials: "include",
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
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6! space-y-4 sm:space-y-5 md:space-y-6!">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4!">
          <Typography className="font-bold text-2xl sm:text-3xl md:text-4xl">
            {t("title")}
          </Typography>
          {companySettings && (
            <Chip
              icon={<Wallet size={14} className="sm:w-4 sm:h-4" />}
              label={`${t("balance")}: ${companySettings.balance} ₴`}
              className={`font-bold text-xs sm:text-sm md:text-base px-2! ${companySettings.balance >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            />
          )}
          {salarySummary != null && salarySummary > 0 && (
            <Chip
              label={`${t("salarySummary")}: ${salarySummary} ₴`}
              variant="outlined"
              className="font-medium text-xs sm:text-sm"
            />
          )}
        </div>

        {companySettings?.inviteCode && (
          <Chip
            label={`${t("companyCode")}: ${companySettings.inviteCode}`}
            color="primary"
            variant="outlined"
            className="font-mono text-sm sm:text-base md:text-lg py-3 sm:py-4!"
          />
        )}
      </div>

      {error && !companySettings && <Alert severity="error">{error}</Alert>}

      <Paper className="rounded-xl sm:rounded-2xl overflow-hidden">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          className="bg-gray-50 border-b"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab
            label={t("tabs.transactions")}
            icon={<DollarSign size={16} className="sm:w-[18px] sm:h-[18px]" />}
            iconPosition="start"
            className="text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]"
          />
          <Tab
            label={t("tabs.invoices")}
            icon={<FileText size={16} className="sm:w-[18px] sm:h-[18px]" />}
            iconPosition="start"
            className="text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]"
          />
          <Tab
            label={t("tabs.archive")}
            icon={<Archive size={16} className="sm:w-[18px] sm:h-[18px]" />}
            iconPosition="start"
            className="text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]"
          />
          <Tab
            label={t("tabs.settings")}
            icon={<Settings size={16} className="sm:w-[18px] sm:h-[18px]" />}
            iconPosition="start"
            className="text-xs sm:text-sm min-w-[100px] sm:min-w-[140px]"
          />
        </Tabs>

        <div className="p-3 sm:p-4 md:p-6!">
          {(tab === 0 || tab === 2) && (
            <div className="space-y-3 sm:space-y-4!">
              {tab === 0 && (
                <>
                  <Paper variant="outlined" className="p-3 sm:p-4! rounded-lg sm:rounded-xl">
                    <Typography className="font-bold flex items-center gap-2! mb-1! text-base sm:text-lg md:text-xl">
                      <Calculator size={18} className="sm:w-5 sm:h-5" /> {t("tax.title")}
                    </Typography>
                    <Typography className="mb-3! text-xs sm:text-sm" color="text.secondary">
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
                  <div className="flex flex-col sm:flex-row gap-2! flex-wrap bg-gray-50 p-3 sm:p-4! rounded-lg sm:rounded-xl mb-3 sm:mb-4!">
                  <TextField
                    label={t("inputs.amount")}
                    size="small"
                    type="number"
                    value={newTrans.amount}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, amount: e.target.value })
                    }
                    className="bg-white w-full sm:w-auto sm:flex-1 sm:min-w-[120px]"
                    InputProps={{ className: "text-sm" }}
                  />
                  <Select
                    size="small"
                    value={newTrans.type}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, type: e.target.value as any })
                    }
                    className="bg-white w-full sm:w-auto sm:min-w-[120px] text-sm"
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
                    className="bg-white w-full sm:w-auto sm:flex-1 sm:min-w-[120px]"
                    InputProps={{ className: "text-sm" }}
                  />
                  <TextField
                    label={t("inputs.description")}
                    size="small"
                    value={newTrans.description}
                    onChange={(e) =>
                      setNewTrans({ ...newTrans, description: e.target.value })
                    }
                    className="bg-white w-full sm:flex-1"
                    InputProps={{ className: "text-sm" }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleCreateTransaction}
                    startIcon={<Plus size={16} />}
                    className="bg-black w-full sm:w-auto text-sm"
                    size="small"
                  >
                    {t("buttons.add")}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateRecurring}
                    startIcon={<RefreshCw size={16} />}
                    className="w-full sm:w-auto text-sm"
                    size="small"
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

          {tab === 1 && (
            <div className="space-y-3 sm:space-y-4!">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4!">
                <div>
                  <Typography className="font-bold text-gray-900 text-lg sm:text-xl md:text-2xl">
                    {t("invoices.title")}
                  </Typography>
                  <Typography className="text-gray-500 text-xs sm:text-sm">{t("invoices.subtitle")}</Typography>
                </div>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} className="sm:w-5 sm:h-5" />}
                  onClick={() => setCreateInvoiceOpen(true)}
                  className="bg-black hover:bg-gray-800 text-white rounded-lg sm:rounded-xl normal-case shadow-none text-sm sm:text-base"
                  size="medium"
                >
                  {t("invoices.createInvoice")}
                </Button>
              </div>

              <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} className="mb-3 sm:mb-4!">
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper className="p-3 sm:p-4! rounded-lg sm:rounded-xl border border-gray-200">
                    <Box className="flex items-center justify-between mb-1 sm:mb-2!">
                      <FileText size={20} className="text-blue-600 sm:w-6 sm:h-6" />
                    </Box>
                    <Typography className="font-bold text-gray-900 mb-1! text-xl sm:text-2xl md:text-3xl">
                      {invoiceStats.total}
                    </Typography>
                    <Typography className="text-gray-500 text-xs sm:text-sm">
                      {t("invoices.stats.totalInvoices")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper className="p-3 sm:p-4! rounded-lg sm:rounded-xl border border-gray-200">
                    <Box className="flex items-center justify-between mb-1 sm:mb-2!">
                      <DollarSign size={20} className="text-green-600 sm:w-6 sm:h-6" />
                    </Box>
                    <Typography className="font-bold text-gray-900 mb-1! text-base sm:text-lg md:text-xl">
                      ${invoiceStats.totalRevenue.toFixed(2)}
                    </Typography>
                    <Typography className="text-gray-500 text-xs sm:text-sm">
                      {t("invoices.stats.totalRevenue")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper className="p-3 sm:p-4! rounded-lg sm:rounded-xl border border-gray-200">
                    <Box className="flex items-center justify-between mb-1 sm:mb-2!">
                      <Clock size={20} className="text-orange-600 sm:w-6 sm:h-6" />
                    </Box>
                    <Typography className="font-bold text-gray-900 mb-1! text-base sm:text-lg md:text-xl">
                      ${invoiceStats.pendingAmount.toFixed(2)}
                    </Typography>
                    <Typography className="text-gray-500 text-xs sm:text-sm">
                      {t("invoices.stats.pendingAmount")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper className="p-3 sm:p-4! rounded-lg sm:rounded-xl border border-gray-200">
                    <Box className="flex items-center justify-between mb-1 sm:mb-2!">
                      <CheckCircle size={20} className="text-emerald-600 sm:w-6 sm:h-6" />
                    </Box>
                    <Typography className="font-bold text-gray-900 mb-1! text-xl sm:text-2xl md:text-3xl">
                      {invoiceStats.paid}
                    </Typography>
                    <Typography className="text-gray-500 text-xs sm:text-sm">
                      {t("invoices.stats.paidInvoices")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper className="p-2 sm:p-3! rounded-lg sm:rounded-xl border border-gray-200 mb-3 sm:mb-4!">
                <FormControl size="small" fullWidth sx={{ maxWidth: { xs: '100%', sm: 200 } }}>
                  <InputLabel className="text-sm">{t("invoices.status")}</InputLabel>
                  <Select
                    value={invoiceStatusFilter}
                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                    label={t("invoices.status")}
                    className="rounded-lg sm:rounded-xl bg-white text-sm"
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="DRAFT">{t("invoices.draft")}</MenuItem>
                    <MenuItem value="SENT">{t("invoices.sent")}</MenuItem>
                    <MenuItem value="PAID">{t("invoices.paid")}</MenuItem>
                    <MenuItem value="OVERDUE">{t("invoices.overdue")}</MenuItem>
                    <MenuItem value="CANCELLED">{t("invoices.cancelled")}</MenuItem>
                  </Select>
                </FormControl>
              </Paper>

              {selectedInvoiceIds.length > 0 && (
                <Paper className="p-4! bg-blue-50 border border-blue-200 rounded-xl mb-4! flex items-center justify-between">
                  <Typography variant="body2">
                    {selectedInvoiceIds.length} {t("table.selected")}
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setBulkStatusDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Update Status
                  </Button>
                </Paper>
              )}

              <TableContainer component={Paper} className="rounded-lg sm:rounded-xl border border-gray-200 overflow-x-auto">
                <Table size="small" className="sm:table"  sx={{ minWidth: { xs: 600, md: 'auto' } }}>
                  <TableHead className="bg-gray-50">
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={invoices.length > 0 && selectedInvoiceIds.length === invoices.length}
                          indeterminate={selectedInvoiceIds.length > 0 && selectedInvoiceIds.length < invoices.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoiceIds(invoices.map(inv => inv.id));
                            } else {
                              setSelectedInvoiceIds([]);
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-bold">{t("invoices.invoiceNumber")}</TableCell>
                      <TableCell className="font-bold">{t("invoices.clientName")}</TableCell>
                      <TableCell className="font-bold">{t("invoices.total")}</TableCell>
                      <TableCell className="font-bold">{t("invoices.status")}</TableCell>
                      <TableCell className="font-bold">{t("invoices.dueDate")}</TableCell>
                      <TableCell className="font-bold">{t("invoices.actions")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" className="py-8! text-gray-500">
                          {t("table.noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id} hover>
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedInvoiceIds.includes(invoice.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedInvoiceIds([...selectedInvoiceIds, invoice.id]);
                                } else {
                                  setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== invoice.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {invoice.invoiceNumber}
                          </TableCell>
                          <TableCell>{invoice.clientName}</TableCell>
                          <TableCell className="font-semibold">
                            ${invoice.total.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <FormControl size="small" className="min-w-[120px]">
                              <Select
                                value={invoice.status}
                                onChange={(e) => handleQuickStatusChange(invoice.id, e.target.value)}
                                className="text-sm"
                                sx={{
                                  '& .MuiSelect-select': {
                                    py: 0.5,
                                    fontSize: '0.875rem',
                                  }
                                }}
                              >
                                <MenuItem value="DRAFT">{t("invoices.draft")}</MenuItem>
                                <MenuItem value="SENT">{t("invoices.sent")}</MenuItem>
                                <MenuItem value="PAID">{t("invoices.paid")}</MenuItem>
                                <MenuItem value="OVERDUE">{t("invoices.overdue")}</MenuItem>
                                <MenuItem value="CANCELLED">{t("invoices.cancelled")}</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Box className="flex gap-1!">
                              <IconButton
                                size="small"
                                onClick={() => handleViewInvoice(invoice.id)}
                                title={t("invoices.view")}
                              >
                                <Eye size={18} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => generateInvoicePDF(invoice)}
                                title="Download PDF"
                              >
                                <FileText size={18} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteInvoice(invoice.id)}
                                color="error"
                                title={t("invoices.delete")}
                              >
                                <Trash2 size={18} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {invoiceTotalPages > 1 && (
                <div className="flex justify-center mt-4!">
                  <Pagination
                    count={invoiceTotalPages}
                    page={invoicePage}
                    onChange={(_, p) => setInvoicePage(p)}
                  />
                </div>
              )}
            </div>
          )}

          {tab === 3 && (
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

      {/* Create Invoice Dialog */}
      <Dialog
        open={createInvoiceOpen}
        onClose={() => setCreateInvoiceOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "rounded-2xl" }}
      >
        <DialogTitle className="font-bold">{t("invoices.form.title")}</DialogTitle>
        <DialogContent>
          <Box className="space-y-4! mt-2!">
            <Typography variant="subtitle2" className="font-semibold">
              {t("invoices.form.clientInfo")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t("invoices.clientName")}
                  value={invoiceFormData.clientName}
                  onChange={(e) =>
                    setInvoiceFormData({ ...invoiceFormData, clientName: e.target.value })
                  }
                  required
                  className="bg-white"
                  InputProps={{ className: "rounded-xl" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t("invoices.clientEmail")}
                  type="email"
                  value={invoiceFormData.clientEmail}
                  onChange={(e) =>
                    setInvoiceFormData({ ...invoiceFormData, clientEmail: e.target.value })
                  }
                  className="bg-white"
                  InputProps={{ className: "rounded-xl" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t("invoices.clientPhone")}
                  value={invoiceFormData.clientPhone}
                  onChange={(e) =>
                    setInvoiceFormData({ ...invoiceFormData, clientPhone: e.target.value })
                  }
                  className="bg-white"
                  InputProps={{ className: "rounded-xl" }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label={t("invoices.dueDate")}
                  type="date"
                  value={invoiceFormData.dueDate}
                  onChange={(e) =>
                    setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  className="bg-white"
                  InputProps={{ className: "rounded-xl" }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label={t("invoices.clientAddress")}
                  value={invoiceFormData.clientAddress}
                  onChange={(e) =>
                    setInvoiceFormData({ ...invoiceFormData, clientAddress: e.target.value })
                  }
                  className="bg-white"
                  InputProps={{ className: "rounded-xl" }}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" className="font-semibold mt-4!">
              {t("invoices.form.items")}
            </Typography>
            {invoiceItems.map((item, index) => (
              <Box key={index} className="border rounded-xl p-3! bg-gray-50">
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("invoices.form.description")}
                      value={item.description}
                      onChange={(e) =>
                        updateInvoiceItem(index, "description", e.target.value)
                      }
                      className="bg-white"
                      InputProps={{ className: "rounded-xl" }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("invoices.form.quantity")}
                      type="number"
                      value={item.quantity === "" || Number.isNaN(item.quantity) ? "" : item.quantity}
                      onChange={(e) =>
                        updateInvoiceItem(index, "quantity", e.target.value)
                      }
                      className="bg-white"
                      InputProps={{ className: "rounded-xl" }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      size="small"
                      label={t("invoices.form.unitPrice")}
                      type="number"
                      value={item.unitPrice === "" || Number.isNaN(item.unitPrice) ? "" : item.unitPrice}
                      onChange={(e) =>
                        updateInvoiceItem(index, "unitPrice", e.target.value)
                      }
                      className="bg-white"
                      InputProps={{ className: "rounded-xl" }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Box className="flex items-center justify-between">
                      <Typography variant="body2" className="font-semibold">
                        ${getInvoiceItemAmount(item).toFixed(2)}
                      </Typography>
                      {invoiceItems.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeInvoiceItem(index)}
                          color="error"
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ))}
            <Button
              variant="outlined"
              startIcon={<Plus size={18} />}
              onClick={addInvoiceItem}
              className="border-2 border-gray-200 text-gray-700 rounded-xl normal-case"
            >
              {t("invoices.form.addItem")}
            </Button>

            <Box className="border-t pt-4! space-y-2!">
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("invoices.form.taxRate")}
                    type="number"
                    value={invoiceFormData.taxRate}
                    onChange={(e) =>
                      setInvoiceFormData({ ...invoiceFormData, taxRate: e.target.value })
                    }
                    className="bg-white"
                    InputProps={{ className: "rounded-xl" }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t("invoices.form.discount")}
                    type="number"
                    value={invoiceFormData.discount}
                    onChange={(e) =>
                      setInvoiceFormData({ ...invoiceFormData, discount: e.target.value })
                    }
                    className="bg-white"
                    InputProps={{ className: "rounded-xl" }}
                  />
                </Grid>
              </Grid>

              <Box className="flex justify-between items-center py-2!">
                <Typography variant="body1">{t("invoices.form.subtotal")}:</Typography>
                <Typography variant="body1" className="font-semibold">
                  ${calculateInvoiceSubtotal().toFixed(2)}
                </Typography>
              </Box>
              <Box className="flex justify-between items-center py-2! border-t">
                <Typography variant="h6" className="font-bold">
                  {t("invoices.form.totalAmount")}:
                </Typography>
                <Typography variant="h6" className="font-bold">
                  ${calculateInvoiceTotal().toFixed(2)}
                </Typography>
              </Box>
            </Box>

            <TextField
              fullWidth
              label={t("invoices.form.notes")}
              multiline
              rows={3}
              value={invoiceFormData.notes}
              onChange={(e) =>
                setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })
              }
              className="bg-white"
              InputProps={{ className: "rounded-xl" }}
            />
          </Box>
        </DialogContent>
        <DialogActions className="p-4!">
          <Button
            onClick={() => setCreateInvoiceOpen(false)}
            className="normal-case"
          >
            {t("invoices.form.cancel")}
          </Button>
          <Button
            onClick={handleCreateInvoice}
            variant="contained"
            className="bg-black hover:bg-gray-800 text-white normal-case shadow-none"
          >
            {t("invoices.form.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog
        open={viewInvoiceOpen}
        onClose={() => setViewInvoiceOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "rounded-2xl" }}
      >
        {selectedInvoice && (
          <>
            <DialogTitle className="font-bold">
              {t("invoices.detail.invoiceDetails")} - {selectedInvoice.invoiceNumber}
            </DialogTitle>
            <DialogContent>
              <Box className="space-y-4!">
                <Paper className="p-4! bg-gray-50 rounded-xl">
                  <Typography variant="subtitle2" className="font-semibold mb-2!">
                    {t("invoices.detail.clientInfo")}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{t("invoices.clientName")}:</strong>{" "}
                    {selectedInvoice.clientName}
                  </Typography>
                  {selectedInvoice.clientEmail && (
                    <Typography variant="body2">
                      <strong>{t("invoices.clientEmail")}:</strong>{" "}
                      {selectedInvoice.clientEmail}
                    </Typography>
                  )}
                  {selectedInvoice.clientPhone && (
                    <Typography variant="body2">
                      <strong>{t("invoices.clientPhone")}:</strong>{" "}
                      {selectedInvoice.clientPhone}
                    </Typography>
                  )}
                  {selectedInvoice.clientAddress && (
                    <Typography variant="body2">
                      <strong>{t("invoices.clientAddress")}:</strong>{" "}
                      {selectedInvoice.clientAddress}
                    </Typography>
                  )}
                </Paper>

                <Box>
                  <Typography variant="subtitle2" className="font-semibold mb-2!">
                    {t("invoices.detail.items")}
                  </Typography>
                  <TableContainer component={Paper} className="rounded-xl">
                    <Table size="small">
                      <TableHead>
                        <TableRow className="bg-gray-50">
                          <TableCell>{t("invoices.form.description")}</TableCell>
                          <TableCell align="right">{t("invoices.form.quantity")}</TableCell>
                          <TableCell align="right">{t("invoices.form.unitPrice")}</TableCell>
                          <TableCell align="right">{t("invoices.form.amount")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">
                              ${item.unitPrice.toFixed(2)}
                            </TableCell>
                            <TableCell align="right" className="font-semibold">
                              ${item.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                <Box className="border-t pt-4! space-y-2!">
                  <Box className="flex justify-between">
                    <Typography>{t("invoices.form.subtotal")}:</Typography>
                    <Typography className="font-semibold">
                      ${selectedInvoice.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  {selectedInvoice.taxAmount > 0 && (
                    <Box className="flex justify-between">
                      <Typography>
                        {t("invoices.form.taxRate")} ({selectedInvoice.taxRate}%):
                      </Typography>
                      <Typography className="font-semibold">
                        ${selectedInvoice.taxAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <Box className="flex justify-between">
                      <Typography>{t("invoices.form.discount")}:</Typography>
                      <Typography className="font-semibold text-red-600">
                        -${selectedInvoice.discount.toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Box className="flex justify-between border-t pt-2!">
                    <Typography variant="h6" className="font-bold">
                      {t("invoices.total")}:
                    </Typography>
                    <Typography variant="h6" className="font-bold">
                      ${selectedInvoice.total.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Box className="flex gap-2!">
                  <FormControl size="small" fullWidth>
                    <InputLabel>{t("invoices.detail.updateStatus")}</InputLabel>
                    <Select
                      value={selectedInvoice.status}
                      onChange={(e) => handleUpdateInvoiceStatus(e.target.value)}
                      label={t("invoices.detail.updateStatus")}
                      className="rounded-xl"
                    >
                      <MenuItem value="DRAFT">{t("invoices.draft")}</MenuItem>
                      <MenuItem value="SENT">{t("invoices.sent")}</MenuItem>
                      <MenuItem value="PAID">{t("invoices.paid")}</MenuItem>
                      <MenuItem value="OVERDUE">{t("invoices.overdue")}</MenuItem>
                      <MenuItem value="CANCELLED">{t("invoices.cancelled")}</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions className="p-4!">
              <Button
                onClick={() => setViewInvoiceOpen(false)}
                className="normal-case"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={bulkStatusDialogOpen}
        onClose={() => setBulkStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "rounded-2xl" }}
      >
        <DialogTitle className="font-bold">Update Status</DialogTitle>
        <DialogContent>
          <Typography variant="body2" className="mb-4! text-gray-600">
            Update status for {selectedInvoiceIds.length} invoice(s)
          </Typography>
          <FormControl fullWidth>
            <InputLabel>New Status</InputLabel>
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              label="New Status"
              className="rounded-xl"
            >
              <MenuItem value="DRAFT">{t("invoices.draft")}</MenuItem>
              <MenuItem value="SENT">{t("invoices.sent")}</MenuItem>
              <MenuItem value="PAID">{t("invoices.paid")}</MenuItem>
              <MenuItem value="OVERDUE">{t("invoices.overdue")}</MenuItem>
              <MenuItem value="CANCELLED">{t("invoices.cancelled")}</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions className="p-4!">
          <Button onClick={() => setBulkStatusDialogOpen(false)} className="normal-case">
            Cancel
          </Button>
          <Button
            onClick={handleBulkStatusUpdate}
            variant="contained"
            disabled={!bulkStatus}
            className="bg-blue-600 hover:bg-blue-700 text-white normal-case shadow-none"
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
