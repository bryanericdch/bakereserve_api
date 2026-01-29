// import mongoose from "mongoose";

// const orderItemSchema = mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Product",
//     required: true,
//   },
//   name: {
//     type: String,
//     required: true,
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1,
//   },
//   price: {
//     type: Number,
//     required: true,
//   },
//   // Used only if product.category === "cake"
//   customization: {
//     flavor: String,
//     size: String,
//     design: String,
//     message: String,
//   },
//   requiresApproval: {
//     type: Boolean,
//     default: false,
//   },
// });

// const orderSchema = mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     orderItems: {
//       type: [orderItemSchema],
//       required: true,
//       validate: [(arr) => arr.length > 0, "Order must have items"],
//     },

//     pickupDate: {
//       type: Date,
//       required: true,
//     },
//     pickupTime: {
//       type: String,
//       required: true,
//     },
//     paymentMethod: {
//       type: String,
//       enum: ["cod", "ewallet"],
//       required: true,
//     },
//     paymentStatus: {
//       type: String,
//       enum: ["pending", "paid", "failed"],
//       default: "pending",
//     },
//     paymentResult: {
//       id: String,
//       status: String,
//       paidAt: Date,
//     },
//     paymentIntentId: {
//       type: String,
//     },
//     isPaid: {
//       type: Boolean,
//       default: false,
//     },
//     paidAt: {
//       type: Date,
//     },
//     orderStatus: {
//       type: String,
//       enum: [
//         "pending",
//         "approved",
//         "in_process",
//         "ready_for_pickup",
//         "completed",
//         "cancelled",
//         "rejected",
//       ],
//       default: "pending",
//     },
//     totalPrice: {
//       type: Number,
//       required: true,
//     },
//     approvedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//     approvedAt: Date,
//     cancelledAt: Date,
//   },
//   {
//     timestamps: true,
//   },
// );

// export default mongoose.model("Order", orderSchema);

import mongoose from "mongoose";

const orderItemSchema = mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  customization: {
    flavor: String,
    size: String,
    design: String,
    message: String,
  },
  requiresApproval: {
    type: Boolean,
    default: false,
  },
});

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderItems: {
      type: [orderItemSchema],
      required: true,
      validate: [(arr) => arr.length > 0, "Order must have items"],
    },

    pickupDate: {
      type: Date,
      required: true,
    },
    pickupTime: {
      type: String,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "ewallet"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    paymentIntentId: {
      type: String,
    },

    paymentResult: {
      id: String,
      status: String,
      paidAt: Date,
    },

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

    totalPrice: {
      type: Number,
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Order", orderSchema);
