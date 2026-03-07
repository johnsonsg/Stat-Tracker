import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";

type AuthRequest = Request & {
  auth?: {
    orgRole?: string | null;
    orgPermissions?: string[] | null;
  };
};

export const requireOrgRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const auth = getAuth(req) ?? {};
    const role = auth.orgRole ?? req.auth?.orgRole ?? null;
    const normalizedRoles = role
      ? [role, role.includes(":") ? null : `org:${role}`].filter(
          (candidate): candidate is string => Boolean(candidate)
        )
      : [];
    const hasRole = normalizedRoles.some((candidate) => roles.includes(candidate));

    if (!hasRole) {
      return res.status(403).json({ error: "Insufficient organization role" });
    }

    return next();
  };
};

export const requireOrgPermission = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const auth = getAuth(req) ?? {};
    const orgPermissions = auth.orgPermissions ?? req.auth?.orgPermissions ?? [];
    const hasPermission = permissions.every((permission) => orgPermissions.includes(permission));

    if (!hasPermission) {
      return res.status(403).json({ error: "Insufficient organization permissions" });
    }

    return next();
  };
};
