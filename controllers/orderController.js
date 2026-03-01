import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";

export const checkout = asyncHandler(async (req, res) => {
  const { pickupDate, pickupTime, paymentMethod, selectedItemIds } = req.body;
  if (!pickupDate || !pickupTime || !paymentMethod) {
    res.status(400);
    throw new Error("Required fields missing");
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    res.status(400);
    throw new Error("Cart is empty");
  }

  const itemsToCheckout = cart.items.filter((item) =>
    selectedItemIds.includes(item._id.toString()),
  );
  if (itemsToCheckout.length === 0) {
    res.status(400);
    throw new Error("Invalid selection");
  }

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

  for (const item of itemsToCheckout) {
    const product = await Product.findById(item.product);
    product.countInStock -= item.quantity;
    await product.save();
  }

  // --- SPLIT ITEMS BY CATEGORY ---
  const customCakeItems = [];
  const premadeCakeItems = [];
  const bakeryItems = [];

  for (const item of itemsToCheckout) {
    const product = await Product.findById(item.product);
    const orderItem = {
      product: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      customization: item.customization,
      requiresApproval: !!item.customization?.isCustomBuild,
    };

    if (item.customization && item.customization.isCustomBuild) {
      customCakeItems.push(orderItem);
    } else if (product.category === "cake") {
      premadeCakeItems.push(orderItem);
    } else {
      bakeryItems.push(orderItem);
    }
  }

  const createdOrders = [];

  // --- 1. CUSTOM CAKE ORDER (Pending) ---
  if (customCakeItems.length > 0) {
    const customTotal = customCakeItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const customOrder = await Order.create({
      user: req.user._id,
      orderItems: customCakeItems,
      orderType: "custom_cake", // <--- FIX
      pickupDate,
      pickupTime,
      paymentMethod,
      totalPrice: customTotal,
      orderStatus: "pending",
    });
    createdOrders.push(customOrder);
  }

  // --- 2. PRE-MADE CAKE ORDER (Approved) ---
  if (premadeCakeItems.length > 0) {
    const premadeTotal = premadeCakeItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const premadeOrder = await Order.create({
      user: req.user._id,
      orderItems: premadeCakeItems,
      orderType: "cake",
      pickupDate,
      pickupTime,
      paymentMethod,
      totalPrice: premadeTotal,
      orderStatus: "approved",
    });
    createdOrders.push(premadeOrder);
  }

  // --- 3. BAKERY ORDER (Approved) ---
  if (bakeryItems.length > 0) {
    const bakeryTotal = bakeryItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const bakeryOrder = await Order.create({
      user: req.user._id,
      orderItems: bakeryItems,
      orderType: "bakery",
      pickupDate,
      pickupTime,
      paymentMethod,
      totalPrice: bakeryTotal,
      orderStatus: "approved",
    });
    createdOrders.push(bakeryOrder);
  }

  cart.items = cart.items.filter(
    (item) => !selectedItemIds.includes(item._id.toString()),
  );
  await cart.save();

  res.status(201).json({ message: "Order(s) placed", orders: createdOrders });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "firstName lastName email")
    .populate("orderItems.product", "image") // <--- FIX: Fetch Image for Admin Modal
    .sort({ createdAt: -1 });
  res.json(orders);
});

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
  res.json(order);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email")
    .populate("orderItems.product", "name price image");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json(order);
});
