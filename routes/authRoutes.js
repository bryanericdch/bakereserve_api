import express from "express";
import {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

// IMPORT THE NEW VALIDATORS
import {
  registerValidator,
  loginValidator,
  validateRequest,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.get("/verify-email/:token", verifyEmail);

// INJECT VALIDATORS BEFORE THE CONTROLLER
router.post("/register", registerValidator, validateRequest, registerUser);
router.post("/login", loginValidator, validateRequest, loginUser);

router.post("/forgotpassword", forgotPassword);
router.put("/resetpassword/:resetToken", resetPassword);

export default router;
