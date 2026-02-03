import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

// @desc Register user
// @route POST /api/auth/register
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

  const user = await User.create({
    firstName,
    lastName,
    email,
    contactNumber,
    password: hashedPassword,
  });

  // --- UPDATED RESPONSE ---
  res.status(201).json({
    _id: user._id,
    firstName: user.firstName, // Send separately
    lastName: user.lastName, // Send separately
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
});

// @desc Login user
// @route POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User does not exist");
  }

  if (await bcrypt.compare(password, user.password)) {
    // --- UPDATED RESPONSE ---
    res.json({
      _id: user._id,
      firstName: user.firstName, // Send separately
      lastName: user.lastName, // Send separately
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Password is incorrect");
  }
});
