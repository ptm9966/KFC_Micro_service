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

app.listen(PORT, async () => {
    await connect();
    console.log(`Backend listening at http://localhost:${PORT}`);
});

