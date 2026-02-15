import mongoose from "mongoose";

const orderItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  customization: {
    flavor: String,
    size: String,
    design: String,
    message: String,
    shape: String,
    tiers: String,
    notes: String,
    isCustomBuild: Boolean,
  },
  requiresApproval: { type: Boolean, default: false },
});

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItems: [orderItemSchema],

    // --- NEW FIELD ---
    orderType: {
      type: String,
      enum: ["cake", "bakery"],
      required: true,
    },

    pickupDate: { type: Date, required: true },
    pickupTime: { type: String, required: true },
    paymentMethod: { type: String, enum: ["cod", "ewallet"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentIntentId: { type: String },
    paymentResult: { id: String, status: String, paidAt: Date },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "approved",
        "in_process",
        "ready_for_pickup",
        "completed",
        "cancelled",
        "rejected",
      ],
      default: "pending",
    },

    totalPrice: { type: Number, required: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Order", orderSchema);
