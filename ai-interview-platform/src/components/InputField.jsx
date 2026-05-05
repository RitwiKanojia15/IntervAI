import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const InputField = ({ label, hint, type = "text", error, className = "", ...props }) => {
  const [showPass, setShowPass] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPass ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`dark-input ${error ? "error" : ""} ${isPassword ? "pr-10" : ""}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "var(--text-dim)" }}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p className="text-xs" style={{ color: "var(--text-dim)" }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};
export default InputField;