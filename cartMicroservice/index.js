require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const connect = require("./config/db");
const swaggerSpecs = require("./config/swagger");
const cartRouter = require("./features/cart/cart.route");

const PORT = process.env.PORT || 8080;
const app = express();

app.use(express.json());
app.use(cors());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui { font-family: Arial, sans-serif; }',
  customSiteTitle: 'KFC API Documentation'
}));

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

// Cart management endpoint (local to backend)
app.use("/api", cartRouter);

/**
 * @swagger
 * /healthz:
 *   get:
 *     summary: Root health check for Cart microservice
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
    console.log(`Cart microservice listening at http://localhost:${PORT}`);
});

