import React from "react";
const Card = ({ children, className = "", hover = false, onClick }) => (
  <div
    onClick={onClick}
    className={`dash-card ${hover ? "cursor-pointer hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]" : ""} ${className}`}
  >
    {children}
  </div>
);
export default Card;