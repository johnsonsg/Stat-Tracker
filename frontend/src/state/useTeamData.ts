import { useContext } from "react";
import { TeamDataContext } from "@/state/teamDataContextValue";

export function useTeamData() {
  const ctx = useContext(TeamDataContext);
  if (!ctx) {
    throw new Error("useTeamData must be used within TeamDataProvider");
  }
  return ctx;
}
