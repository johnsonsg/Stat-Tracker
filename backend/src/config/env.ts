export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? ""
};
