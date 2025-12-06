import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getStreamToken, endCall } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/end-call", protectRoute, endCall); // Route mới để kết thúc cuộc gọi

export default router;