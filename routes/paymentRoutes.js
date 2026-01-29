import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createPaymentIntent,
  confirmPaymentIntent,
  createPaymentMethod,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/intent", protect, createPaymentIntent);
router.post("/method", protect, createPaymentMethod);
router.post("/confirm", protect, confirmPaymentIntent);

export default router;
