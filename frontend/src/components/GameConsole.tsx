import { Box } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";

export default function GameConsole() {
  const columns: GridColDef[] = [
    { field: "action", headerName: "Action", flex: 1, minWidth: 140 },
    { field: "key", headerName: "Hotkey", flex: 1, minWidth: 120 },
  ];

  const rows = [
    { id: 1, action: "RUN", key: "R" },
    { id: 2, action: "PASS", key: "P" },
    { id: 3, action: "SACK", key: "S" },
    { id: 4, action: "TACKLE", key: "T" },
    { id: 5, action: "INT", key: "I" },
    { id: 6, action: "FUMBLE", key: "F" },
  ];

  return (
    <Box sx={{ height: 360, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        disableRowSelectionOnClick
        hideFooter
      />
    </Box>
  );
}