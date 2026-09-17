const express = require("express");
const axios = require("axios");
const router = express.Router();

const usersServiceUrl = process.env.USERS_SERVICE_URL || "http://localhost:8082";

router.get("/profile", async (req, res) => {
  try {
    const response = await axios.get(`${usersServiceUrl}/auth/profile`, {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    res.json(response.data);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || "User service error";
    res.status(status).json({ message });
  }
});

module.exports = router;
