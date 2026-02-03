import express from "express";
import { addToCart, getCart } from "../controllers/cartController.js"; // Import getCart
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, addToCart).get(protect, getCart); // Add GET route

export default router;
