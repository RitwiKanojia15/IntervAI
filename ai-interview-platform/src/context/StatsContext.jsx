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

  useEffect(() => { refresh(); }, [refresh]);

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
