import express from "express";
import { updateUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/profile").put(protect, updateUserProfile);

export default router;
