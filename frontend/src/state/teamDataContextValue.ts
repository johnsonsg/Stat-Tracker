import { createContext } from "react";
import type { TeamData } from "@/types/teamData";

type TeamDataContextValue = {
  teamData: TeamData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setTeamData: (data: TeamData) => void;
};

export const TeamDataContext = createContext<TeamDataContextValue | null>(null);
