import type { NextFunction, Request, Response } from "express";

type AuthRequest = Request & {
  auth?: {
    orgRole?: string | null;
    orgPermissions?: string[] | null;
  };
};

export const requireOrgRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const role = req.auth?.orgRole ?? null;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ error: "Insufficient organization role" });
    }

    return next();
  };
};

export const requireOrgPermission = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const orgPermissions = req.auth?.orgPermissions ?? [];
    const hasPermission = permissions.every((permission) => orgPermissions.includes(permission));

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient organization permissions" });
    }

    return next();
  };
};
