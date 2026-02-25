import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";

// @desc Checkout selected items and create separate orders if needed
// @route POST /api/orders/checkout
// @access Private
export const checkout = asyncHandler(async (req, res) => {
  const { pickupDate, pickupTime, paymentMethod, selectedItemIds } = req.body;

  if (!pickupDate || !pickupTime || !paymentMethod) {
    res.status(400);
    throw new Error("Pickup date, time, and payment method are required");
  }

  if (!selectedItemIds || selectedItemIds.length === 0) {
    res.status(400);
    throw new Error("No items selected for checkout");
  }

  // Fetch Cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  // Filter only selected items
  const itemsToCheckout = cart.items.filter((item) =>
    selectedItemIds.includes(item._id.toString()),
  );

  if (itemsToCheckout.length === 0) {
    res.status(400);
    throw new Error("Invalid selection");
  }

  // --- VALIDATE STOCK FOR SELECTED ITEMS ---
  for (const item of itemsToCheckout) {
    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.name}`);
    }
    if (product.countInStock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${item.name}`);
    }
  }

  // --- DEDUCT STOCK ---
  for (const item of itemsToCheckout) {
    const product = await Product.findById(item.product);
    product.countInStock -= item.quantity;
    await product.save();
  }

  // --- SPLIT ITEMS BY CATEGORY ---
  const cakeItems = [];
  const bakeryItems = [];

  // We need to fetch full product details to check category
  // (The cart might only have the ID, so we loop and check)
  for (const item of itemsToCheckout) {
    const product = await Product.findById(item.product);

    const orderItem = {
      product: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization,
      requiresApproval:
        !!item.customization && Object.keys(item.customization).length > 0,
    };

    if (product.category === "cake") {
      cakeItems.push(orderItem);
    } else {
      bakeryItems.push(orderItem);
    }
  }

  const createdOrders = [];

  // --- CREATE CAKE ORDER ---
  if (cakeItems.length > 0) {
    const cakeTotal = cakeItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const cakeOrder = await Order.create({
      user: req.user._id,
      orderItems: cakeItems,
      orderType: "cake", // <--- Distinct Type
      pickupDate,
      pickupTime,
      paymentMethod,
      totalPrice: cakeTotal,
      orderStatus: "pending", // Cakes always start pending for approval
    });
    createdOrders.push(cakeOrder);
  }

  // --- CREATE BAKERY ORDER ---
  if (bakeryItems.length > 0) {
    const bakeryTotal = bakeryItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const bakeryOrder = await Order.create({
      user: req.user._id,
      orderItems: bakeryItems,
      orderType: "bakery", // <--- Distinct Type
      pickupDate,
      pickupTime,
      paymentMethod,
      totalPrice: bakeryTotal,
      orderStatus: "approved", // Bakery items can be auto-approved (or pending if you prefer)
    });
    createdOrders.push(bakeryOrder);
  }

  // --- REMOVE SELECTED ITEMS FROM CART ---
  cart.items = cart.items.filter(
    (item) => !selectedItemIds.includes(item._id.toString()),
  );
  await cart.save();

  res.status(201).json({ message: "Order(s) placed", orders: createdOrders });
});

// ... (Keep existing getMyOrders, getAllOrders, etc.)
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  // Populate 'user' for name/email
  const orders = await Order.find({})
    .populate("user", "firstName lastName email")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// (Keep updateOrderStatus, getOrderById as they were)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.orderStatus = status;
  if (status === "approved") {
    order.approvedBy = req.user._id;
    order.approvedAt = new Date();
  }
  if (status === "cancelled" || status === "rejected") {
    order.cancelledAt = new Date();
  }
  await order.save();
  let notifMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} status was updated to: ${status.replace("_", " ")}`;
  if (status === "approved")
    notifMessage = `Great news! Your order #${order._id.toString().slice(-6).toUpperCase()} has been approved.`;
  if (status === "ready_for_pickup")
    notifMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} is ready for pickup!`;

  await Notification.create({
    user: order.user,
    title: "Order Status Updated",
    message: notifMessage,
  });
  res.json(order);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email")
    .populate("orderItems.product", "name price");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (
    order.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("Not authorized");
  }
  res.json(order);
});
