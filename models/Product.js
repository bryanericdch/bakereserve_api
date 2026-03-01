import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: mongoose.Schema.Types.String, required: true },
    image: { type: mongoose.Schema.Types.String, required: true },
    description: { type: mongoose.Schema.Types.String, required: true },
    price: { type: mongoose.Schema.Types.Number, required: true, default: 0 },
    countInStock: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    piecesPerPack: { type: mongoose.Schema.Types.Number, default: 1 },
    category: {
      type: mongoose.Schema.Types.String,
      required: true,
      enum: ["bakery", "cake"],
    },
    flavor: { type: mongoose.Schema.Types.String, required: false },
    subCategory: { type: mongoose.Schema.Types.String, required: false },

    // --- NEW: CAKE SIZES & PRICES ---
    sizes: [
      {
        size: { type: String, required: true }, // e.g., "6 inches"
        price: { type: Number, required: true }, // e.g., 500
      },
    ],

    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model("Product", productSchema);
