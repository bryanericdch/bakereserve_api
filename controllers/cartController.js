import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc Add item to cart
// @route POST /api/cart
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, customization } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if item exists with same customization
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
      price: product.price,
      quantity,
      customization: customization || {},
    });
  }

  await cart.save();
  res.status(201).json(cart);
});

// @desc Get user cart
// @route GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name image category",
  );

  // Filter out null products (in case a product was deleted)
  if (cart && cart.items) {
    cart.items = cart.items.filter((item) => item.product !== null);
    if (cart.isModified("items")) {
      await cart.save();
    }
  }

  if (!cart) return res.json({ items: [] });
  res.json(cart);
});

// @desc Update cart item quantity
// @route PUT /api/cart/:itemId
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
      throw new Error("Item not found in cart");
    }
  } else {
    res.status(404);
    throw new Error("Cart not found");
  }
});

// @desc Remove single item from cart
// @route DELETE /api/cart/:itemId
export const removeCartItem = asyncHandler(async (req, res) => {
  // <--- ENSURE THIS NAME MATCHES
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

// @desc Clear entire cart
// @route DELETE /api/cart
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
