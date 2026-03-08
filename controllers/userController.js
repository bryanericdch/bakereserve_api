import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import Notification from "../models/Notification.js";

export const updateUserProfile = asyncHandler(async (req, res) => {
  // Select password so we can verify the current one
  const user = await User.findById(req.user._id).select("+password");

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.contactNumber = req.body.contactNumber || user.contactNumber;

    // Allow address to be updated (even if empty)
    if (req.body.address !== undefined) {
      user.address = req.body.address;
    }

    // --- NEW: PASSWORD CHANGE LOGIC ---
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        res.status(400);
        throw new Error("Current password is required to set a new password");
      }

      const isMatch = await bcrypt.compare(
        req.body.currentPassword,
        user.password,
      );
      if (!isMatch) {
        res.status(400);
        throw new Error("Current password is incorrect");
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.newPassword, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      contactNumber: updatedUser.contactNumber,
      address: updatedUser.address, // <-- NEW
      role: updatedUser.role,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

import Order from "../models/Order.js";

// @desc Admin: Get all customers with their purchase count
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "customer" }).select("-password");

  // Aggregate completed orders per user
  const usersWithStats = await Promise.all(
    users.map(async (user) => {
      const purchaseCount = await Order.countDocuments({
        user: user._id,
        orderStatus: "completed",
      });
      return { ...user._doc, purchaseCount };
    }),
  );

  res.json(usersWithStats);
});

// @desc Admin: Update user status (Warn or Ban)
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, warningMessage } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.accountStatus = status;
  user.warningMessage = status === "warned" ? warningMessage : "";
  await user.save();

  // --- NEW: CREATE WARNING NOTIFICATION ---
  if (status === "warned") {
    await Notification.create({
      user: user._id,
      title: "Account Warning ⚠",
      message: warningMessage,
      // You can use the title to determine where to link later
    });
  }

  res.json({ message: `User status updated to ${status}` });
});

// @desc Admin: Delete a user
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User account deleted permanently." });
});
