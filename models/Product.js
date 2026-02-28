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
    piecesPerPack: {
      type: mongoose.Schema.Types.Number,
      default: 1, // Default to 1 (useful for cakes)
    },
    category: {
      type: mongoose.Schema.Types.String,
      required: true,
      enum: ["bakery", "cake"],
    },
    // Added Flavor for Pre-made Cakes
    flavor: {
      type: mongoose.Schema.Types.String,
      required: false,
    },
    subCategory: {
      type: mongoose.Schema.Types.String,
      required: false,
      enum: [
        "Round Cake",
        "Square Cake",
        "Roll Cake",
        "Heart Cake",
        "Tiered Cake",
        "Sheet Cake",
        "Cupcake",
        "Pandesal",
        "Ensaymada",
        "Spanish Bread",
        "Kabayan",
        "Loaf",
        "Bun",
        "Toast",
        "Other",
      ],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Product = mongoose.model("Product", productSchema);
export default Product;
