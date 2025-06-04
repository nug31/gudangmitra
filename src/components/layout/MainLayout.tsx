import React, { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import ChatButton from "../chat/ChatButton";

interface MainLayoutProps {
  children: ReactNode;
  fullWidth?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  fullWidth = false,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-secondary-200/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-accent-200/30 to-primary-200/30 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-secondary-100/20 to-primary-100/20 rounded-full blur-3xl animate-float"></div>
      </div>

      <Navbar />
      <main className="flex-grow relative z-10">
        <div
          className={`${
            fullWidth ? "w-full" : "max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8"
          }`}
        >
          {children}
        </div>
      </main>
      <Footer />

      {/* Floating Chat Button */}
      <ChatButton />
    </div>
  );
};

export default MainLayout;
