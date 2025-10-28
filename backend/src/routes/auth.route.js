import express from "express";
import { login, logout, onboard, signup } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import passport from "passport";
import { googleCallback } from "../controllers/auth.controller.js"; // <-- Thêm hàm mới

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.post("/onboarding", protectRoute, onboard);

// check if user is logged in
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
// 1. Route để bắt đầu đăng nhập (chuyển hướng đến Google)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Yêu cầu thông tin profile và email
    session: false, // Không dùng session
  })
);

// 2. Route callback (Google chuyển hướng về đây sau khi user đồng ý)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`, // Về trang login nếu thất bại
    session: false, // Không dùng session
  }),
  googleCallback // <-- Gọi controller nếu thành công
);

export default router;
