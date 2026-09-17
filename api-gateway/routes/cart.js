const express = require("express");
const axios = require("axios");
const router = express.Router();

const cartServiceUrl = process.env.CART_SERVICE_URL || "http://localhost:8080";

const proxyCartRequest = async (req, res, method = "get") => {
  try {
    const config = {
      method,
      url: `${cartServiceUrl}/api/cart${req.params.cartId ? `/${req.params.cartId}` : ""}`,
      headers: {
        Authorization: req.headers.authorization,
        "Content-Type": "application/json",
      },
      data: req.body,
    };

    const response = await axios(config);
    return res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.response?.data?.err || "Cart service error";
    return res.status(status).json({ message });
  }
};

router.get("/", async (req, res) => proxyCartRequest(req, res, "get"));
router.get("/:cartId", async (req, res) => proxyCartRequest(req, res, "get"));
router.post("/", async (req, res) => proxyCartRequest(req, res, "post"));
router.patch("/:cartId", async (req, res) => proxyCartRequest(req, res, "patch"));
router.delete("/", async (req, res) => proxyCartRequest(req, res, "delete"));
router.delete("/:cartId", async (req, res) => proxyCartRequest(req, res, "delete"));

module.exports = router;
