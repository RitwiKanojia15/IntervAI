import React from "react";

const Background = ({ variant = "auth" }) => {
  if (variant === "auth") {
    return (
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Base */}
        <div className="absolute inset-0 bg-[#f8f8ff]" />
        {/* Blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30 animate-pulse2"
          style={{ background: "radial-gradient(circle, #5c4fff44, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20 animate-pulse2"
          style={{ background: "radial-gradient(circle, #9333ea44, transparent 70%)", animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] right-[15%] w-[300px] h-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #ec489944, transparent 70%)" }} />
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#5c4fff 1px, transparent 1px), linear-gradient(90deg, #5c4fff 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[#f8f8ff]" />
      <div className="absolute top-0 left-0 right-0 h-64 opacity-40"
        style={{ background: "linear-gradient(180deg, #ebebff 0%, transparent 100%)" }} />
      <div className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#5c4fff 1px, transparent 1px), linear-gradient(90deg, #5c4fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
    </div>
  );
};

export default Background;
