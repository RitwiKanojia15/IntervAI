import React from "react";
const Spinner = ({ size = "md" }) => {
  const sz = size === "sm" ? "w-4 h-4" : size === "lg" ? "w-8 h-8" : "w-5 h-5";
  return (
    <div
      className={`${sz} rounded-full border-2 border-white/20 border-t-white animate-spin`}
    />
  );
};
export default Spinner;