"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Container,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  AppBar,
  Toolbar,
  Box,
  Pagination,
} from "@mui/material";
import {
  Shield,
  Users,
  LogOut,
  Search,
  Lock,
  Unlock,
  Trash2,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { API_URL } from "../../../../config/api";
import { useSnackbar } from "notistack";
import Link from "next/link";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  jobTitle?: string;
  isBlocked: boolean;
  company?: { id: string; name: string };
  ticketsCount: number;
  createdAt: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/admin/users?page=${page}${search ? `&search=${search}` : ""}`;
      const res = await fetch(url, { credentials: "include" });

      if (res.ok) {
        const data = await res.json();
        setUsers(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        enqueueSnackbar("Failed to load users", { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar("Network error", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleBlock = async (userId: string, isBlocked: boolean) => {
    setActionLoading(true);
    try {
      const endpoint = isBlocked ? "unblock" : "block";
      const res = await fetch(`${API_URL}/admin/users/${userId}/${endpoint}`, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        enqueueSnackbar(`User ${isBlocked ? "unblocked" : "blocked"} successfully`, { variant: "success" });
        fetchUsers();
      } else {
        const data = await res.json();
        enqueueSnackbar(data.message || "Action failed", { variant: "error" });
      }
    } catch (e) {
      enqueueSnackbar("Network error", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${deleteDialog}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        enqueueSnackbar("User deleted successfully", { variant: "success" });
        setDeleteDialog(null);
        fetchUsers();
      } else {
        const data = await res.json();
        enqueueSnackbar(data.message || "Failed to delete user", { variant: "error" });
      }
    } catch (e) {
      enqueueSnackbar("Network error", { variant: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push(`/${locale}/admin/login`);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "OWNER": return "error";
      case "ADMIN": return "warning";
      default: return "default";
    }
  };

  const pathname = `/${locale}/admin/users`;

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
              <Typography variant="h4" className="font-bold text-gray-900 mb-3">
                Users Management
              </Typography>
              <Typography variant="body1" className="text-gray-500">
                Manage all platform users
              </Typography>
            </div>
            <Chip label={`${total} users`} className="bg-gray-100 text-gray-700 font-semibold px-4 py-6" />
          </Box>

          <Paper className="p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
            <Box className="flex gap-3">
              <TextField
                fullWidth
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                variant="outlined"
                className="bg-white"
                InputProps={{ className: "rounded-xl" }}
              />
              <Button
                variant="contained"
                onClick={handleSearch}
                startIcon={<Search size={20} />}
                className="bg-black hover:bg-gray-800 text-white rounded-xl normal-case shadow-none px-8 py-3"
              >
                Search
              </Button>
            </Box>
          </Paper>

        {loading ? (
          <Box className="flex justify-center items-center h-64">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} className="rounded-2xl shadow-sm border border-gray-200">
              <Table>
                <TableHead>
                  <TableRow className="bg-gray-50">
                    <TableCell className="font-bold">User</TableCell>
                    <TableCell className="font-bold">Contact</TableCell>
                    <TableCell className="font-bold">Company</TableCell>
                    <TableCell className="font-bold">Role</TableCell>
                    <TableCell className="font-bold">Status</TableCell>
                    <TableCell className="font-bold">Tickets</TableCell>
                    <TableCell className="font-bold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Typography variant="body2" className="font-semibold">
                          {user.fullName}
                        </Typography>
                        <Typography variant="caption" className="text-gray-600">
                          {user.jobTitle || "No job title"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                        <Typography variant="caption" className="text-gray-600">
                          {user.phone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.company ? (
                          <Typography variant="body2">{user.company.name}</Typography>
                        ) : (
                          <Typography variant="caption" className="text-gray-500">No company</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={user.role} color={getRoleColor(user.role)} size="small" />
                      </TableCell>
                      <TableCell>
                        {user.isBlocked ? (
                          <Chip label="Blocked" color="error" size="small" />
                        ) : (
                          <Chip label="Active" color="success" size="small" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={user.ticketsCount} size="small" icon={<MessageSquare size={16} />} />
                      </TableCell>
                      <TableCell>
                        <Box className="flex gap-1">
                          <IconButton
                            size="small"
                            onClick={() => handleBlock(user.id, user.isBlocked)}
                            disabled={actionLoading}
                            title={user.isBlocked ? "Unblock user" : "Block user"}
                          >
                            {user.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteDialog(user.id)}
                            disabled={actionLoading}
                            title="Delete user"
                            color="error"
                          >
                            <Trash2 size={18} />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Box className="flex justify-center mt-8">
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Container>

      <Dialog open={!!deleteDialog} onClose={() => !actionLoading && setDeleteDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this user? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={actionLoading}
            color="error"
            variant="contained"
            startIcon={actionLoading ? <CircularProgress size={18} /> : <Trash2 size={18} />}
          >
            {actionLoading ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
      </main>
    </div>
  );
}
