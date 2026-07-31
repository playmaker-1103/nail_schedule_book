import type { Request, Response } from "express";

let appPromise: Promise<(req: Request, res: Response) => unknown> | null = null;

export async function handleVercelRequest(req: Request, res: Response) {
  if (!appPromise) {
    appPromise = import("./app.js").then(({ createApp }) => createApp());
  }

  const app = await appPromise;
  return app(req, res);
}
