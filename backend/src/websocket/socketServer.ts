import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

let ioInstance: Server | null = null;

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    socket.on("joinGame", (gameId: string) => {
      if (gameId) {
        socket.join(`game:${gameId}`);
      }
    });

    socket.on("leaveGame", (gameId: string) => {
      if (gameId) {
        socket.leave(`game:${gameId}`);
      }
    });

    socket.on("joinTenant", (tenantId: string) => {
      if (tenantId) {
        socket.join(tenantId);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getSocketServer() {
  return ioInstance;
}

export function emitTenantEvent(io: Server, tenantId: string, event: string, payload: unknown) {
  io.to(tenantId).emit(event, payload);
}

export function emitGameEvent(io: Server, gameId: string, event: string, payload: unknown) {
  io.to(`game:${gameId}`).emit(event, payload);
}
