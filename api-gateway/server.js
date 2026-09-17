const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const checkJwt = require("./middleware/auth");
const routes = require("./routes");

dotenv.config();

const app = express();
const port = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.use(checkJwt);
app.use("/api", routes);

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Invalid or missing token" });
  }

  console.error(err);
  return res.status(500).json({ message: "Gateway internal error" });
});

app.listen(port, () => {
  console.log(`API Gateway listening on http://localhost:${port}`);
});
