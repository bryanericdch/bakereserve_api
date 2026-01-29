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
