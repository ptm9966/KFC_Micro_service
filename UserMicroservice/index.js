require("dotenv").config();

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const connect = require("./config/db");
const swaggerSpecs = require("./config/swagger");
const userRouter = require("./features/user/user.route");

const PORT = process.env.PORT || 8082;
const app = express();

const auth0Issuer = process.env.AUTH0_ISSUER || "https://dev-6l85tc0ex15xt2oe.us.auth0.com/";
const auth0Audience = process.env.AUTH0_AUDIENCE || "http://localhost:8082";

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${auth0Issuer}.well-known/jwks.json`,
  }),
  audience: auth0Audience,
  issuer: auth0Issuer,
  algorithms: ["RS256"],
});

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

app.get("/api/me", checkJwt, (req, res) => {
  res.json({
    authenticated: true,
    user: req.auth,
    message: "Valid Auth0 token received",
  });
});

app.use("/auth", userRouter);
app.use(checkJwt);

app.use((err, req, res, next) => {
  if (err.name === "UnauthorizedError") {
    return res.status(401).json({ message: "Invalid or missing Auth0 token", error: err.message });
  }

  next(err);
});

app.listen(PORT, async () => {
    await connect();
    console.log(`User Microservice listening at http://localhost:${PORT}`);
});