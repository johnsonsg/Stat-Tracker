import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionStorage } from "@/state/storage";

type PlayerFlags = {
  primary?: boolean;
  secondary?: boolean;
  starter?: boolean;
};

type PlayerFlagMap = Record<string, PlayerFlags>;

const STORAGE_KEY = "stat-tracker:player-flags";

const readFlags = (): PlayerFlagMap => {
  const storage = getSessionStorage();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as PlayerFlagMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export function usePlayerFlags() {
  const [flags, setFlags] = useState<PlayerFlagMap>(() => readFlags());

  useEffect(() => {
    const storage = getSessionStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify(flags));
  }, [flags]);

  const setFlag = useCallback((playerId: string, key: keyof PlayerFlags, value: boolean) => {
    setFlags((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [key]: value
      }
    }));
  }, []);

  const toggleFlag = useCallback((playerId: string, key: keyof PlayerFlags) => {
    setFlags((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [key]: !prev[playerId]?.[key]
      }
    }));
  }, []);

  const primaryIds = useMemo(
    () => Object.keys(flags).filter((id) => flags[id]?.primary),
    [flags]
  );
  const secondaryIds = useMemo(
    () => Object.keys(flags).filter((id) => flags[id]?.secondary),
    [flags]
  );
  const starterIds = useMemo(
    () => Object.keys(flags).filter((id) => flags[id]?.starter),
    [flags]
  );

  return {
    flags,
    setFlag,
    toggleFlag,
    primaryIds,
    secondaryIds,
    starterIds
  };
}
