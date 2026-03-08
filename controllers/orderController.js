import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js"; // <-- NEEDED FOR CANCELLATION COUNT
import Notification from "../models/Notification.js"; // <-- NEEDED FOR NOTIFICATIONS

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

  if (customCakeItems.length > 0) {
    const customTotal = customCakeItems.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0,
    );
    const customOrder = await Order.create({
      user: req.user._id,
      orderItems: customCakeItems,
      orderType: "custom_cake",
      pickupDate,
      pickupTime,
      paymentMethod,
      totalPrice: customTotal,
      orderStatus: "pending",
    });
    createdOrders.push(customOrder);
  }

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
      orderStatus: "pending",
    });
    createdOrders.push(premadeOrder);
  }

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
      orderStatus: "pending",
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

// --- UPDATED: POPULATES USER ADDRESS & CONTACT FOR ADMIN ---
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "firstName lastName email contactNumber address")
    .populate("orderItems.product", "image")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// --- UPDATED: INCLUDES NOTIFICATION CREATION ---
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, rejectReason } = req.body;
  const updateData = { orderStatus: status };

  if (status === "approved") {
    updateData.approvedBy = req.user._id;
    updateData.approvedAt = new Date();
  }
  if (status === "cancelled" || status === "rejected") {
    updateData.cancelledAt = new Date();
  }

  const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: false,
  });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Create notification safely
  try {
    let notifMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} status was updated to: ${status.replace("_", " ")}.`;

    if (status === "approved")
      notifMessage = `Great news! Your order #${order._id.toString().slice(-6).toUpperCase()} has been approved and is now in process.`;
    else if (status === "ready_for_pickup")
      notifMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} is baked and ready for pickup!`;
    else if (status === "cancelled" || status === "rejected") {
      notifMessage = `Your order #${order._id.toString().slice(-6).toUpperCase()} was ${status}.`;
      if (rejectReason) notifMessage += ` Reason: ${rejectReason}`;
      else notifMessage += " Please contact us if you have questions.";
    }

    if (order.user) {
      await Notification.create({
        user: order.user,
        title: "Order Status Update",
        message: notifMessage,
      });
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }

  res.json(order);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "firstName lastName email contactNumber address")
    .populate("orderItems.product", "name price image");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json(order);
});

// --- NEW: FUNCTION TO HANDLE CUSTOMER CANCELLATIONS & COUNT STRIKES ---
export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Ensure the user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Not authorized to cancel this order");
  }
  if (order.orderStatus !== "pending") {
    res.status(400);
    throw new Error("Only pending orders can be cancelled.");
  }

  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();
  await order.save({ runValidators: false });

  // Update user's cancellation count
  const user = await User.findById(req.user._id);
  user.cancellationCount = (user.cancellationCount || 0) + 1;
  await user.save();

  // STRIKE 3 LOGIC: Notify Admins
  if (user.cancellationCount === 3) {
    const admins = await User.find({ role: "admin" });
    const notifications = admins.map((admin) => ({
      user: admin._id,
      title: "High Cancellation Alert ⚠",
      message: `Customer ${user.firstName} ${user.lastName} has cancelled 3 orders. Please review their account in the Users tab.`,
    }));
    if (notifications.length > 0) await Notification.insertMany(notifications);
  }

  res.json(order);
});
