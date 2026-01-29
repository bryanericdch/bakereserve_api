import crypto from "crypto";
import Order from "../models/Order.js";

export const paymongoWebhook = async (req, res) => {
  const signature = req.headers["paymongo-signature"];
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

  const payload = req.body;

  // Verify signature
  const computedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (signature !== computedSignature) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  const event = JSON.parse(payload.toString());

  const eventType = event.data.attributes.type;
  const paymentIntentId =
    event.data.attributes.data.attributes.payment_intent_id;

  const order = await Order.findOne({ paymentIntentId });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // ✅ PAYMENT SUCCESS
  if (eventType === "payment.paid") {
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentStatus = "paid";
    await order.save();
  }

  // ❌ PAYMENT FAILED
  if (eventType === "payment.failed") {
    order.paymentStatus = "failed";
    await order.save();
  }

  res.status(200).json({ received: true });
};
