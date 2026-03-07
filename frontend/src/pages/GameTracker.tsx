import { useNavigate, useParams } from "react-router-dom";
import StatEntryPage from "@/features/stat-entry/StatEntryPage";

export default function GameTracker() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  return (
    <StatEntryPage
      gameId={gameId ?? null}
      onSelectGame={(id) => {
        navigate(`/games/${id}`);
      }}
    />
  );
}