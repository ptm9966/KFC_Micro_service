const express = require("express");
const router = express.Router();

router.use("/users", require("./user"));
router.use("/orders", require("./order"));
router.use("/cart", require("./cart"));
router.use("/products", require("./product"));

module.exports = router;
