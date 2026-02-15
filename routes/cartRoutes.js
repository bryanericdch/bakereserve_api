import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem, // <--- MATCHING NAME
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getCart)
  .post(protect, addToCart)
  .delete(protect, clearCart);

router
  .route("/:itemId")
  .put(protect, updateCartItem)
  .delete(protect, removeCartItem);

export default router;
