import express from "express";
import {
  addToCart,
  getCart,
  removeItem, // <--- CHANGED from removeCartItem
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getCart)
  .post(protect, addToCart)
  .delete(protect, clearCart);

router.route("/:itemId").delete(protect, removeItem); // <--- CHANGED from removeCartItem

export default router;
