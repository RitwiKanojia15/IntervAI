import React, { useEffect, useRef } from "react";
const PageWrapper = ({ children, className = "" }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.opacity = "0";
    ref.current.style.transform = "translateY(18px)";
    const t = setTimeout(() => {
      if (!ref.current) return;
      ref.current.style.transition = "opacity 420ms ease, transform 420ms ease";
      ref.current.style.opacity = "1";
      ref.current.style.transform = "translateY(0)";
    }, 16);
    return () => clearTimeout(t);
  }, []);
  return <div ref={ref} className={className}>{children}</div>;
};
export default PageWrapper;