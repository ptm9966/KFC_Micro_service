const { Router } = require("express");
const mongoose = require("mongoose");
const Order = require("./order.model");

const orderRouter = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get orders
 *     description: Retrieve all orders, optionally filtered by userId
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter orders by user ID
 *     responses:
 *       200:
 *         description: List of orders
 *       500:
 *         description: Error retrieving orders
 */
orderRouter.get("/orders", async (req, res) => {
  try {
    const filter = req.query.userId ? { userId: req.query.userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.status(200).send(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({ err: "Something went wrong" });
  }
});

/**
 * @swagger
 * /api/orders/healthz:
 *   get:
 *     summary: Health check for Orders microservice
 *     description: Returns service and database connection status
 *     tags:
 *       - Orders
 *     responses:
 *       200:
 *         description: Service is healthy
 */
orderRouter.get('/orders/healthz', (req, res) => {
  const dbState = mongoose.connection && mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : (dbState === 0 ? 'disconnected' : 'connecting/unknown');

  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    db: dbStatus
  });
});
/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Get order by ID
 *     description: Retrieve a single order by MongoDB order ID
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 */
orderRouter.get("/orders/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.status(200).send(order);
  } catch (error) {
    console.log(error);
    res.status(500).send({ err: "Something went wrong" });
  }
});

/**
 * @swagger
 * /api/orders/{orderId}/status:
 *   patch:
 *     summary: Update order status
 *     description: Change the status of an order
 *     tags:
 *       - Orders
 *     parameters:
 *       - in: path
 *         name: orderId
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: Processing
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       400:
 *         description: Status is required
 *       404:
 *         description: Order not found
 */
orderRouter.patch("/orders/:orderId/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).send({ message: "Status is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.status(200).send({ message: "Order status updated successfully", order });
  } catch (error) {
    console.log(error);
    res.status(500).send({ err: "Something went wrong" });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order
 *     description: Create an order from supplied items
 *     tags:
 *       - Orders
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               userName:
 *                 type: string
 *               userMobile:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     title:
 *                       type: string
 *                     image:
 *                       type: string
 *                     desc:
 *                       type: string
 *                     price:
 *                       type: number
 *                     qty:
 *                       type: number
 *               paymentMethod:
 *                 type: string
 *               totalPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Items are required
 *       500:
 *         description: Error creating order
 */
orderRouter.post("/orders", async (req, res) => {
  try {
    const { items, userId, userName, userMobile, paymentMethod, totalPrice } = req.body;

    if (!items || !items.length) {
      return res.status(400).send({ message: "Items are required" });
    }

    const orderItems = items.map((item) => ({
      productId: item.productId || item._id,
      title: item.title,
      image: item.image,
      desc: item.desc,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 1,
    }));

    const totalItems = orderItems.reduce((sum, item) => sum + item.qty, 0);
    const itemTotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = await Order.create({
      userId,
      userName,
      userMobile,
      items: orderItems,
      totalItems,
      totalPrice: Number(totalPrice) || itemTotal,
      paymentMethod: paymentMethod || "Card",
      status: "Placed",
    });

    res.status(201).send({ message: "Order placed successfully", order });
  } catch (error) {
    console.log(error);
    res.status(500).send({ err: "Something went wrong" });
  }
});

module.exports = orderRouter;