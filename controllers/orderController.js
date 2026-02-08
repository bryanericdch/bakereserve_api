import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";

// @desc Checkout cart and create order
// @route POST /api/orders/checkout
// @access Private
export const checkout = asyncHandler(async (req, res) => {
  const { pickupDate, pickupTime, paymentMethod } = req.body;

  // Validate input
  if (!pickupDate || !pickupTime || !paymentMethod) {
    res.status(400);
    throw new Error(
      "Pickup date, pickup time, and payment method are required",
    );
  }

  // Validate pickup date (must be future)
  const pickup = new Date(pickupDate);
  if (pickup < new Date()) {
    res.status(400);
    throw new Error("Pickup date must be in the future");
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  // 1. Check if everything is in stock FIRST (Atomic-like check)
  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.name}`);
    }

    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(
        `Not enough stock for ${item.name}. Only ${product.countInStock} left.`,
      );
    }
  }

  // 2. All checks passed, now deduct stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    product.countInStock = product.countInStock - item.quantity;
    await product.save();
  }

  let totalPrice = 0;
  let requiresApproval = false;

  const orderItems = cart.items.map((item) => {
    totalPrice += item.price * item.quantity;

    if (item.customization && Object.keys(item.customization).length > 0) {
      requiresApproval = true;
    }

    return {
      product: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization,
      requiresApproval: !!item.customization,
    };
  });

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    pickupDate,
    pickupTime,
    paymentMethod,
    totalPrice,
    orderStatus: requiresApproval ? "pending" : "approved",
  });

  // Clear cart
  cart.items = [];
  await cart.save();

  res.status(201).json(order);
});

// @desc Get logged-in user's orders
// @route GET /api/orders/my-orders
// @access Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });

  res.json(orders);
});

// @desc Get all orders (admin)
// @route Get /api/orders
// @access Admin
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "firstName lastName email")
    .populate("orderItems.product", "name category subCategory") // <--- ADDED THIS
    .sort({ createdAt: -1 });

  res.json(orders);
});

// @desc Update order status (Admin)
// @route PUT /api/orders/:id/status
// @access Admin
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = status;

  // Auto-track timestamps
  if (status === "approved") {
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
  }

  if (status === "cancelled" || status === "rejected") {
    order.cancelledAt = new Date();
  }

  const allowedStatuses = [
    "pending",
    "approved",
    "in_process",
    "ready_for_pickup",
    "completed",
    "cancelled",
    "rejected",
  ];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error("Invalid order status");
  }

  await order.save();
  res.json(order);
});

// @desc Get order by ID
// @route GET /api/orders/:id
// @access Private
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email")
    .populate("orderItems.product", "name price");

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Only owner or admin can view
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json(order);
});
