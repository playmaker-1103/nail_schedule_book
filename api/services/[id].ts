import type { Request, Response } from "express";

function rewriteNestedApiPath(req: Request) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (typeof id === "string" && id.length > 0) {
    req.url = `/api/services/${encodeURIComponent(id)}`;
  }
}

export default async function handler(req: Request, res: Response) {
  rewriteNestedApiPath(req);
  const { handleVercelRequest } = await import("../../server/src/vercelHandler.js");
  return handleVercelRequest(req, res);
}
