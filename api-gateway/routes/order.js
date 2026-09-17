const express = require("express");
const axios = require("axios");
const router = express.Router();

const ordersServiceUrl = process.env.ORDERS_SERVICE_URL || "http://localhost:8081";

const proxyOrderRequest = async (req, res, method = "get") => {
  try {
    const hasId = Boolean(req.params.orderId);
    const url = `${ordersServiceUrl}/api/orders${hasId ? `/${req.params.orderId}` : ""}` +
      (req.params.orderId && req.path.includes("/status") ? "/status" : "");

    const config = {
      method,
      url,
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
    const message = error.response?.data?.message || error.response?.data?.err || "Orders service error";
    return res.status(status).json({ message });
  }
};

router.get("/", async (req, res) => proxyOrderRequest(req, res, "get"));
router.get("/:orderId", async (req, res) => proxyOrderRequest(req, res, "get"));
router.post("/", async (req, res) => proxyOrderRequest(req, res, "post"));
router.patch("/:orderId/status", async (req, res) => proxyOrderRequest(req, res, "patch"));

module.exports = router;
