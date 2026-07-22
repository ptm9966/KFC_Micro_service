require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const connect = require("./config/db");
const swaggerSpecs = require("./config/swagger");
const productRouter = require("./features/product/product.route");

const PORT = process.env.PORT || 8083;
const app = express();

app.use(express.json());
app.use(cors());

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui { font-family: Arial, sans-serif; }',
  customSiteTitle: 'Product Microservice API Documentation'
}));

app.get("/", (req, res) => {
  res.redirect("/api-docs");
});

app.use("/api", productRouter);

app.listen(PORT, async () => {
    await connect();
    console.log(`Product Microservice listening at http://localhost:${PORT}`);
});