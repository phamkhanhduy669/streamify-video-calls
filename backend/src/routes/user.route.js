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
  deleteFriend,
  searchUsers,
  getNotifications,
  markNotificationRead,
  declineFriendRequest
} from "../controllers/user.controller.js";
import { getRandomWord ,translateText} from "../controllers/word.controller.js";


const router = express.Router();

// apply auth middleware to all routes
router.use(protectRoute);
router.get("/search", protectRoute, searchUsers);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);
router.get("/word/:language", getRandomWord);
router.post("/translate", translateText);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);

router.get("/me", getProfile);
router.put("/me", updateProfile);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);
router.delete("/friends/:id", deleteFriend);
router.delete("/friend-request/read/:requestId", markNotificationRead);
router.get("/notifications", protectRoute, getNotifications);
router.put("/notifications/:id/read", protectRoute, markNotificationRead)
router.delete("/friend-request/:id/decline", protectRoute, declineFriendRequest);
export default router;
