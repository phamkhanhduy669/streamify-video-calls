import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
        type: String, 
        enum: ["like", "comment", "friend_request"], 
        required: true 
    },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }, // Chỉ dùng cho like/comment
    read: { type: Boolean, default: false },
    message: { type: String }
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;