"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  AppBar,
  Toolbar,
  Box,
  Pagination,
  IconButton,
} from "@mui/material";
import {
  Shield,
  Users,
  LogOut,
  MessageSquare,
  Eye,
  Send,
  Trash2,
  AlertCircle,
  LayoutDashboard,
} from "lucide-react";
import { API_URL } from "../../../../config/api";
import { apiFetch } from "../../../../lib/api-fetch";
import { clearAuthSession } from "../../../../lib/auth-token";
import { useSnackbar } from "notistack";
import Link from "next/link";

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    company?: { name: string };
  };
  _count: { responses: number };
  createdAt: string;
}

interface TicketDetails extends Ticket {
  responses: Array<{
    id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
  }>;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketDetails | null>(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [updateStatus, setUpdateStatus] = useState("");
  const [updatePriority, setUpdatePriority] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [page, statusFilter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/admin/tickets?page=${page}${statusFilter ? `&status=${statusFilter}` : ""}`;
      const res = await apiFetch(url, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        setTickets(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/tickets/${ticketId}`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setSelectedTicket(data);
        setUpdateStatus(data.status);
        setUpdatePriority(data.priority);
        setViewDialog(true);
      }
    } catch (e) {
      enqueueSnackbar("Failed to load ticket", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseText.trim()) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/tickets/${selectedTicket.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: responseText }),
      });

      if (res.ok) {
        enqueueSnackbar("Response sent", { variant: "success" });
        setResponseText("");
        fetchTicketDetails(selectedTicket.id);
      }
    } catch (e) {
      enqueueSnackbar("Failed to send response", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: updateStatus, priority: updatePriority }),
      });

      if (res.ok) {
        enqueueSnackbar("Ticket updated", { variant: "success" });
        fetchTickets();
        fetchTicketDetails(selectedTicket.id);
      }
    } catch (e) {
      enqueueSnackbar("Failed to update ticket", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Delete this ticket?")) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/admin/tickets/${ticketId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        enqueueSnackbar("Ticket deleted", { variant: "success" });
        setViewDialog(false);
        fetchTickets();
      }
    } catch (e) {
      enqueueSnackbar("Failed to delete", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (e) {
      console.error(e);
    } finally {
      clearAuthSession();
      router.push(`/${locale}/admin/login`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "error";
      case "IN_PROGRESS": return "warning";
      case "RESOLVED": return "success";
      case "CLOSED": return "default";
      default: return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT": return "error";
      case "HIGH": return "warning";
      case "MEDIUM": return "info";
      case "LOW": return "default";
      default: return "default";
    }
  };

  const pathname = `/${locale}/admin/support`;

  const navItems = [
    { label: "Dashboard", href: `/${locale}/admin/dashboard`, icon: LayoutDashboard },
    { label: "Users", href: `/${locale}/admin/users`, icon: Users },
    { label: "Support", href: `/${locale}/admin/support`, icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        className="bg-white border-b border-gray-200 z-50"
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters className="flex items-center justify-between h-16">
            <div className="flex-1 flex justify-start">
              <Link
                href={`/${locale}/admin/dashboard`}
                className="no-underline flex items-center gap-2 group"
              >
                <div className="h-9 w-9 bg-black text-white rounded-xl flex items-center justify-center shadow-md group-hover:bg-gray-800 transition-colors">
                  <Shield size={20} />
                </div>
                <Typography className="font-bold text-black leading-none hidden sm:block">
                  Admin Panel
                </Typography>
              </Link>
            </div>

            <div className="flex items-center gap-1 md:gap-2 bg-gray-100/50 p-1.5 rounded-full border border-gray-100">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    variant={isActive ? "contained" : "text"}
                    className={`
                      rounded-full px-4 py-2 text-sm font-medium transition-all min-w-0
                      ${isActive ? "bg-black text-white shadow-md hover:bg-gray-800" : "hover:bg-gray-200/50 text-gray-600"}
                    `}
                    startIcon={<Icon size={18} />}
                  >
                    <span className="hidden md:inline">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            <div className="flex-1 flex justify-end items-center gap-3">
              <Button
                onClick={handleLogout}
                color="error"
                variant="text"
                className="font-medium hover:bg-red-50 rounded-lg min-w-0 px-3"
              >
                <LogOut size={18} className="sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </Toolbar>
        </Container>
      </AppBar>

      <main className="p-6">
        <Container maxWidth="xl">
          <Box className="flex justify-between items-center mb-8">
            <div>
              <Typography variant="h4" className="font-bold text-gray-900 mb-3">Support Tickets</Typography>
              <Typography variant="body1" className="text-gray-500">Manage customer support requests</Typography>
            </div>
            <Chip label={`${total} tickets`} className="bg-gray-100 text-gray-700 font-semibold px-4 py-6" />
          </Box>

          <Paper className="p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <FormControl
            size="small"
            sx={{
              width: "min(100%, 220px)",
              minWidth: 200,
            }}
          >
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              label="Filter by Status"
              className="rounded-xl bg-white"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
        </Paper>

        {loading ? (
          <Box className="flex justify-center items-center h-64"><CircularProgress /></Box>
        ) : (
          <>
            <TableContainer component={Paper} className="rounded-2xl shadow-sm border border-gray-200">
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-bold">User</TableCell>
                    <TableCell className="font-bold">Subject</TableCell>
                    <TableCell className="font-bold">Status</TableCell>
                    <TableCell className="font-bold">Priority</TableCell>
                    <TableCell className="font-bold">Responses</TableCell>
                    <TableCell className="font-bold">Created</TableCell>
                    <TableCell className="font-bold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Typography variant="body2" className="font-semibold">{ticket.user.fullName}</Typography>
                        <Typography variant="caption" className="text-gray-600">{ticket.user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="max-w-xs truncate">{ticket.subject}</Typography>
                      </TableCell>
                      <TableCell><Chip label={ticket.status.replace("_", " ")} color={getStatusColor(ticket.status)} size="small" /></TableCell>
                      <TableCell><Chip label={ticket.priority} color={getPriorityColor(ticket.priority)} size="small" /></TableCell>
                      <TableCell><Chip label={ticket._count.responses} size="small" icon={<MessageSquare size={16} />} /></TableCell>
                      <TableCell><Typography variant="caption">{new Date(ticket.createdAt).toLocaleDateString()}</Typography></TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => fetchTicketDetails(ticket.id)} title="View details">
                          <Eye size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box className="flex justify-center mt-4">
                <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} color="primary" />
              </Box>
            )}
          </>
        )}
      </Container>

      <Dialog open={viewDialog} onClose={() => !actionLoading && setViewDialog(false)} maxWidth="md" fullWidth>
        {selectedTicket && (
          <>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare size={24} />
              Ticket Details
            </DialogTitle>
            <DialogContent dividers>
              <Box className="space-y-4">
                <Paper className="p-4 bg-gray-50 rounded-xl">
                  <Typography variant="subtitle2" className="text-gray-600 mb-2">User Information</Typography>
                  <Typography variant="body2"><strong>Name:</strong> {selectedTicket.user.fullName}</Typography>
                  <Typography variant="body2"><strong>Email:</strong> {selectedTicket.user.email}</Typography>
                  <Typography variant="body2"><strong>Phone:</strong> {selectedTicket.user.phone}</Typography>
                  {selectedTicket.user.company && <Typography variant="body2"><strong>Company:</strong> {selectedTicket.user.company.name}</Typography>}
                </Paper>

                <Box>
                  <Typography variant="subtitle2" className="text-gray-600 mb-2">Original Message</Typography>
                  <Paper className="p-3 bg-blue-50 rounded-xl">
                    <Typography variant="body2" className="whitespace-pre-wrap">{selectedTicket.message}</Typography>
                  </Paper>
                </Box>

                <Box className="flex gap-2">
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={updateStatus} onChange={(e) => setUpdateStatus(e.target.value)} label="Status">
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select value={updatePriority} onChange={(e) => setUpdatePriority(e.target.value)} label="Priority">
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="URGENT">Urgent</MenuItem>
                    </Select>
                  </FormControl>
                  <Button variant="contained" onClick={handleUpdateTicket} disabled={actionLoading} className="bg-black hover:bg-gray-800 shadow-none normal-case">Update</Button>
                </Box>

                <Box>
                  <Typography variant="subtitle2" className="mb-2">Responses ({selectedTicket.responses.length})</Typography>
                  <Box className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedTicket.responses.map((resp) => (
                      <Paper key={resp.id} className={`p-3 rounded-xl ${resp.isAdmin ? "bg-green-50 ml-8" : "bg-gray-50 mr-8"}`}>
                        <Box className="flex items-center gap-2 mb-1">
                          <Chip label={resp.isAdmin ? "Admin" : "User"} size="small" color={resp.isAdmin ? "success" : "default"} />
                          <Typography variant="caption" className="text-gray-600">{new Date(resp.createdAt).toLocaleString()}</Typography>
                        </Box>
                        <Typography variant="body2" className="whitespace-pre-wrap">{resp.message}</Typography>
                      </Paper>
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" className="mb-2">Send Response</Typography>
                  <TextField fullWidth multiline rows={3} value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type your response..." variant="outlined" className="bg-white" />
                  <Button fullWidth variant="contained" onClick={handleSendResponse} disabled={actionLoading || !responseText.trim()} startIcon={<Send size={18} />} className="bg-black hover:bg-gray-800 text-white mt-2 shadow-none normal-case">
                    {actionLoading ? "Sending..." : "Send Response"}
                  </Button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => handleDeleteTicket(selectedTicket.id)} disabled={actionLoading} color="error" startIcon={<Trash2 size={18} />}>Delete</Button>
              <Button onClick={() => setViewDialog(false)} disabled={actionLoading}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      </main>
    </div>
  );
}
