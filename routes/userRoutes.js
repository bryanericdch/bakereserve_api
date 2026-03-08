import express from "express";
import {
  updateUserProfile,
  getAllUsers,
  updateUserStatus,
  deleteUser,
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/profile").put(protect, updateUserProfile);

// ADMIN ROUTES
router.route("/").get(protect, admin, getAllUsers);
router.route("/:id/status").put(protect, admin, updateUserStatus);
router.route("/:id").delete(protect, admin, deleteUser);

export default router;
