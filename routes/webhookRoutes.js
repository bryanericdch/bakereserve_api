import express from "express";
import { paymongoWebhook } from "../controllers/webhookController.js";

const router = express.Router();

// PayMongo requires RAW body
router.post(
  "/paymongo",
  express.raw({ type: "application/json" }),
  paymongoWebhook
);

export default router;
