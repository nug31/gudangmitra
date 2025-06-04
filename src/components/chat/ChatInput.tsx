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

      {/* Quick Actions - Bilingual */}
      <div className="mt-2 flex flex-wrap gap-2">
        {/* Indonesian Quick Actions */}
        <button
          type="button"
          onClick={() => setMessage("Apa saja barang yang tersedia saat ini?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors"
        >
          🇮🇩 Barang tersedia?
        </button>
        <button
          type="button"
          onClick={() => setMessage("Tampilkan barang yang stoknya rendah")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-full transition-colors"
        >
          🇮🇩 Stok rendah
        </button>
        <button
          type="button"
          onClick={() => setMessage("Apa saja produk elektronik yang ada?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-full transition-colors"
        >
          🇮🇩 Elektronik
        </button>
        <button
          type="button"
          onClick={() => setMessage("Bantu saya cari perlengkapan kantor")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full transition-colors"
        >
          🇮🇩 Perlengkapan kantor
        </button>

        {/* English Quick Actions */}
        <button
          type="button"
          onClick={() => setMessage("What items are currently in stock?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 What's in stock?
        </button>
        <button
          type="button"
          onClick={() => setMessage("Show me items that are running low")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 Low stock items
        </button>
        <button
          type="button"
          onClick={() => setMessage("What electronics do you have?")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 Electronics
        </button>
        <button
          type="button"
          onClick={() => setMessage("Help me find office supplies")}
          disabled={disabled}
          className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
        >
          🇺🇸 Office supplies
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
