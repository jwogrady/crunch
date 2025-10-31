import React from "react";

// Shared UI Components
export const Card = ({ 
  children, 
  title, 
  className = "" 
}: { 
  children: React.ReactNode; 
  title?: string; 
  className?: string;
}) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
    {title && <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>}
    {children}
  </div>
);

export const Button = ({ 
  children, 
  onClick, 
  loading = false, 
  type = "default", 
  size = "medium",
  className = "",
  disabled = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  loading?: boolean;
  type?: "primary" | "default" | "danger";
  size?: "small" | "medium" | "large";
  className?: string;
  disabled?: boolean;
}) => {
  const baseStyles = "font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const typeStyles = {
    primary: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    default: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
  };
  const sizeStyles = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg"
  };
  
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`${baseStyles} ${typeStyles[type]} ${sizeStyles[size]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  );
};

export const Input = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder,
  multiline = false,
  rows = 3,
  error
}: { 
  label: string; 
  type?: string; 
  value: string | number | string[] | undefined; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  error?: string;
}) => {
  const Component = multiline ? "textarea" : "input";
  const displayValue = typeof value === "string" 
    ? value 
    : typeof value === "number" 
      ? value 
      : Array.isArray(value) 
        ? value.join(", ") 
        : "";

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <Component
        type={type}
        value={displayValue}
        onChange={onChange}
        placeholder={placeholder}
        rows={multiline ? rows : undefined}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-green-500 ${
          error ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-green-500"
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      {Array.isArray(value) && !error && (
        <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
      )}
    </div>
  );
};

export const Alert = ({ 
  children, 
  variant = "danger", 
  title,
  onClose
}: { 
  children: React.ReactNode; 
  variant?: "danger" | "success" | "info";
  title?: string;
  onClose?: () => void;
}) => {
  const variantStyles = {
    danger: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-800"
  };

  return (
    <div className={`p-4 rounded-md border ${variantStyles[variant]}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div>{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Toast notification component
export const Toast = ({ 
  message, 
  type = "info", 
  onClose 
}: { 
  message: string; 
  type?: "success" | "error" | "info";
  onClose: () => void;
}) => {
  const typeStyles = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600"
  };

  return (
    <div className={`fixed top-4 right-4 ${typeStyles[type]} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-slide-in`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:opacity-75">×</button>
    </div>
  );
};

