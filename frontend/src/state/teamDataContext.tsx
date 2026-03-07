import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { TeamData } from "@/types/teamData";
import { TeamDataContext } from "@/state/teamDataContextValue";

export function TeamDataProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const [teamData, setTeamDataState] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTeamData = useCallback((data: TeamData) => {
    setTeamDataState(data);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        setTeamDataState(null);
        return;
      }
      const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
      const response = await fetch(`${apiBase}/api/team-data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load team data");
      }
      const data = (await response.json()) as TeamData;
      setTeamDataState(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load team data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ teamData, loading, error, refresh, setTeamData }),
    [teamData, loading, error, refresh, setTeamData]
  );

  return <TeamDataContext.Provider value={value}>{children}</TeamDataContext.Provider>;
}
