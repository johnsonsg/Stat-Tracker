import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import { clerkAuthMiddleware, requireAuthMiddleware } from "./middleware/auth";
import { tenantMiddleware } from "./middleware/tenant";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import apiRoutes from "./routes";
import testRoutes from "./routes/test.routes";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(requestLogger);
app.use(clerkAuthMiddleware);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/swagger.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
app.use("/api", requireAuthMiddleware, tenantMiddleware);
app.use("/api", apiRoutes);
app.use("/api", testRoutes);

app.use(errorHandler);

export default app;
