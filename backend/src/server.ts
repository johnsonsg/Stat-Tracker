import "dotenv/config";
import http from "http";
import open from "open";
import app from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { createSocketServer } from "./websocket/socketServer";

async function startServer() {
  try {
    await connectDB();

    const server = http.createServer(app);
    createSocketServer(server);

    server.listen(env.port, () => {
      console.log(`Stat Tracker API listening on ${env.port}`);
      if (env.nodeEnv !== "production") {
        void open(`http://localhost:${env.port}/swagger`);
      }
    });
  } catch (error) {
    console.error("MongoDB connection error", error);
    process.exit(1);
  }
}

void startServer();
