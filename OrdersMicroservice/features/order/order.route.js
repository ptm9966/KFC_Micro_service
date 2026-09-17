const { Router } = require("express");
const Order = require("./order.model");

const orderRouter = Router();

const normalizeOrderItems = (items = []) =>
  items.map((item) => ({
    productId: item.productId || item._id || item.id,
    title: item.title || item.name,
    image: item.image || item.img,
    desc: item.desc || item.description,
    price: Number(item.price) || 0,
    qty: Number(item.qty) || 1,
  }));

orderRouter.get("/orders", async (req, res) => {
  try {
    const filter = req.query.userId ? { userId: req.query.userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.status(200).send(orders);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ err: "Something went wrong" });
  }
});

orderRouter.get("/orders/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }
    return res.status(200).send(order);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ err: "Something went wrong" });
  }
});

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

    return res.status(200).send({ message: "Order status updated successfully", order });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ err: "Something went wrong" });
  }
});

orderRouter.post("/orders", async (req, res) => {
  try {
    const {
      items,
      userId,
      userName,
      userMobile,
      paymentMethod,
      totalPrice,
      totalItems,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).send({ message: "Items are required" });
    }

    const orderItems = normalizeOrderItems(items);
    const computedTotalItems = orderItems.reduce((sum, item) => sum + item.qty, 0);
    const computedTotalPrice = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = await Order.create({
      userId: userId || req.body.user?.id || req.body.user?._id,
      userName: userName || req.body.user?.name,
      userMobile: userMobile || req.body.user?.mobile,
      items: orderItems,
      totalItems: Number(totalItems) || computedTotalItems,
      totalPrice: Number(totalPrice) || computedTotalPrice,
      paymentMethod: paymentMethod || "Card",
      status: "Placed",
    });

    return res.status(201).send({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ err: "Something went wrong" });
  }
});

module.exports = orderRouter;