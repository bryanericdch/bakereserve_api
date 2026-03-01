import mongoose from "mongoose";

const cartItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1, default: 1 },
  customization: {
    flavor: String,
    size: String,
    message: String,
    shape: String,
    tiers: String,
    notes: String,
    isCustomBuild: Boolean, // <--- ADDED THIS FIELD
  },
});

const cartSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
  },
  {
    timestamps: true,
  },
);

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
