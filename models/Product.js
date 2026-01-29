import mongoose from "mongoose";

const productSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ["bakery", "cake"],
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    image: {
      type: String, //imageURL or filepath
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Only used if  category is === "cake"
    customizationOptions: {
      flavors: [String],
      sizes: [String],
      designs: [String],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Product", productSchema);
