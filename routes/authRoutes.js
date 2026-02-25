import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
} from "../controllers/authController.js";

const router = express.Router();
router.get("/verify-email/:token", verifyEmail);
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;
