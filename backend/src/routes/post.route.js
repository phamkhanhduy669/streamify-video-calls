import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getPosts, createPost, likePost, commentPost, deletePost} from "../controllers/post.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getPosts);
router.post("/", createPost);
router.put("/:id/like", likePost);
router.post("/:id/comment", commentPost);
router.delete("/:id", deletePost);
export default router;