require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const connect = require("./config/db");
const swaggerSpecs = require("./config/swagger");
const userRouter = require("./features/user/user.route");

const PORT = process.env.PORT || 8082;
const app = express();

app.use(express.json());
app.use(cors());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui { font-family: Arial, sans-serif; }',
  customSiteTitle: 'User Microservice API Documentation'
}));

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.use("/auth", userRouter);

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Root health check for User Microservice
 *     description: Returns overall service status (used for liveness/readiness probes)
 *     responses:
 *       200:
 *         description: Service is healthy
 */
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, async () => {
    await connect();
    console.log(`User Microservice listening at http://localhost:${PORT}`);
});