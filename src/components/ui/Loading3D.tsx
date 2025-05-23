import React from "react";

interface Loading3DProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "wave";
  color?: "primary" | "secondary" | "white";
  text?: string;
}

const Loading3D: React.FC<Loading3DProps> = ({
  size = "md",
  variant = "spinner",
  color = "primary",
  text,
}) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const colorClasses = {
    primary: "text-primary-600",
    secondary: "text-secondary-600",
    white: "text-white",
  };

  const renderSpinner = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
      <div className={`absolute inset-0 rounded-full border-4 border-transparent border-t-current ${colorClasses[color]} animate-spin`}></div>
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary-400/20 to-secondary-400/20 animate-pulse"></div>
    </div>
  );

  const renderDots = () => (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 animate-bounce shadow-lg`}
          style={{ animationDelay: `${i * 0.2}s` }}
        ></div>
      ))}
    </div>
  );

  const renderPulse = () => (
    <div className={`${sizeClasses[size]} relative`}>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 animate-ping opacity-75`}></div>
      <div className={`relative rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 ${sizeClasses[size]} shadow-neon`}></div>
    </div>
  );

  const renderWave = () => (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-2 bg-gradient-to-t from-primary-500 to-secondary-500 rounded-full animate-pulse shadow-sm"
          style={{
            height: `${12 + (i % 2) * 8}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s',
          }}
        ></div>
      ))}
    </div>
  );

  const renderVariant = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "wave":
        return renderWave();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {renderVariant()}
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary-400/20 to-secondary-400/20 blur-xl animate-pulse"></div>
      </div>
      {text && (
        <p className={`text-sm font-medium ${colorClasses[color]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
}> = ({ isLoading, children, text = "Loading..." }) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
        <Loading3D variant="spinner" size="lg" text={text} />
      </div>
    </div>
  );
};

// Full screen loading component
export const FullScreenLoading: React.FC<{ text?: string }> = ({
  text = "Loading...",
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90 backdrop-blur-sm">
      <div className="text-center">
        <Loading3D variant="pulse" size="xl" color="white" />
        <p className="mt-4 text-white text-lg font-medium animate-pulse">
          {text}
        </p>
      </div>
    </div>
  );
};

export default Loading3D;
