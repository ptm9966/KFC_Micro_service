const { Router } = require("express");
const Cart = require("./cart.model");
const cartRouter = Router();

const normalizeCartItem = (item = {}) => {
  const itemId = item._id || item.productId || item.id;
  return {
    ...item,
    _id: itemId,
    productId: item.productId || itemId,
    title: item.title || item.name,
    image: item.image || item.img,
    desc: item.desc || item.description,
    price: Number(item.price) || 0,
    qty: Number(item.qty) || 1,
  };
};

const extractCartId = (rawId) => {
  if (!rawId) return null;
  const id = String(rawId).replace(/^:/, "");
  return id.includes(":") ? id.split(":").pop() : id;
};

cartRouter.get("/cart", async (req, res) => {
  try {
    const cart = await Cart.find().sort({ createdAt: -1 });
    return res.status(200).send(cart);
  } catch (error) {
    console.log(error);
    res.status(401).send({ err: "Something went wrong" });
  }
});

cartRouter.post("/cart", async (req, res) => {
  try {
    const payload = normalizeCartItem(req.body);
    const cartId = payload._id;

    if (!cartId) {
      return res.status(400).send({ message: "Product ID is required" });
    }

    const existing = await Cart.findById(cartId);

    if (existing) {
      const nextQty = Number(existing.qty || 0) + Number(payload.qty || 1);
      existing.qty = nextQty;
      existing.price = payload.price || existing.price;
      await existing.save();
      return res.status(200).send({
        message: "Cart item quantity updated successfully",
        item: existing,
      });
    }

    const newCart = new Cart(payload);
    await newCart.save();
    return res.status(200).send({ message: "Cart added successfully", item: newCart });
  } catch (error) {
    console.log(error);
    return res.status(401).send({ err: "Something went wrong" });
  }
});

cartRouter.delete("/cart/:cartId", async (req, res) => {
  try {
    const cartId = extractCartId(req.params.cartId);
    const existing = await Cart.findById(cartId);

    if (!existing) {
      return res.status(401).send({ message: "Product already deleted from cart" });
    }

    await Cart.findByIdAndDelete(cartId);
    return res.status(200).send({ message: "Cart item deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).send({ err: "Something went wrong" });
  }
});

cartRouter.patch("/cart/:cartId", async (req, res) => {
  try {
    const cartId = extractCartId(req.params.cartId);
    const payload = normalizeCartItem({ ...req.body, _id: req.body._id || cartId });

    const existing = await Cart.findById(cartId);
    if (!existing) {
      return res.status(404).send({ message: "Cart item not found" });
    }

    const updated = await Cart.findByIdAndUpdate(cartId, payload, { new: true });
    return res.status(200).send({ message: "Cart item updated successfully", item: updated });
  } catch (error) {
    console.log(error);
    return res.status(401).send({ err: "Something went wrong" });
  }
});

cartRouter.delete("/cart", async (req, res) => {
  try {
    await Cart.deleteMany({});
    return res.status(200).send({ message: "Cart cleared successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ err: "Something went wrong" });
  }
});

module.exports = cartRouter;