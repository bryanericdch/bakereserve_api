import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
} from "../controllers/authController.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();
router.get("/verify-email/:token", verifyEmail);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

export default router;
