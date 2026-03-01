import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, customization } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  let itemPrice = product.price;
  if (customization && customization.size) {
    const sizeObj = product.sizes?.find((s) => s.size === customization.size);
    if (sizeObj) itemPrice += sizeObj.price;
  }

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      JSON.stringify(item.customization || {}) ===
        JSON.stringify(customization || {}),
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      name: product.name,
      image: product.image,
      price: itemPrice,
      quantity,
      customization: customization || {},
    });
  }

  await cart.save();
  res.status(201).json(cart);
});

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name image category",
  );
  if (cart && cart.items) {
    cart.items = cart.items.filter((item) => item.product !== null);
    if (cart.isModified("items")) await cart.save();
  }
  if (!cart) return res.json({ items: [] });
  res.json(cart);
});

export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === req.params.itemId,
    );
    if (itemIndex > -1) {
      if (quantity > 0) cart.items[itemIndex].quantity = quantity;
      else cart.items.splice(itemIndex, 1);
      await cart.save();
      await cart.populate("items.product", "name image price category");
      res.json(cart);
    } else {
      res.status(404);
      throw new Error("Item not found");
    }
  } else {
    res.status(404);
    throw new Error("Cart not found");
  }
});

export const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.itemId,
    );
    await cart.save();
    await cart.populate("items.product", "name image price category");
    res.json(cart);
  } else {
    res.status(404);
    throw new Error("Cart not found");
  }
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
    res.json([]);
  } else {
    res.status(404);
    throw new Error("Cart not found");
  }
});
