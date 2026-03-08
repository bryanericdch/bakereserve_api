import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    contactNumber: { type: String, required: true },
    address: { type: String, default: "" },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    isVerified: { type: Boolean, default: false },

    // --- NEW: USER MANAGEMENT FIELDS ---
    accountStatus: {
      type: String,
      enum: ["active", "warned", "banned"],
      default: "active",
    },
    warningMessage: { type: String, default: "" },
    cancellationCount: { type: Number, default: 0 },

    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
