import React, { useState, useRef, useEffect } from "react";
import Button from "../ui/Button";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = "Type your message...",
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex items-end space-x-2">
        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={`w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
            }`}
            style={{
              minHeight: "40px",
              maxHeight: "120px",
            }}
          />

          {/* Attachment Button (placeholder for future feature) */}
          <button
            type="button"
            className="absolute right-2 bottom-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={disabled}
            title="Attach file (coming soon)"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </div>

        {/* Send Button */}
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || !message.trim()}
          icon={<Send className="h-4 w-4" />}
          className="flex-shrink-0"
        >
          Send
        </Button>
      </div>

      {/* Quick Actions - App Information */}
      <div className="mt-2 flex flex-wrap gap-2">
        {/* Indonesian Quick Actions */}
        <button
          type="button"
          onClick={() => setMessage("Siapa yang membuat aplikasi ini?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors"
        >
          🇮🇩 Siapa developer?
        </button>
        <button
          type="button"
          onClick={() => setMessage("Apa kegunaan aplikasi Gudang Mitra?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-colors"
        >
          🇮🇩 Kegunaan aplikasi
        </button>
        <button
          type="button"
          onClick={() => setMessage("Bagaimana cara menggunakan aplikasi ini?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full transition-colors"
        >
          🇮🇩 Cara penggunaan
        </button>
        <button
          type="button"
          onClick={() => setMessage("Apa saja fitur yang tersedia?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full transition-colors"
        >
          🇮🇩 Fitur aplikasi
        </button>

        {/* English Quick Actions */}
        <button
          type="button"
          onClick={() => setMessage("Who developed this application?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 Who's the developer?
        </button>
        <button
          type="button"
          onClick={() => setMessage("Why should I use this app?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 Why use this app?
        </button>
        <button
          type="button"
          onClick={() => setMessage("How do I use this application?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 How to use
        </button>
        <button
          type="button"
          onClick={() => setMessage("What features are available?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 App features
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
