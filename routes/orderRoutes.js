import express from "express";
import {
  checkout,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// CUSTOMER
router.post("/checkout", protect, checkout);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);

// ADMIN
router.get("/", protect, admin, getAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
