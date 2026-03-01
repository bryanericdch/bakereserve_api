import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

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
