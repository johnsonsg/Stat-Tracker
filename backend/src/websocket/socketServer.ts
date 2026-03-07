import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinTenant", (tenantId: string) => {
      if (tenantId) {
        socket.join(tenantId);
      }
    });
  });

  return io;
}

export function emitTenantEvent(io: Server, tenantId: string, event: string, payload: unknown) {
  io.to(tenantId).emit(event, payload);
}
