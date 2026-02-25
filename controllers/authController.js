import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

// @desc Register user & Send Email
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

  // Generate Verification Token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  const user = await User.create({
    firstName,
    lastName,
    email,
    contactNumber,
    password: hashedPassword,
    verificationToken, // Save token
  });

  // Create verification URL
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const message = `
    <h2>Welcome to BakeReserve, ${firstName}!</h2>
    <p>Please click the link below to verify your account and start ordering.</p>
    <a href="${verifyUrl}" style="background:#f59e0b; color:white; padding:10px 20px; text-decoration:none; border-radius:5px; display:inline-block;">Verify Email</a>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Verify your BakeReserve Account",
      message,
    });
    res.status(201).json({
      message:
        "Registration successful. Please check your email to verify your account.",
    });
  } catch (error) {
    // If email fails, delete user so they can try again
    await User.findByIdAndDelete(user._id);
    res.status(500);
    throw new Error("Email could not be sent. Please try again.");
  }
});

// @desc Verify Email
export const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired verification token.");
  }

  user.isVerified = true;
  user.verificationToken = undefined; // Clear the token
  await user.save();

  res
    .status(200)
    .json({ message: "Email verified successfully. You can now login." });
});

// @desc Login user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  // --- NEW: BLOCK LOGIN IF NOT VERIFIED ---
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
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Password is incorrect");
  }
});
