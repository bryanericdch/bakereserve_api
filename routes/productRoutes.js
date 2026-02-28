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

// 👇 IMPORT THE NEW UPDATE VALIDATOR
import {
  productValidator,
  productUpdateValidator,
  validateRequest,
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router
  .route("/")
  .get(getProducts)
  .post(
    protect,
    adminOnly,
    upload.single("image"),
    productValidator,
    validateRequest,
    createProduct,
  );

router
  .route("/:id")
  .get(getProductById)
  .put(
    protect,
    adminOnly,
    upload.single("image"),
    productUpdateValidator, // 👇 USE THE UPDATE VALIDATOR HERE
    validateRequest,
    updateProduct,
  )
  .delete(protect, adminOnly, deleteProduct);

export default router;
