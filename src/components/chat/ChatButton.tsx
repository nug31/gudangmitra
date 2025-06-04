import React, { useState } from "react";
import { MessageSquare, X } from "lucide-react";
import ChatInterface from "./ChatInterface";

interface ChatButtonProps {
  className?: string;
}

const ChatButton: React.FC<ChatButtonProps> = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group ${className}`}
        title="Chat dengan Asisten AI / Chat with AI Assistant"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform group-hover:scale-110" />
        ) : (
          <MessageSquare className="h-6 w-6 transition-transform group-hover:scale-110" />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 h-[500px] shadow-2xl rounded-lg overflow-hidden border border-gray-200 bg-white">
          <ChatInterface className="h-full" />
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-25 md:hidden"
          onClick={toggleChat}
        />
      )}

      {/* Mobile Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-4 top-20 z-40 md:hidden rounded-lg overflow-hidden border border-gray-200 bg-white shadow-2xl">
          <ChatInterface className="h-full" />
        </div>
      )}
    </>
  );
};

export default ChatButton;
