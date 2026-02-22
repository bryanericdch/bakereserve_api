import axios from "axios";
import Order from "../models/Order.js";

// @desc Create a Payment Intent for multiple orders
export const createPaymentIntent = async (req, res) => {
  const { orderIds } = req.body; // Now expects an array of IDs

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400);
    throw new Error("Order IDs are required");
  }

  // Fetch all orders
  const orders = await Order.find({ _id: { $in: orderIds } });
  if (orders.length === 0) {
    res.status(404);
    throw new Error("Orders not found");
  }

  // Calculate total amount for the single PayMongo transaction
  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  try {
    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      {
        data: {
          attributes: {
            amount: Math.round(totalAmount * 100), // MUST be integer in cents
            payment_method_allowed: ["gcash", "paymaya"],
            currency: "PHP",
            description: `BakeReserve Orders: ${orderIds.join(", ")}`,
          },
        },
      },
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString(
              "base64",
            ),
          "Content-Type": "application/json",
        },
      },
    );

    const paymentIntentId = response.data.data.id;

    // Attach this single Intent ID to ALL associated orders
    await Promise.all(
      orders.map(async (order) => {
        order.paymentIntentId = paymentIntentId;
        await order.save();
      }),
    );

    res.json(response.data);
  } catch (error) {
    console.error("PayMongo error:", error.response?.data || error.message);
    res.status(500);
    throw new Error("PayMongo payment intent failed");
  }
};

// @desc Create the Payment Method (GCash / PayMaya)
export const createPaymentMethod = async (req, res) => {
  const { type } = req.body;

  if (!type) {
    res.status(400);
    throw new Error("Payment method type is required");
  }

  try {
    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_methods",
      { data: { attributes: { type } } },
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString(
              "base64",
            ),
          "Content-Type": "application/json",
        },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500);
    throw new Error("Create payment method failed");
  }
};

// @desc Attach Method to Intent and Return Auth URL
export const confirmPaymentIntent = async (req, res) => {
  const { paymentIntentId, paymentMethodId, returnUrl } = req.body; // Added dynamic returnUrl

  if (!paymentIntentId || !paymentMethodId) {
    res.status(400);
    throw new Error("Payment intent ID and payment method ID are required");
  }

  try {
    const response = await axios.post(
      `https://api.paymongo.com/v1/payment_intents/${paymentIntentId}/attach`,
      {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            return_url: returnUrl || "http://localhost:5173/payment/status", // Fallback
          },
        },
      },
      {
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(process.env.PAYMONGO_SECRET_KEY + ":").toString(
              "base64",
            ),
          "Content-Type": "application/json",
        },
      },
    );

    res.json(response.data);
  } catch (error) {
    res.status(500);
    throw new Error("Payment confirmation failed");
  }
};
