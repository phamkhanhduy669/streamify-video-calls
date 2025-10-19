import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  getProfile,
  updateProfile,
} from "../controllers/user.controller.js";
import cacheMiddleware from "../middleware/cache.middleware.js";

const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);

// Cache danh sách người dùng đề xuất trong 60 giây
router.get("/", cacheMiddleware(60), getRecommendedUsers);

// Cache danh sách bạn bè trong 120 giây
router.get("/friends", cacheMiddleware(120), getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/me", getProfile);
router.put("/me", updateProfile);

// Cache danh sách lời mời kết bạn trong 30 giây (dữ liệu này thay đổi thường xuyên hơn)
router.get("/friend-requests", cacheMiddleware(30), getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

export default router;
