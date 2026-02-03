import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// @desc Add item to cart
// @route POST /api/cart
// @access Private
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, customization } = req.body;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
    });
  }
  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId,
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
      customization,
    });
  }

  await cart.save();
  res.status(200).json(cart);
});

// @desc Get user cart
// @route GET /api/cart
// @access Private
export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate(
    "items.product",
    "name image category",
  );

  if (!cart) {
    return res.json({ items: [] });
  }

  res.json(cart);
});

// ... existing imports
// ... existing addToCart and getCart

// @desc Update cart item quantity
// @route PUT /api/cart/:itemId
// @access Private
export const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const productId = req.params.itemId;

  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Option: If quantity is 0, remove the item
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();
      // Re-populate to return full object
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
// @access Private
export const removeCartItem = asyncHandler(async (req, res) => {
  const productId = req.params.itemId;

  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
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
// @access Private
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (cart) {
    cart.items = [];
    await cart.save();
    res.json(cart);
  } else {
    res.status(404);
    throw new Error("Cart not found");
  }
});
// export const addToCart = asyncHandler(async (req, res) => {
//   const { productId, quantity, customization } = req.body;

//   let order = await Order.findOne({
//     user: req.user._id,
//     status: "cart",
//   });

//   if (!order) {
//     order = new Order({
//       user: req.user._id,
//       items: [],
//       status: "cart",
//     });
//   }

//   const existingItem = order.items.find(
//     (item) => item.product.toString() === productId,
//   );
//   if (existingItem) {
//     existingItem.quantity += quantity;
//   } else {
//     order.items.push({
//       product: productId,
//       quantity,
//       customization,
//     });
//   }

//   await order.save();
//   res.json(order);
// });
