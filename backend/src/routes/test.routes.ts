import { Router } from "express";

const router = Router();

router.get("/test", (req, res) => {
  const userId = req.auth?.userId ?? null;
  const tenantId = req.tenantId ?? null;

  res.json({
    message: "Authenticated request",
    userId,
    tenantId
  });
});

export default router;
