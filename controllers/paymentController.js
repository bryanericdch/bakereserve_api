import axios from "axios";
import Order from "../models/Order.js";

export const createPaymentIntent = async (req, res) => {
  const { orderIds, customerName, customerEmail } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400);
    throw new Error("Order IDs are required");
  }

  const orders = await Order.find({ _id: { $in: orderIds } });
  if (orders.length === 0) {
    res.status(404);
    throw new Error("Orders not found");
  }

  const totalAmount = orders.reduce((acc, order) => acc + order.totalPrice, 0);

  try {
    const response = await axios.post(
      "https://api.paymongo.com/v1/payment_intents",
      {
        data: {
          attributes: {
            amount: Math.round(totalAmount * 100),
            payment_method_allowed: ["gcash", "paymaya"],
            currency: "PHP",
            description: `Orders: ${orderIds.join(", ")} | Customer: ${customerName}`,
            metadata: { customerEmail, customerName },
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

    await Promise.all(
      orders.map(async (order) => {
        order.paymentIntentId = paymentIntentId;
        await order.save();
      }),
    );

    res.json(response.data);
  } catch (error) {
    res.status(500);
    throw new Error("PayMongo payment intent failed");
  }
};

export const createPaymentMethod = async (req, res) => {
  const { type, name, email, phone } = req.body;

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
            billing: { name, email, phone },
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
    throw new Error("Create payment method failed");
  }
};

export const confirmPaymentIntent = async (req, res) => {
  const { paymentIntentId, paymentMethodId, returnUrl } = req.body;

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
            return_url: returnUrl || "bakereserve://payment/status",
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
