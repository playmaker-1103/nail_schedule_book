import mongoose from "mongoose";
import { config } from "./config.js";

export async function connectDb(uri = config.mongoUri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
