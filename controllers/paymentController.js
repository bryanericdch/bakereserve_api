import axios from "axios";
import Order from "../models/Order.js";

export const createPaymentIntent = async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (order.paymentMethod !== "ewallet") {
    res.status(400);
    throw new Error("Order does not require online payment");
  }

  try {
    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      {
        data: {
          attributes: {
            amount: Math.round(order.totalPrice * 100), // MUST be integer
            payment_method_allowed: ["gcash", "paymaya"],
            currency: "PHP",
            description: `BakeReserve Order ${order._id}`,
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
    order.paymentIntentId = paymentIntent.data.id;
    await order.save();
  } catch (error) {
    console.error("PayMongo error:", error.response?.data || error.message);
    res.status(500);
    throw new Error("PayMongo payment intent failed");
  }
};

export const createPaymentMethod = async (req, res) => {
  const { type } = req.body; // "gcash" or "paymaya"

  if (!type) {
    res.status(400);
    throw new Error("Payment method type is required");
  }

  try {
    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_methods",
      {
        data: {
          attributes: {
            type,
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
    console.error(
      "PayMongo create method error:",
      error.response?.data || error.message,
    );
    res.status(500);
    throw new Error("Create payment method failed");
  }
};

export const confirmPaymentIntent = async (req, res) => {
  const { paymentIntentId, paymentMethodId } = req.body;

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
            return_url: "http://localhost:3000/payment/success",
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
    console.error(
      "🔴 PAYMONGO ATTACH ERROR:",
      JSON.stringify(error.response?.data, null, 2),
    );
    res.status(500);
    throw new Error("Payment confirmation failed");
  }
};
