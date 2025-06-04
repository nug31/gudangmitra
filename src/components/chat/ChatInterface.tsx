import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, ChatSession } from "../../types";
import { chatService } from "../../services/chatService";
import { useAuth } from "../../contexts/AuthContext";
import ChatMessageComponent from "./ChatMessage";
import ChatInput from "./ChatInput";
import Button from "../ui/Button";
import { RefreshCw, Trash2, MessageSquare } from "lucide-react";

interface ChatInterfaceProps {
  sessionId?: string;
  onSessionChange?: (sessionId: string) => void;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  sessionId,
  onSessionChange,
  className = "",
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat session if sessionId is provided
  useEffect(() => {
    if (sessionId && user) {
      loadChatSession(sessionId);
    }
  }, [sessionId, user]);

  const loadChatSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const session = await chatService.getChatSession(sessionId);
      if (session) {
        setMessages(session.messages);
        setCurrentSessionId(session.id);
      }
    } catch (error) {
      console.error("Error loading chat session:", error);
      setError("Failed to load chat session");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const session = await chatService.createChatSession(user.id);
      setCurrentSessionId(session.id);
      setMessages([]);

      if (onSessionChange) {
        onSessionChange(session.id);
      }
    } catch (error) {
      console.error("Error creating new session:", error);
      setError("Failed to create new chat session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    // Create user message
    const userMessage = chatService.createUserMessage(content);
    setMessages(prev => [...prev, userMessage]);

    // Create loading message
    const loadingMessage = chatService.createLoadingMessage();
    setMessages(prev => [...prev, loadingMessage]);

    try {
      setIsLoading(true);
      setError(null);

      // Send message to AI
      const response = await chatService.sendMessage({
        message: content,
        sessionId: currentSessionId || undefined,
      });

      // Update session ID if this is a new session
      if (!currentSessionId) {
        setCurrentSessionId(response.sessionId);
        if (onSessionChange) {
          onSessionChange(response.sessionId);
        }
      }

      // Replace loading message with actual response
      setMessages(prev =>
        prev.map(msg =>
          msg.id === loadingMessage.id ? response.message : msg
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");

      // Remove loading message on error
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
    setError(null);
    if (onSessionChange) {
      onSessionChange("");
    }
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Asisten AI / AI Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={createNewSession}
            disabled={isLoading}
            icon={<RefreshCw className="h-4 w-4" />}
          >
            Chat Baru / New Chat
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            disabled={isLoading || messages.length === 0}
            icon={<Trash2 className="h-4 w-4" />}
          >
            Hapus / Clear
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">Selamat datang di Asisten AI!</p>
            <p className="text-sm mb-3">
              Tanyakan apa saja tentang barang-barang di inventori kami. Saya dapat membantu Anda mencari produk,
              mengecek ketersediaan, membandingkan barang, dan lainnya.
            </p>
            <p className="text-xs text-gray-400">
              Welcome to AI Assistant! Ask me anything about inventory items.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <ChatMessageComponent key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-gray-50 rounded-b-lg">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={isLoading}
          placeholder="Tanyakan tentang barang di inventori... / Ask about inventory items..."
        />
      </div>
    </div>
  );
};

export default ChatInterface;
