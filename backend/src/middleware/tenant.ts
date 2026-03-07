import type { NextFunction, Request, Response } from "express";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const orgId = req.auth?.orgId;
  if (!orgId) {
    return res.status(403).json({ error: "Organization required for multi-tenant access" });
  }

  req.tenantId = orgId;
  return next();
}
