import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import ChatInterface from "../components/chat/ChatInterface";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import Button from "../components/ui/Button";
import { ChatSession } from "../types";
import { chatService } from "../services/chatService";
import { useAuth } from "../contexts/AuthContext";
import { MessageSquare, Plus, Clock, Trash2 } from "lucide-react";

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    searchParams.get("session")
  );
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  // Load user's chat sessions
  useEffect(() => {
    if (user) {
      loadUserSessions();
    }
  }, [user]);

  const loadUserSessions = async () => {
    if (!user) return;

    try {
      setIsLoadingSessions(true);
      const userSessions = await chatService.getUserChatSessions(user.id);
      setSessions(userSessions);
    } catch (error) {
      console.error("Error loading user sessions:", error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleSessionChange = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    if (sessionId) {
      setSearchParams({ session: sessionId });
    } else {
      setSearchParams({});
    }
    // Reload sessions to get updated list
    loadUserSessions();
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      const newSession = await chatService.createChatSession(user.id);
      setCurrentSessionId(newSession.id);
      setSearchParams({ session: newSession.id });
      loadUserSessions();
    } catch (error) {
      console.error("Error creating new session:", error);
    }
  };

  const formatSessionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSessionPreview = (session: ChatSession) => {
    const lastUserMessage = session.messages
      .filter(msg => msg.role === "user")
      .pop();

    return lastUserMessage?.content.slice(0, 50) + "..." || "New conversation";
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Asisten AI / AI Assistant</h1>
          <p className="text-gray-600">
            Chat dengan asisten AI kami untuk mendapatkan bantuan tentang barang inventori, tingkat stok, dan lainnya.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Chat with our AI assistant to get help with inventory items, stock levels, and more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Chat Sessions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Riwayat Chat / History</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createNewSession}
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Baru / New
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Memuat... / Loading...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Belum ada riwayat chat</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Mulai percakapan untuk melihatnya di sini
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      No chat history yet - Start a conversation
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => handleSessionChange(session.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          currentSessionId === session.id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getSessionPreview(session)}
                            </p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatSessionDate(session.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <ChatInterface
                sessionId={currentSessionId || undefined}
                onSessionChange={handleSessionChange}
                className="h-full border-0 shadow-none"
              />
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ChatPage;
