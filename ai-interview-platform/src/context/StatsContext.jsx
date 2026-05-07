import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyStats } from "../services/api";
import { useAuth } from "./AuthContext";

const StatsContext = createContext(null);

export const StatsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) { setStats(null); return; }
    setLoading(true);
    try {
      const res = await getMyStats();
      setStats(res.data.stats);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch on mount and when auth changes
  useEffect(() => { refresh(); }, [refresh]);

  // Refresh every 5 minutes (realtime analytics)
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(refresh, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, refresh]);

  // Refresh when user returns to the tab (streak updates on daily login)
  useEffect(() => {
    if (!isAuthenticated) return;
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isAuthenticated, refresh]);

  // Refresh when user navigates back to the page
  useEffect(() => {
    if (!isAuthenticated) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAuthenticated, refresh]);

  return (
    <StatsContext.Provider value={{ stats, loading, refresh }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error("useStats must be used within StatsProvider");
  return ctx;
};
