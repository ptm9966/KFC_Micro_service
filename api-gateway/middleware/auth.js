const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const issuer = process.env.AUTH0_ISSUER || "https://login.bikkam.online/";
const audience = process.env.AUTH0_ID_TOKEN_AUDIENCE || process.env.AUTH0_CLIENT_ID || "YrM6Y9CEDia7lM1b5UBZJJdD0IY97iDE";

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
