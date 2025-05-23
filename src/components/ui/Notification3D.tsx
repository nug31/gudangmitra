import React, { useState, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

interface Notification3DProps {
  type?: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | "top-center";
  variant?: "default" | "glass" | "neon";
}

const Notification3D: React.FC<Notification3DProps> = ({
  type = "info",
  title,
  message,
  duration = 5000,
  onClose,
  position = "top-right",
  variant = "default",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle,
          bgColor: "from-green-500 to-emerald-500",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          bgClass: "bg-green-50/90",
        };
      case "error":
        return {
          icon: XCircle,
          bgColor: "from-red-500 to-rose-500",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          bgClass: "bg-red-50/90",
        };
      case "warning":
        return {
          icon: AlertCircle,
          bgColor: "from-yellow-500 to-orange-500",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          bgClass: "bg-yellow-50/90",
        };
      default:
        return {
          icon: Info,
          bgColor: "from-blue-500 to-cyan-500",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          bgClass: "bg-blue-50/90",
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      default:
        return "top-4 right-4";
    }
  };

  const getVariantClasses = () => {
    const config = getTypeConfig();
    switch (variant) {
      case "glass":
        return `bg-white/10 backdrop-blur-md border border-white/20 shadow-glass`;
      case "neon":
        return `${config.bgClass} backdrop-blur-sm border ${config.borderColor} shadow-neon`;
      default:
        return `${config.bgClass} backdrop-blur-sm border ${config.borderColor} shadow-3d`;
    }
  };

  if (!isVisible) return null;

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed z-50 max-w-sm w-full mx-auto
        ${getPositionClasses()}
        ${isLeaving ? "animate-pulse opacity-0 scale-95" : "animate-float"}
        transition-all duration-300 ease-in-out
      `}
    >
      <div
        className={`
          ${getVariantClasses()}
          rounded-xl p-4 group hover:shadow-3d-hover transition-all duration-300
        `}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 mr-3 p-2 rounded-full bg-gradient-to-r ${config.bgColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-gray-800 transition-colors duration-300">
              {title}
            </h4>
            {message && (
              <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                {message}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-gray-200/50 transition-colors duration-200 group"
          >
            <X className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
          </button>
        </div>
        
        {/* Progress bar */}
        {duration > 0 && (
          <div className="mt-3 w-full bg-gray-200/50 rounded-full h-1 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${config.bgColor} rounded-full animate-pulse`}
              style={{
                animation: `shrink ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Notification Manager Hook
export const useNotification = () => {
  const [notifications, setNotifications] = useState<Array<Notification3DProps & { id: string }>>([]);

  const addNotification = (notification: Omit<Notification3DProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = {
      ...notification,
      id,
      onClose: () => removeNotification(id),
    };
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const NotificationContainer = () => (
    <>
      {notifications.map(notification => (
        <Notification3D key={notification.id} {...notification} />
      ))}
    </>
  );

  return {
    addNotification,
    removeNotification,
    NotificationContainer,
    success: (title: string, message?: string) => addNotification({ type: 'success', title, message }),
    error: (title: string, message?: string) => addNotification({ type: 'error', title, message }),
    warning: (title: string, message?: string) => addNotification({ type: 'warning', title, message }),
    info: (title: string, message?: string) => addNotification({ type: 'info', title, message }),
  };
};

export default Notification3D;
