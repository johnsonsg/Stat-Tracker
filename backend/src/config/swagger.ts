import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Stat Tracker API",
      version: "1.0.0",
      description: "API documentation for the Stat Tracker backend"
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local development"
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: [
    path.join(process.cwd(), "src/app.ts"),
    path.join(process.cwd(), "src/routes/*.ts"),
    path.join(process.cwd(), "src/modules/**/*.ts")
  ]
});

export default swaggerSpec;
