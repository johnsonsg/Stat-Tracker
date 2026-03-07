import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    tenantId?: string;
    auth?: {
      userId?: string | null;
      orgId?: string | null;
    };
  }
}
