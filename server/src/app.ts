import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler, notFound } from "./errors.js";
import { createSupabaseRepository } from "./repository/supabase.js";
import type { DiaryRepository } from "./repository/types.js";
import { bookingsRouter } from "./routes/bookings.js";
import { servicesRouter } from "./routes/services.js";
import { staffRouter } from "./routes/staff.js";

export function createApp(repository: DiaryRepository = createSupabaseRepository()) {
  const app = express();
  app.locals.repository = repository;

  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/bookings", bookingsRouter);
  app.use("/api/staff", staffRouter);
  app.use("/api/services", servicesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
