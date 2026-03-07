import type { Request } from "express";

export function getTenantId(req: Request): string {
  const tenantId = (req as { tenantId?: string }).tenantId;
  if (!tenantId) {
    throw new Error("Tenant not resolved");
  }

  return tenantId;
}
