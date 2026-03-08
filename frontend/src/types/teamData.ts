export type TeamPlayer = {
  id: string;
  name: string;
  number: string;
  position: string;
  positionGroup?: string[];
};

export type TeamScheduleGame = {
  id: string;
  opponent: string;
  dateTime: string;
  location: string;
};

export type TeamData = {
  teamName: string | null;
  players: TeamPlayer[];
  schedule: TeamScheduleGame[];
};
