import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  bordered?: boolean;
  variant?: "default" | "glass" | "3d" | "floating" | "neon";
  glow?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  bordered = false,
  variant = "default",
  glow = false,
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "glass":
        return "bg-white/10 backdrop-blur-md border border-white/20 shadow-glass";
      case "3d":
        return "card-3d";
      case "floating":
        return "bg-white/90 backdrop-blur-sm border border-white/30 shadow-floating float";
      case "neon":
        return `bg-white/95 backdrop-blur-sm border border-primary-200 ${glow ? "shadow-neon animate-glow" : "shadow-3d"}`;
      default:
        return "bg-white shadow-card";
    }
  };

  const hoverClasses = hover
    ? variant === "3d"
      ? "" // 3D cards have their own hover effects
      : "transition-all duration-300 hover:shadow-3d-hover hover:-translate-y-1"
    : "";

  return (
    <div
      className={`
        rounded-xl overflow-hidden
        ${getVariantClasses()}
        ${hoverClasses}
        ${bordered ? "border border-gray-200" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = "",
  title,
  subtitle,
  action,
}) => {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {title || subtitle || action ? (
        <div className="flex justify-between items-start">
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

interface CardContentProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export const CardContent: React.FC<CardContentProps> = ({
  children,
  className = "",
  padded = true,
}) => {
  return (
    <div className={`${padded ? "px-6 py-4" : ""} ${className}`}>
      {children}
    </div>
  );
};

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`px-6 py-4 bg-gray-50 border-t border-gray-200 ${className}`}
    >
      {children}
    </div>
  );
};