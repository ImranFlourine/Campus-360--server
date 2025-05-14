import express from "express";
import { createCheckoutSession, getAllPurchasedCourse, getCourseDetailWithPurchaseStatus, stripeWebhook, verifyEnrollment } from "../controllers/coursePurchase.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create-checkout-session", isAuthenticated, createCheckoutSession);
router.post("/webhook", stripeWebhook);
router.get("/course/:courseId", isAuthenticated, getCourseDetailWithPurchaseStatus);
router.get("/all", getAllPurchasedCourse);
router.get("/verify/:courseId", isAuthenticated, verifyEnrollment);

export default router; 