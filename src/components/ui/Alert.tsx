import React from 'react';
import {
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  X
} from 'lucide-react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onDismiss,
  className = ''
}) => {
  const variantStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: <Info className="h-5 w-5 text-blue-400" />,
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: <AlertCircle className="h-5 w-5 text-amber-400" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="h-5 w-5 text-red-400" />,
    }
  };

  return (
    <div className={`rounded-md border p-4 ${variantStyles[variant].container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {variantStyles[variant].icon}
        </div>
        <div className="ml-3 flex-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          <div className={`text-sm ${title ? 'mt-2' : ''}`}>{children}</div>
        </div>
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${variant === 'info' ? 'text-blue-500 hover:bg-blue-100 focus:ring-blue-500' : ''}
                  ${variant === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-500' : ''}
                  ${variant === 'warning' ? 'text-amber-500 hover:bg-amber-100 focus:ring-amber-500' : ''}
                  ${variant === 'error' ? 'text-red-500 hover:bg-red-100 focus:ring-red-500' : ''}
                `}
              >
                <span className="sr-only">Dismiss</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Alert;