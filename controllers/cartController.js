import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, customization } = req.body; // <--- Extract customization

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  // Check if item already exists with the SAME customization
  // We use JSON.stringify to compare objects roughly, or you can use a deep equal library
  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      JSON.stringify(item.customization || {}) ===
        JSON.stringify(customization || {}),
  );

  if (itemIndex > -1) {
    // If exact same item + customization exists, just update quantity
    cart.items[itemIndex].quantity += quantity;
  } else {
    // Add new item with customization
    cart.items.push({
      product: productId,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
      customization: customization || {}, // <--- Save it here
    });
  }

  await cart.save();
  res.status(201).json(cart);
});

// ... (Keep getCart, removeItem, clearCart as they are)
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json(cart ? cart.items : []);
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter(
      (item) => item._id.toString() !== req.params.itemId, // Use Item ID to remove specific variation
    );
    await cart.save();
    res.json(cart.items);
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
