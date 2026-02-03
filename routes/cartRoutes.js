import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .post(protect, addToCart)
  .get(protect, getCart)
  .delete(protect, clearCart); // Clear All

router
  .route("/:itemId")
  .put(protect, updateCartItem) // Update Qty
  .delete(protect, removeCartItem); // Remove One

export default router;
