import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    name: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    image: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    description: {
      type: mongoose.Schema.Types.String,
      required: true,
    },
    price: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    countInStock: {
      type: mongoose.Schema.Types.Number,
      required: true,
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.String,
      required: true,
      enum: ["bakery", "cake"],
    },
    // --- UPDATED: STRICT CAKE TYPES ---
    subCategory: {
      type: mongoose.Schema.Types.String,
      required: false, // Optional for bakery items
      enum: [
        "Round Cake",
        "Square Cake",
        "Roll Cake",
        "Heart Cake",
        "Tiered Cake",
        "Sheet Cake",
        "Cupcake",
      ],
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);

export default Product;
