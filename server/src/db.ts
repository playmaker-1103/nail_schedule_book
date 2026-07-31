import mongoose from "mongoose";
import { config } from "./config.js";

let connectionPromise: Promise<void> | null = null;

export async function connectDb(uri = config.mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function ensureDb(uri = config.mongoUri) {
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    mongoose.set("strictQuery", true);
    connectionPromise = mongoose.connect(uri).then(() => undefined);
  }
  await connectionPromise;
}

export async function disconnectDb() {
  connectionPromise = null;
  await mongoose.disconnect();
}
