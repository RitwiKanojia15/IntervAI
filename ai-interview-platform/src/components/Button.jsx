import React from "react";
import Spinner from "./Spinner";

const Button = ({
  children,
  variant = "teal",
  loading = false,
  icon: Icon,
  className = "",
  fullWidth = false,
  size = "md",
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold font-body transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  const variants = {
    teal:    "btn-teal",
    outline: "btn-outline",
    danger:  "bg-red-600 hover:bg-red-500 text-white rounded-[10px] px-6 py-3 text-sm",
  };
  const sizes = { sm: "text-xs px-4 py-2", md: "text-sm px-6 py-3", lg: "text-base px-8 py-4" };
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : Icon ? <Icon size={15} /> : null}
      {children}
    </button>
  );
};
export default Button;