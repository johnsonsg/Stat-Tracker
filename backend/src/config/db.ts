import mongoose from "mongoose";
import { env } from "./env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = cached;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    if (!env.mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }

    cached.promise = mongoose.connect(env.mongoUri);
  }

  cached.conn = await cached.promise;
  console.log("MongoDB connected");
  return cached.conn;
}
