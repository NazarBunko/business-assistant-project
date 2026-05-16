"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSnackbar } from "notistack";
import {
  Paper,
  IconButton,
  Avatar,
  CircularProgress,
  Typography,
  Button,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Bot,
  User,
  ArrowUp,
  Plus,
  MessageSquare,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { API_URL } from "../../../../config/api";
import { apiFetch } from "../../../../lib/api-fetch";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
}

export default function ChatPage() {
  const t = useTranslations("Chat");
  const { enqueueSnackbar } = useSnackbar();

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

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
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/chat/conversations`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const res = await apiFetch(
          `${API_URL}/chat/${activeChatId}/messages`,
          {
            credentials: "include",
          }
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadMessages();
  }, [activeChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const tempMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await apiFetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          content: text,
          chatId: activeChatId,
        }),
      });

      if (!response.ok) throw new Error("Error");
      const data = await response.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: data.content,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (!activeChatId && data.chatId) {
        setActiveChatId(data.chatId);
        setChats((prev) => [
          { id: data.chatId, title: data.title || text.substring(0, 20) },
          ...prev,
        ]);
      } else {
        setChats((prev) => {
          const chat = prev.find((c) => c.id === activeChatId);
          const others = prev.filter((c) => c.id !== activeChatId);
          return chat ? [chat, ...others] : prev;
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    chatId: string
  ) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedChatId(chatId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedChatId(null);
  };

  const startEditing = () => {
    if (selectedChatId) {
      const chat = chats.find((c) => c.id === selectedChatId);
      if (chat) {
        setEditingChatId(selectedChatId);
        setEditTitle(chat.title);
      }
    }
    handleMenuClose();
  };

  const saveTitle = async () => {
    if (!editingChatId || !editTitle.trim()) return;

    try {
      await apiFetch(`${API_URL}/chat/${editingChatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: editTitle }),
      });

      setChats((prev) =>
        prev.map((c) =>
          c.id === editingChatId ? { ...c, title: editTitle } : c
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setEditingChatId(null);
    }
  };

  const performDeleteChat = async (chatId: string) => {
    try {
      const res = await apiFetch(
        `${API_URL}/chat/${chatId}`,
        { 
          method: "DELETE",
          credentials: "include",
        }
      );
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChatId === chatId) handleNewChat();
        enqueueSnackbar(t("deleteSuccess"), { variant: "success" });
      } else {
        enqueueSnackbar(t("deleteError"), { variant: "error" });
      }
    } catch (e) {
      console.error(e);
      enqueueSnackbar(t("deleteError"), { variant: "error" });
    } finally {
      setChatToDeleteId(null);
    }
  };

  return (
    <div className="flex h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] max-w-7xl mx-auto gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 items-start">
      <Paper className="w-56 sm:w-60 md:w-64 h-full flex-shrink-0 flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 hidden md:flex">
        <div className="p-2 sm:p-3">
          <Button
            fullWidth
            variant="contained"
            startIcon={<Plus size={16} className="sm:w-[18px] sm:h-[18px]" />}
            onClick={handleNewChat}
            className="bg-black hover:bg-gray-800 text-white py-1.5 sm:py-2 text-sm rounded-lg sm:rounded-xl normal-case shadow-none"
          >
            New Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`
                group relative w-full flex items-center rounded-xl transition-all
                ${activeChatId === chat.id ? "bg-gray-100" : "hover:bg-gray-50"}
              `}
            >
              {editingChatId === chat.id ? (
                <div className="flex items-center w-full p-2 gap-1">
                  <InputBase
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                    className="flex-1 text-sm bg-white border border-gray-300 rounded px-2 py-1"
                  />
                  <IconButton
                    size="small"
                    onClick={saveTitle}
                    className="text-green-600"
                  >
                    <Check size={14} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setEditingChatId(null)}
                    className="text-red-500"
                  >
                    <X size={14} />
                  </IconButton>
                </div>
              ) : (
                <button
                  onClick={() => setActiveChatId(chat.id)}
                  className="flex-1 text-left p-3 text-sm truncate flex items-center gap-3 w-full"
                >
                  <MessageSquare
                    size={18}
                    className={`flex-shrink-0 ${activeChatId === chat.id ? "text-black" : "text-gray-400"}`}
                  />
                  <span
                    className={`truncate flex-1 ${activeChatId === chat.id ? "font-semibold text-gray-900" : "text-gray-600"}`}
                  >
                    {chat.title}
                  </span>

                  <div
                    onClick={(e) => handleMenuOpen(e, chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-opacity"
                  >
                    <MoreVertical size={16} />
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </Paper>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 0,
          className: "border border-gray-200 shadow-lg rounded-xl mt-1",
        }}
      >
        <MenuItem onClick={startEditing} className="text-sm gap-2">
          <ListItemIcon>
            <Edit2 size={16} />
          </ListItemIcon>
          Змінити назву
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedChatId) setChatToDeleteId(selectedChatId);
            handleMenuClose();
          }}
          className="text-sm gap-2 text-red-600"
        >
          <ListItemIcon>
            <Trash2 size={16} className="text-red-600" />
          </ListItemIcon>
          {t("deleteChat")}
        </MenuItem>
      </Menu>

      <Dialog open={!!chatToDeleteId} onClose={() => setChatToDeleteId(null)}>
        <DialogTitle>{t("deleteChat")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("deleteChatConfirm")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatToDeleteId(null)}>{t("cancel")}</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => chatToDeleteId && performDeleteChat(chatToDeleteId)}
          >
            {t("deleteChat")}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper
        elevation={0}
        className="flex-1 h-full flex flex-col overflow-hidden rounded-xl sm:rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-75 px-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-50 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                <Bot size={24} className="text-primary sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </div>
              <Typography className="font-bold text-gray-800 text-lg sm:text-xl md:text-2xl">
                Business Assistant AI
              </Typography>
              <Typography
                className="text-gray-500 mt-2 text-center max-w-xs text-xs sm:text-sm"
              >
                {t("welcomeSubtitle")}
              </Typography>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 sm:gap-3 md:gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <Avatar
                    className={`${msg.role === "user" ? "bg-black" : "bg-primary"} w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 border-2 border-white shadow-sm flex-shrink-0`}
                  >
                    {msg.role === "user" ? (
                      <User size={16} className="sm:w-[18px] sm:h-[18px]" />
                    ) : (
                      <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />
                    )}
                  </Avatar>
                  <div
                    className={`
                    p-2.5 sm:p-3 md:p-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm md:text-base leading-relaxed whitespace-pre-wrap max-w-[85%] sm:max-w-[80%] shadow-sm
                    ${msg.role === "user"
                        ? "bg-gray-100 text-gray-900 rounded-tr-sm"
                        : "bg-blue-50 text-gray-800 rounded-tl-sm border border-blue-100"
                      }
                  `}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 sm:gap-3 md:gap-4">
                  <Avatar className="bg-primary w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                    <Bot size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </Avatar>
                  <div className="bg-blue-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl rounded-tl-sm border border-blue-100">
                    <CircularProgress size={14} className="sm:w-4 sm:h-4" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-2 sm:p-3 md:p-4 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end gap-1.5 sm:gap-2 bg-gray-50 p-1.5 sm:p-2 rounded-[20px] sm:rounded-[24px] border border-gray-200 focus-within:border-primary/50 focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
              <InputBase
                className="flex-1 pl-2! pr-2 sm:pr-4 py-2 sm:py-2.5 max-h-24 sm:max-h-32 overflow-y-auto text-sm sm:text-base text-gray-800"
                placeholder={t("placeholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                multiline
                maxRows={3}
                sx={{ '& textarea': { fontSize: { xs: '0.875rem', sm: '1rem' } } }}
              />
              <IconButton
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className={`
                   mb-0.5 sm:mb-1 mr-0.5 sm:mr-1 bg-black text-white hover:bg-gray-800 transition-all flex-shrink-0 shadow-sm
                   ${!input.trim() || isLoading ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:scale-105 active:scale-95"}
                 `}
                sx={{ width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 } }}
              >
                {isLoading ? (
                  <CircularProgress size={16} className="sm:w-[18px] sm:h-[18px]" color="inherit" />
                ) : (
                  <ArrowUp size={18} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                )}
              </IconButton>
            </div>

            <Typography
              variant="caption"
              className="text-center block text-gray-400 mt-1.5 sm:mt-2! text-[9px] sm:text-[10px] md:text-xs font-medium"
            >
              {t("checkImportantInformation")}
            </Typography>
          </div>
        </div>
      </Paper>
    </div>
  );
}
