import express from "express";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import cacheMiddleware from "../middleware/cache.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);

// Cache thông tin người dùng trong 5 phút
router.get("/me", protectRoute, cacheMiddleware(300), (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

export default router;
