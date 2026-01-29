import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(protect, adminOnly, upload.single("image"), createProduct);

router
  .route("/:id")
  .get(getProductById)
  .put(protect, adminOnly, upload.single("image"), updateProduct)
  .delete(protect, adminOnly, deleteProduct);

export default router;
