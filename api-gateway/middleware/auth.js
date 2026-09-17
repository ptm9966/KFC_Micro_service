const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const issuer = process.env.AUTH0_ISSUER || "https://dev-6l85tc0ex15xt2oe.us.auth0.com/";
const audience = process.env.AUTH0_AUDIENCE || "http://localhost:8082";

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${issuer}.well-known/jwks.json`,
  }),
  audience,
  issuer,
  algorithms: ["RS256"],
});

module.exports = checkJwt;
