import type { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
  const { handleVercelRequest } = await import("../server/src/vercelHandler.js");
  return handleVercelRequest(req, res);
}
