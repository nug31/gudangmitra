import { ChatMessage, ChatRequest, ChatResponse, ChatSession } from "../types";
import { API_BASE_URL } from "../config";

class ChatService {
  private debug = (message: string, ...args: any[]) => {
    console.log(`[ChatService] ${message}`, ...args);
  };

  // Send a chat message and get AI response
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      this.debug("Sending chat message:", request);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const chatResponse: ChatResponse = await response.json();
      this.debug("Received chat response:", chatResponse);

      return chatResponse;
    } catch (error) {
      console.error("Error sending chat message:", error);
      throw error;
    }
  }

  // Get chat session history
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      this.debug("Fetching chat session:", sessionId);

      const response = await fetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const session: ChatSession = await response.json();
      this.debug("Received chat session:", session);

      return session;
    } catch (error) {
      console.error("Error fetching chat session:", error);
      throw error;
    }
  }

  // Create a new chat session
  async createChatSession(userId: string): Promise<ChatSession> {
    try {
      this.debug("Creating new chat session for user:", userId);

      const response = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const session: ChatSession = await response.json();
      this.debug("Created chat session:", session);

      return session;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  }

  // Get user's chat sessions
  async getUserChatSessions(userId: string): Promise<ChatSession[]> {
    try {
      this.debug("Fetching chat sessions for user:", userId);

      const response = await fetch(`${API_BASE_URL}/api/chat/sessions?userId=${userId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const sessions: ChatSession[] = await response.json();
      this.debug("Received chat sessions:", sessions);

      return sessions;
    } catch (error) {
      console.error("Error fetching user chat sessions:", error);
      throw error;
    }
  }

  // Generate a unique message ID
  generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Create a user message
  createUserMessage(content: string): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };
  }

  // Create a loading assistant message
  createLoadingMessage(): ChatMessage {
    return {
      id: this.generateMessageId(),
      role: "assistant",
      content: "Thinking...",
      timestamp: new Date().toISOString(),
      isLoading: true,
    };
  }
}

export const chatService = new ChatService();
