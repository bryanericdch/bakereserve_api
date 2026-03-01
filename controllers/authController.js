import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, contactNumber, password } = req.body;
  if (!firstName || !lastName || !email || !contactNumber || !password) {
    res.status(400);
    throw new Error("All fields are required");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    firstName,
    lastName,
    email,
    contactNumber,
    password: hashedPassword,
    verificationToken,
  });

  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const message = `<h2>Welcome to BakeReserve, ${firstName}!</h2><p>Please click the link below to verify your account.</p><a href="${verifyUrl}" style="background:#f59e0b; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block;">Verify Email</a>`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your BakeReserve Account",
      message,
    });
    res
      .status(201)
      .json({
        message:
          "Registration successful. Please check your email to verify your account.",
      });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    res.status(500);
    throw new Error("Email could not be sent. Please try again.");
  }
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification token.");
  }
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  res
    .status(200)
    .json({ message: "Email verified successfully. You can now login." });
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }
  if (!user.isVerified) {
    res.status(403);
    throw new Error("Please verify your email address to login.");
  }

  if (await bcrypt.compare(password, user.password)) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactNumber: user.contactNumber, // <-- FIXED
      address: user.address, // <-- NEW
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Password is incorrect");
  }
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error("No user found with that email address");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
  const message = `<h2>Password Reset Request</h2><p>Click the link below to set a new password:</p><a href="${resetUrl}" style="background:#f59e0b; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block;">Reset Password</a>`;

  try {
    await sendEmail({
      email: user.email,
      subject: "BakeReserve Password Reset",
      message,
    });
    res
      .status(200)
      .json({ message: "Password reset link sent to your email." });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Email could not be sent");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.resetToken)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired token");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  res
    .status(200)
    .json({ message: "Password reset successful. You can now login." });
});
