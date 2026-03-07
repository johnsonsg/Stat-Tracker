import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const { orgId } = getAuth(req);
  if (!orgId) {
    return res.status(403).json({ error: "Organization required for multi-tenant access" });
  }

  req.tenantId = orgId;
  return next();
}
