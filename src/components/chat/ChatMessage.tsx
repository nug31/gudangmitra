import React from "react";
import { ChatMessage } from "../../types";
import { User, Bot, Loader2 } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessage;
}

const ChatMessageComponent: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const isLoading = message.isLoading;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start space-x-2`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? "ml-2" : "mr-2"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {isUser ? (
              <User className="h-4 w-4" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          <div
            className={`px-4 py-2 rounded-lg ${
              isUser
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-900"
            } ${isLoading ? "animate-pulse" : ""}`}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Sedang berpikir... / Thinking...</span>
              </div>
            ) : (
              <div className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </div>
            )}
          </div>

          {/* Timestamp */}
          {!isLoading && (
            <div className="text-xs text-gray-500 mt-1 px-1">
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessageComponent;
